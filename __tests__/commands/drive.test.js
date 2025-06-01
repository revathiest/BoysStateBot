jest.mock('../../commands/drive/search', () => jest.fn());

const search = require('../../commands/drive/search');
const drive = require('../../commands/drive');

describe('drive command', () => {
  beforeEach(() => jest.clearAllMocks());

  test('routes to search subhandler', async () => {
    const interaction = { options: { getSubcommand: jest.fn(() => 'search') } };
    await drive.execute(interaction);
    expect(search).toHaveBeenCalledWith(interaction);
  });
});
