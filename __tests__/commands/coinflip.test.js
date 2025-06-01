const { MessageFlags } = require('discord.js');
const coinflip = require('../../commands/coinflip');

function createInteraction({ subcommand, userId = 'u1', opponentId = 'u2', choice = 'heads', testerRole = false } = {}) {
  const interaction = {
    options: {
      getSubcommand: jest.fn(() => subcommand),
      getUser: jest.fn(() => ({ id: opponentId })),
      getString: jest.fn(() => choice),
    },
    user: { id: userId },
    guild: {
      members: {
        fetch: jest.fn(id => Promise.resolve({
          id,
          displayName: id === userId ? 'Challenger' : 'Opponent',
          roles: { cache: testerRole ? new Map([['tester', {}]]) : new Map() }
        }))
      },
      roles: {
        cache: {
          find: jest.fn(() => testerRole ? { id: 'tester' } : null)
        }
      }
    },
    reply: jest.fn(() => Promise.resolve()),
  };
  return interaction;
}

describe('coinflip command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('disallows self challenge without tester role', async () => {
    const interaction = createInteraction({ subcommand: 'challenge', opponentId: 'u1', testerRole: false });
    await coinflip.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining("can’t challenge yourself"),
      flags: MessageFlags.Ephemeral
    }));
  });

  test('notifies when no pending challenge on call', async () => {
    const interaction = createInteraction({ subcommand: 'call', choice: 'heads' });
    await coinflip.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('no pending coin flip'),
      flags: MessageFlags.Ephemeral
    }));
  });
});
