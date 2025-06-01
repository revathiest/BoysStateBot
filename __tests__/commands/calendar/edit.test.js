jest.mock('../../../db/models/CalendarConfig', () => {
  const findAll = jest.fn();
  return { findAll, __esModule: true, __mock: { findAll } };
});

jest.mock('discord.js', () => {
  class Fake { setCustomId(){return this;} setTitle(){return this;} addComponents(){return this;} setLabel(){return this;} setStyle(){return this;} setRequired(){return this;} setPlaceholder(){return this;} addOptions(){return this;} }
  return { ModalBuilder: Fake, TextInputBuilder: Fake, TextInputStyle: { Short: 1 }, ActionRowBuilder: Fake, StringSelectMenuBuilder: Fake, StringSelectMenuOptionBuilder: Fake };
});

const { __mock } = require('../../../db/models/CalendarConfig');
const findAll = __mock.findAll;
const edit = require('../../../commands/calendar/edit');

describe('calendar edit', () => {
  beforeEach(() => jest.clearAllMocks());

  test('replies when no calendars', async () => {
    findAll.mockResolvedValue([]);
    const reply = jest.fn();
    await edit({ reply }, 'g1');
    expect(reply).toHaveBeenCalled();
  });

  test('shows modal when one calendar', async () => {
    findAll.mockResolvedValue([{ id: 2 }]);
    const showModal = jest.fn();
    await edit({ showModal }, 'g1');
    expect(showModal).toHaveBeenCalled();
  });
});
