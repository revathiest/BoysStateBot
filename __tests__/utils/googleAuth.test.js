const path = require('path');

jest.mock('googleapis', () => ({ google: {} }));

jest.mock('google-auth-library', () => {
  return {
    JWT: jest.fn().mockImplementation((options) => {
      return {
        authorize: jest.fn().mockResolvedValue(),
        options,
      };
    }),
  };
});

const googleAuth = require('../../utils/googleAuth');
const { JWT } = require('google-auth-library');

const utilsDir = path.resolve(__dirname, '../../utils');
const expectedKeyPath = path.join(utilsDir, '../google-credentials.json');

describe('googleAuth getClient', () => {
  it('authorizes and returns JWT client', async () => {
    const client = await googleAuth.getClient();
    expect(JWT).toHaveBeenCalledWith({ keyFile: expectedKeyPath, scopes: ['https://www.googleapis.com/auth/calendar'] });
    expect(client.authorize).toHaveBeenCalled();
    expect(client).toBeInstanceOf(Object);
  });
});
