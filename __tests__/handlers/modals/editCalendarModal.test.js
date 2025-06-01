jest.mock('../../../db/models/CalendarConfig', () => {
  const findByPk = jest.fn();
  return { findByPk, __esModule: true, __mock: { findByPk } };
});

const { __mock } = require('../../../db/models/CalendarConfig');
const findByPk = __mock.findByPk;

const handler = require('../../../handlers/modals/editCalendarModal');

describe('editCalendarModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replies when calendar not found', async () => {
    findByPk.mockResolvedValue(null);
    const reply = jest.fn();
    const interaction = {
      customId: 'edit_calendar_modal_1',
      fields: { getTextInputValue: jest.fn(() => 'new') },
      reply,
    };
    await handler(interaction);
    expect(reply).toHaveBeenCalled();
  });

  it('updates label and replies', async () => {
    const update = jest.fn();
    findByPk.mockResolvedValue({ id: 1, calendarId: 'cal', update });
    const reply = jest.fn();
    const interaction = {
      customId: 'edit_calendar_modal_1',
      fields: { getTextInputValue: jest.fn(() => 'new') },
      reply,
    };
    await handler(interaction);
    expect(update).toHaveBeenCalledWith({ label: 'new' });
    expect(reply).toHaveBeenCalled();
  });
});
