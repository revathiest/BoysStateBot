jest.mock('../../commands/drive/search', () => jest.fn());
jest.mock('../../commands/drive/grep', () => jest.fn());

const search = require('../../commands/drive/search');
const grep = require('../../commands/drive/grep');
const drive = require('../../commands/drive');

describe('drive command', () => {
  beforeEach(() => jest.clearAllMocks());

  test('routes to search subhandler', async () => {
    const interaction = { options: { getSubcommand: jest.fn(() => 'search') } };
    await drive.execute(interaction);
    expect(search).toHaveBeenCalledWith(interaction);
  });

  test('routes to grep subhandler', async () => {
    const interaction = { options: { getSubcommand: jest.fn(() => 'grep') } };
    await drive.execute(interaction);
    expect(grep).toHaveBeenCalledWith(interaction);
  });
});
