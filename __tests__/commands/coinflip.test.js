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

  test('issues a challenge and completes it', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.3);
    const guild = createInteraction({ subcommand: 'challenge' }).guild;
    const challengeInteraction = createInteraction({ subcommand: 'challenge' });
    challengeInteraction.guild = guild;
    await coinflip.execute(challengeInteraction);
    expect(challengeInteraction.reply).toHaveBeenCalledWith(expect.stringContaining('has challenged'));

    const callInteraction = createInteraction({ subcommand: 'call', userId: 'u2', opponentId: 'u1', choice: 'heads' });
    callInteraction.guild = guild;
    callInteraction.client = { users: { fetch: jest.fn(id => Promise.resolve({ id })) } };
    callInteraction.reply = jest.fn(() => Promise.resolve());
    await coinflip.execute(callInteraction);
    expect(callInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array) }));
    Math.random.mockRestore();
  });

  test('allows self challenge with tester role', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.3);
    const interaction = createInteraction({ subcommand: 'challenge', opponentId: 'u1', testerRole: true });
    await coinflip.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('has challenged'));
    Math.random.mockRestore();
  });

  test('rejects challenge when one is already pending', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.3);
    const guild = createInteraction({ subcommand: 'challenge' }).guild;
    const first = createInteraction({ subcommand: 'challenge' });
    first.guild = guild;
    await coinflip.execute(first);
    const second = createInteraction({ subcommand: 'challenge' });
    second.guild = guild;
    await coinflip.execute(second);
    expect(second.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('already has a pending'), flags: MessageFlags.Ephemeral }));
    Math.random.mockRestore();
  });
});
