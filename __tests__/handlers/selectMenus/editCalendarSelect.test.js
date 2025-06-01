jest.mock('discord.js', () => {
  class FakeModal { setCustomId(id){ this.id=id; return this; } setTitle(){return this;} addComponents(){return this;} }
  class FakeText { setCustomId(){return this;} setLabel(){return this;} setStyle(){return this;} setRequired(){return this;} }
  class FakeRow { addComponents(){return this;} }
  const TextInputStyle = { Short: 1 };
  return { ModalBuilder: FakeModal, TextInputBuilder: FakeText, TextInputStyle, ActionRowBuilder: FakeRow };
});

jest.mock('../../../db/models/CalendarConfig', () => {
  const findByPk = jest.fn();
  return { findByPk, __esModule: true, __mock: { findByPk } };
});

const { __mock } = require('../../../db/models/CalendarConfig');
const findByPk = __mock.findByPk;

const handler = require('../../../handlers/selectMenus/editCalendarSelect');

describe('editCalendarSelect', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('handles missing calendar', async () => {
    findByPk.mockResolvedValue(null);
    const update = jest.fn();
    const interaction = { values: ['1'], update };
    await handler(interaction);
    expect(update).toHaveBeenCalledWith({ content: '❌ Calendar not found.', components: [] });
  });

  it('shows modal for existing calendar', async () => {
    findByPk.mockResolvedValue({ id: 2 });
    const showModal = jest.fn();
    const interaction = { values: ['2'], showModal };
    await handler(interaction);
    expect(showModal).toHaveBeenCalledWith(expect.objectContaining({ id: 'edit_calendar_modal_2' }));
  });
});
