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
});
