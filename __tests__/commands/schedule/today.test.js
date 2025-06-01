jest.mock('../../../db/models', () => { const findOne = jest.fn(); const findAll = jest.fn(); return { CalendarConfig: { findOne }, CalendarEvent: { findAll }, __esModule: true, __mock: { findOne, findAll } }; });
jest.mock('../../../utils/scheduleFormatter', () => jest.fn(() => 'list'));
jest.mock('../../../utils/scheduleEmbedBuilder', () => jest.fn(() => ({ data: {} })));

const { __mock } = require('../../../db/models');
const configFind = __mock.findOne;
const eventFind = __mock.findAll;
const scheduleEmbedBuilder = require('../../../utils/scheduleEmbedBuilder');
const todayCmd = require('../../../commands/schedule/today');

describe('schedule today', () => {
  beforeEach(() => jest.clearAllMocks());

  test('no events today', async () => {
    configFind.mockResolvedValue({ startDate: '2023-01-01', endDate: '2023-12-31' });
    eventFind.mockResolvedValue([]);
    const reply = jest.fn();
    await todayCmd({ reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('calendar not configured', async () => {
    configFind.mockResolvedValue(null);
    const reply = jest.fn();
    await todayCmd({ reply }, 'g');
    expect(scheduleEmbedBuilder).toHaveBeenCalledWith(
      '⚠️ Calendar Range Not Configured',
      'Configure a calendar date range first.',
      0xFFAA00
    );
    expect(reply).toHaveBeenCalled();
  });

  test('shows events list', async () => {
    configFind.mockResolvedValue({ startDate: '2023-01-01', endDate: '2023-12-31' });
    eventFind.mockResolvedValue([{ startTime: new Date(), summary: 'event' }]);
    const reply = jest.fn();
    await todayCmd({ reply }, 'g');
    expect(eventFind).toHaveBeenCalled();
    expect(scheduleEmbedBuilder).toHaveBeenCalledWith("Today's Schedule", 'list');
    expect(reply).toHaveBeenCalled();
  });

  test('handles errors gracefully', async () => {
    configFind.mockRejectedValue(new Error('fail'));
    const reply = jest.fn();
    await todayCmd({ reply }, 'g');
    expect(scheduleEmbedBuilder).toHaveBeenCalledWith(
      'Today’s Schedule',
      'No events scheduled for today.',
      0xCCCCCC
    );
    expect(reply).toHaveBeenCalled();
  });
});
