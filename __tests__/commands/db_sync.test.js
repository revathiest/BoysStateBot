jest.mock('../../db/models', () => ({}));
jest.mock('../../db', () => ({
  authenticate: jest.fn(() => Promise.resolve()),
  sync: jest.fn(() => Promise.resolve()),
}));
const sequelize = require('../../db');
const dbSync = require('../../commands/db_sync');

describe('db_sync command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('calls sequelize sync with options', async () => {
    const interaction = {
      options: { getBoolean: jest.fn(flag => flag === 'alter') },
      reply: jest.fn(() => Promise.resolve()),
    };
    await dbSync.execute(interaction);
    expect(sequelize.sync).toHaveBeenCalledWith({ alter: true });
  });

  test('handles force option and errors gracefully', async () => {
    sequelize.authenticate.mockRejectedValueOnce(new Error('fail'));
    const interaction = {
      options: { getBoolean: jest.fn(flag => flag === 'force') },
      reply: jest.fn(() => Promise.resolve()),
    };
    await dbSync.execute(interaction);
    expect(sequelize.sync).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Failed to synchronize') }));
  });
});
