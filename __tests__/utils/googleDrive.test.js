const path = require('path');

jest.mock('googleapis', () => ({ google: {} }));

jest.mock('google-auth-library', () => {
  return {
    JWT: jest.fn().mockImplementation(opts => ({ authorize: jest.fn().mockResolvedValue(), opts })),
  };
});

const googleDrive = require('../../utils/googleDrive');
const { JWT } = require('google-auth-library');

const utilsDir = path.resolve(__dirname, '../../utils');
const expectedKeyPath = path.join(utilsDir, '../google-credentials.json');

describe('googleDrive getClient', () => {
  it('authorizes and returns JWT client', async () => {
    const client = await googleDrive.getClient();
    expect(JWT).toHaveBeenCalledWith({ keyFile: expectedKeyPath, scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
    expect(client.authorize).toHaveBeenCalled();
  });
});
