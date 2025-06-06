jest.mock('../../../db/models', () => { const findAll = jest.fn(); return { CalendarConfig: { findAll }, __esModule: true, __mock: { findAll } }; });

jest.mock('discord.js', () => ({ StringSelectMenuBuilder: class { setCustomId(){return this;} setPlaceholder(){return this;} addOptions(){return this;} }, ActionRowBuilder: class { addComponents(){return this;} } }));

const { CalendarConfig, __mock } = require('../../../db/models');
const findAll = CalendarConfig.findAll;
const handler = require('../../../commands/calendar/set-daterange');

describe('calendar set-daterange', () => {
  beforeEach(() => jest.clearAllMocks());

  test('invalid date format', async () => {
    const reply = jest.fn();
    const options = { getString: jest.fn(() => 'bad') };
    await handler({ options, reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('single calendar updates', async () => {
    const update = jest.fn();
    findAll.mockResolvedValue([{ label: 'a', calendarId: 'id', update }]);
    const reply = jest.fn();
    const options = { getString: jest.fn(key => key === 'start' ? '2023-01-01' : '2023-01-02') };
    await handler({ options, reply }, 'g');
    expect(update).toHaveBeenCalled();
    expect(reply).toHaveBeenCalled();
  });

  test('invalid date values', async () => {
    const reply = jest.fn();
    const options = { getString: jest.fn(key => key === 'start' ? '2023-99-99' : '2023-01-01') };
    await handler({ options, reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('start after end', async () => {
    const reply = jest.fn();
    const options = { getString: jest.fn(key => key === 'start' ? '2023-01-02' : '2023-01-01') };
    await handler({ options, reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('multiple calendars shows select', async () => {
    findAll.mockResolvedValue([
      { calendarId: 'a', label: 'A' },
      { calendarId: 'b', label: 'B' }
    ]);
    const reply = jest.fn();
    const options = { getString: jest.fn(key => key === 'start' ? '2023-01-01' : '2023-01-02') };
    await handler({ options, reply }, 'g');
    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true, components: expect.any(Array) })
    );
  });
});
