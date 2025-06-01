jest.mock('../../../db/models', () => { const findOne = jest.fn(); const findOneEvent = jest.fn(); return { CalendarConfig: { findOne }, CalendarEvent: { findOne: findOneEvent }, __esModule: true, __mock: { findOne, findOneEvent } }; });
jest.mock('../../../utils/scheduleFormatter', () => jest.fn(() => 'list'));
jest.mock('../../../utils/scheduleEmbedBuilder', () => jest.fn(() => ({ data: {} })));

const { __mock } = require('../../../db/models');
const configFind = __mock.findOne;
const eventFind = __mock.findOneEvent;
const nextCmd = require('../../../commands/schedule/next');
const scheduleEmbedBuilder = require('../../../utils/scheduleEmbedBuilder');

describe('schedule next', () => {
  beforeEach(() => jest.clearAllMocks());

  test('no upcoming event', async () => {
    configFind.mockResolvedValue({ startDate: '2023-01-01', endDate: '2023-12-31' });
    eventFind.mockResolvedValue(null);
    const reply = jest.fn();
    await nextCmd({ reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('shows next event', async () => {
    configFind.mockResolvedValue({ startDate: '2023-01-01', endDate: '2023-12-31' });
    eventFind.mockResolvedValue({});
    const reply = jest.fn();
    await nextCmd({ reply }, 'g');
    expect(scheduleEmbedBuilder).toHaveBeenCalled();
    expect(reply).toHaveBeenCalled();
  });
});
