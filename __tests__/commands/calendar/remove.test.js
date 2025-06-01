jest.mock('../../../db/models/CalendarConfig', () => { const findAll = jest.fn(); return { findAll, __esModule: true, __mock: { findAll } }; });
const { __mock } = require('../../../db/models/CalendarConfig');
const findAll = __mock.findAll;
const remove = require('../../../commands/calendar/remove');

describe('calendar remove', () => {
  beforeEach(() => jest.clearAllMocks());

  test('no calendars', async () => {
    findAll.mockResolvedValue([]);
    const reply = jest.fn();
    await remove({ reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('one calendar', async () => {
    const destroy = jest.fn();
    findAll.mockResolvedValue([{ id:1, calendarId:'c', destroy }]);
    const reply = jest.fn();
    await remove({ reply }, 'g');
    expect(destroy).toHaveBeenCalled();
    expect(reply).toHaveBeenCalled();
  });
});
