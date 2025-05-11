const { google } = require('googleapis');
const path = require('path');
const { JWT } = require('google-auth-library');

// Point directly to your top-level google-credentials.json
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, '../google-credentials.json');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const client = new JWT({
  keyFile: SERVICE_ACCOUNT_KEY_PATH,
  scopes: SCOPES,
});

module.exports = {
  getClient: async () => {
    await client.authorize();
    return client;
  },
};
