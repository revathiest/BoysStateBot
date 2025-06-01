jest.mock('../../../db/models', () => { const findOne = jest.fn(); const findAll = jest.fn(); return { CalendarConfig: { findOne }, CalendarEvent: { findAll }, __esModule: true, __mock: { findOne, findAll } }; });
jest.mock('../../../utils/scheduleFormatter', () => jest.fn(() => 'list'));
jest.mock('../../../utils/scheduleEmbedBuilder', () => jest.fn(() => ({ data: {} })));

const { __mock } = require('../../../db/models');
const configFind = __mock.findOne;
const eventFind = __mock.findAll;
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
});
