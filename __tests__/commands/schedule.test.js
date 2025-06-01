jest.mock('../../commands/schedule/today', () => jest.fn());
jest.mock('../../commands/schedule/next', () => jest.fn());
jest.mock('../../commands/schedule/week', () => jest.fn());
jest.mock('../../commands/schedule/day', () => jest.fn());

const today = require('../../commands/schedule/today');
const next = require('../../commands/schedule/next');
const week = require('../../commands/schedule/week');
const day = require('../../commands/schedule/day');
const schedule = require('../../commands/schedule');

describe('schedule command', () => {
  beforeEach(() => jest.clearAllMocks());

  test('routes subcommands correctly', async () => {
    const interaction = {
      guild: { id: 'g1' },
      options: { getSubcommand: jest.fn() }
    };

    interaction.options.getSubcommand.mockReturnValue('today');
    await schedule.execute(interaction);
    expect(today).toHaveBeenCalledWith(interaction, 'g1');

    interaction.options.getSubcommand.mockReturnValue('next');
    await schedule.execute(interaction);
    expect(next).toHaveBeenCalledWith(interaction, 'g1');

    interaction.options.getSubcommand.mockReturnValue('week');
    await schedule.execute(interaction);
    expect(week).toHaveBeenCalledWith(interaction, 'g1');

    interaction.options.getSubcommand.mockReturnValue('day');
    await schedule.execute(interaction);
    expect(day).toHaveBeenCalledWith(interaction, 'g1');
  });
});
