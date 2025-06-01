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

describe('dailySchedulePoster', () => {
  beforeEach(() => jest.clearAllMocks());

  test('isTodayMountain detects same day', () => {
    const now = new Date();
    expect(isTodayMountain(now)).toBe(true);
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
});
