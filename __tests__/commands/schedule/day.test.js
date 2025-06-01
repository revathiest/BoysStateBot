jest.mock('../../../db/models', () => {
  const findOne = jest.fn();
  const findAll = jest.fn();
  return { CalendarConfig: { findOne }, CalendarEvent: { findAll }, __esModule: true, __mock: { findOne, findAll } };
});

jest.mock('../../../utils/scheduleFormatter', () => jest.fn(() => 'list'));
jest.mock('../../../utils/scheduleEmbedBuilder', () => jest.fn(() => ({ data: {} })));

const { __mock } = require('../../../db/models');
const configFind = __mock.findOne;
const eventFind = __mock.findAll;
const dayCmd = require('../../../commands/schedule/day');

const scheduleEmbedBuilder = require('../../../utils/scheduleEmbedBuilder');

describe('schedule day', () => {
  beforeEach(() => jest.clearAllMocks());

  test('no config', async () => {
    configFind.mockResolvedValue(null);
    const reply = jest.fn();
    const options = { getString: jest.fn(() => 'monday') };
    await dayCmd({ options, reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('shows events', async () => {
    configFind.mockResolvedValue({ startDate: '2023-01-01', endDate: '2023-12-31' });
    eventFind.mockResolvedValue([{ id:1 }]);
    const reply = jest.fn();
    const options = { getString: jest.fn(() => 'monday') };
    await dayCmd({ options, reply }, 'g');
    expect(eventFind).toHaveBeenCalled();
    expect(scheduleEmbedBuilder).toHaveBeenCalled();
    expect(reply).toHaveBeenCalled();
  });
});
