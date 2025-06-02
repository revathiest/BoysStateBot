jest.mock('../../commands/drive/search', () => jest.fn());
jest.mock('../../commands/drive/grep', () => jest.fn());

const search = require('../../commands/drive/search');
const grep = require('../../commands/drive/grep');
const drive = require('../../commands/drive');

describe('drive command', () => {
  beforeEach(() => jest.clearAllMocks());

  test('denies user without proper role', async () => {
    const interaction = {
      options: { getSubcommand: jest.fn(() => 'search') },
      member: {
        permissions: { has: jest.fn(() => false) },
        roles: { cache: { some: jest.fn(() => false) } },
      },
      reply: jest.fn(),
    };
    await drive.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Permission Denied') }));
    expect(search).not.toHaveBeenCalled();
  });

  test('allows designated role', async () => {
    const interaction = {
      options: { getSubcommand: jest.fn(() => 'grep') },
      member: {
        permissions: { has: jest.fn(() => false) },
        roles: { cache: { some: jest.fn(fn => fn({ name: 'Director' })) } },
      },
    };
    await drive.execute(interaction);
    expect(grep).toHaveBeenCalledWith(interaction);
  });

  test('routes to search subhandler for admin', async () => {
    const interaction = {
      options: { getSubcommand: jest.fn(() => 'search') },
      member: {
        permissions: { has: jest.fn(() => true) },
        roles: { cache: { some: jest.fn(() => false) } },
      },
    };
    await drive.execute(interaction);
    expect(search).toHaveBeenCalledWith(interaction);
  });
});
