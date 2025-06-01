jest.mock('../../../db/models/CalendarConfig', () => { const findAll = jest.fn(); return { findAll, __esModule: true, __mock: { findAll } }; });

jest.mock('discord.js', () => {
  class Fake { setCustomId(){return this;} setPlaceholder(){return this;} addOptions(){return this;} setLabel(){return this;} setValue(){return this;} setDescription(){return this;} addComponents(){return this;} }
  return { ActionRowBuilder: Fake, StringSelectMenuBuilder: Fake, StringSelectMenuOptionBuilder: Fake };
});
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

  test('shows menu when multiple calendars', async () => {
    findAll.mockResolvedValue([
      { id: 1, label: 'a', calendarId: 'c1' },
      { id: 2, label: 'b', calendarId: 'c2' }
    ]);
    const reply = jest.fn();
    await remove({ reply }, 'g');
    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true, components: expect.any(Array) })
    );
  });
});
