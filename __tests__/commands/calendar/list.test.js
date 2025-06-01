jest.mock('../../../db/models/CalendarConfig', () => { const findAll = jest.fn(); return { findAll, __esModule: true, __mock: { findAll } }; });
const { __mock } = require('../../../db/models/CalendarConfig');
const findAll = __mock.findAll;
const list = require('../../../commands/calendar/list');

describe('calendar list', () => {
  beforeEach(() => jest.clearAllMocks());

  test('replies when none', async () => {
    findAll.mockResolvedValue([]);
    const reply = jest.fn();
    await list({ reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('lists calendars', async () => {
    findAll.mockResolvedValue([{ calendarId: 'id', label: 'label' }]);
    const reply = jest.fn();
    await list({ reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });
});
