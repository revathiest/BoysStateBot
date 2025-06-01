jest.mock('../../../db/models/CalendarConfig', () => {
  const findByPk = jest.fn();
  return { findByPk, __esModule: true, __mock: { findByPk } };
});

const { __mock } = require('../../../db/models/CalendarConfig');
const findByPk = __mock.findByPk;

const handler = require('../../../handlers/selectMenus/removeCalendarSelect');

describe('removeCalendarSelect', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('handles missing calendar', async () => {
    findByPk.mockResolvedValue(null);
    const update = jest.fn();
    const interaction = { values: ['1'], update };
    await handler(interaction);
    expect(update).toHaveBeenCalledWith({ content: '❌ Calendar not found.', components: [] });
  });

  it('destroys calendar and updates', async () => {
    const destroy = jest.fn();
    findByPk.mockResolvedValue({ id: 2, calendarId: 'cal', destroy });
    const update = jest.fn();
    const interaction = { values: ['2'], update };
    await handler(interaction);
    expect(destroy).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });
});
