jest.mock('../../db/models', () => ({
  ScheduleChannel: { findOne: jest.fn(), findAll: jest.fn() },
  CalendarEvent: { findAll: jest.fn() },
  __esModule: true
}));

const { ScheduleChannel, CalendarEvent } = require('../../db/models');
const { postScheduleForToday, isTodayMountain } = require('../../utils/dailySchedulePoster');

const mockChannel = () => ({
  send: jest.fn().mockResolvedValue({ id: 'm1' }),
  messages: { fetch: jest.fn().mockResolvedValue({ edit: jest.fn() }) }
});

const getMountainOffset = (date) => {
  const year = date.getUTCFullYear();
  const dstStart = new Date(Date.UTC(year, 2, 8, 9));
  while (dstStart.getUTCDay() !== 0) dstStart.setUTCDate(dstStart.getUTCDate() + 1);
  const dstEnd = new Date(Date.UTC(year, 10, 1, 8));
  while (dstEnd.getUTCDay() !== 0) dstEnd.setUTCDate(dstEnd.getUTCDate() + 1);
  const inDst = date >= dstStart && date < dstEnd;
  return (inDst ? -6 : -7) * 60 * 60 * 1000;
};

const parseDateInDenver = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const offset = -getMountainOffset(utc);
  return new Date(utc.getTime() + offset);
};

describe('dailySchedulePoster', () => {
  beforeEach(() => jest.clearAllMocks());

  test('isTodayMountain detects same day', () => {
    const now = new Date();
    expect(isTodayMountain(now)).toBe(true);
  });

  test('isTodayMountain handles all-day events', () => {
    const now = new Date();
    const mtDate = new Date(now.getTime() - getMountainOffset(now));
    const dateStr = mtDate.toISOString().slice(0, 10);
    const allDayUtc = parseDateInDenver(dateStr);
    expect(isTodayMountain(allDayUtc)).toBe(true);
  });

  test('posts new message when none exists', async () => {
    ScheduleChannel.findOne.mockResolvedValue({ guildId: 'g', channelId: '1', save: jest.fn() });
    CalendarEvent.findAll.mockResolvedValue([]);
    const client = { channels: { fetch: jest.fn().mockResolvedValue(mockChannel()) } };
    await postScheduleForToday(client, 'g');
    expect(client.channels.fetch).toHaveBeenCalledWith('1');
  });

  test('edits existing message', async () => {
    const edit = jest.fn();
    ScheduleChannel.findOne.mockResolvedValue({ guildId: 'g', channelId: '1', messageId: 'm1', save: jest.fn() });
    CalendarEvent.findAll.mockResolvedValue([]);
    const client = {
      channels: {
        fetch: jest.fn().mockResolvedValue({
          messages: { fetch: jest.fn().mockResolvedValue({ edit }) },
          send: jest.fn()
        })
      }
    };
    await postScheduleForToday(client, 'g');
    expect(edit).toHaveBeenCalled();
  });

  test('calculates Mountain day bounds correctly', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-06-01T12:00:00Z'));
    ScheduleChannel.findOne.mockResolvedValue({ guildId: 'g', channelId: '1', save: jest.fn() });
    CalendarEvent.findAll.mockResolvedValue([]);
    const client = { channels: { fetch: jest.fn().mockResolvedValue(mockChannel()) } };
    await postScheduleForToday(client, 'g');
    const where = CalendarEvent.findAll.mock.calls[0][0].where;
    const { Op } = require('sequelize');
    const [start, end] = where.startTime[Op.between];
    expect(start.toISOString()).toBe('2025-06-01T06:00:00.000Z');
    expect(end.toISOString()).toBe('2025-06-02T05:59:59.999Z');
    jest.useRealTimers();
  });
});
