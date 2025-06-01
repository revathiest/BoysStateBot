const { MessageFlags } = require('discord.js');
const highcard = require('../../commands/highcard');

function baseGuild(testerRole = false) {
  return {
    members: {
      fetch: jest.fn(id => Promise.resolve({
        id,
        displayName: id,
        roles: { cache: testerRole ? new Map([['tester', {}]]) : new Map() }
      }))
    },
    roles: { cache: { find: jest.fn(() => testerRole ? { id: 'tester' } : null) } }
  };
}

describe('highcard command', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects self challenge without tester role', async () => {
    const interaction = {
      options: {
        getSubcommand: jest.fn(() => 'challenge'),
        getUser: jest.fn(() => ({ id: 'u1' })),
      },
      user: { id: 'u1' },
      guild: baseGuild(false),
      reply: jest.fn(() => Promise.resolve()),
    };
    await highcard.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('can’t challenge yourself'),
      flags: MessageFlags.Ephemeral
    }));
  });

  test('notifies when accepting with no challenge', async () => {
    const interaction = {
      options: { getSubcommand: jest.fn(() => 'accept') },
      user: { id: 'u1' },
      guild: baseGuild(false),
      reply: jest.fn(() => Promise.resolve()),
    };
    await highcard.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('no pending challenges'),
      flags: MessageFlags.Ephemeral
    }));
  });

  test('issues a challenge successfully', async () => {
    const interaction = {
      options: { getSubcommand: jest.fn(() => 'challenge'), getUser: jest.fn(() => ({ id: 'u2' })) },
      user: { id: 'u1' },
      guild: baseGuild(false),
      reply: jest.fn(() => Promise.resolve()),
    };
    await highcard.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('high-card duel'),
    }));
  });

  test('accepts a challenge and declares winner', async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);

    const guild = baseGuild(false);
    const challengeInteraction = {
      options: { getSubcommand: jest.fn(() => 'challenge'), getUser: jest.fn(() => ({ id: 'u2' })) },
      user: { id: 'u1' },
      guild,
      reply: jest.fn(() => Promise.resolve()),
    };
    await highcard.execute(challengeInteraction);

    const acceptInteraction = {
      options: { getSubcommand: jest.fn(() => 'accept') },
      user: { id: 'u2' },
      guild,
      client: { users: { fetch: jest.fn(id => Promise.resolve({ id })) } },
      reply: jest.fn(() => Promise.resolve()),
    };
    await highcard.execute(acceptInteraction);
    expect(acceptInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('High Card Duel Result'),
      embeds: expect.any(Array),
    }));

    jest.useRealTimers();
    Math.random.mockRestore();
  });
});
