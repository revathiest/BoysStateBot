const fs = require('fs');
jest.mock('fs');

jest.mock('discord.js', () => {
  const restPutMock = jest.fn();
  const routeMock = jest.fn(() => 'route');
  return {
    REST: jest.fn().mockImplementation(() => ({
      put: restPutMock,
      setToken() { return this; }
    })),
    Routes: { applicationGuildCommands: routeMock },
    __esModule: true,
    __mock: { restPutMock, routeMock }
  };
});

const { __mock } = require('discord.js');
const restPutMock = __mock.restPutMock;
const routeMock = __mock.routeMock;

jest.mock('../../commands/good.js', () => ({
  data: { name: 'good', toJSON: jest.fn(() => ({ name: 'good' })) },
  execute: jest.fn()
}), { virtual: true });

jest.mock('../../commands/bad.js', () => ({
  data: { name: 'bad' }
}), { virtual: true });

const handler = require('../../handlers/commandHandler');

describe('commandHandler', () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();
    client = { commands: new Map(), user: { id: 'uid' } };
    process.env.DISCORD_TOKEN = 'token';
    process.env.GUILD_ID = 'gid';
    fs.readdirSync.mockReturnValue(['good.js', 'bad.js']);
  });

  it('loads valid commands and registers them', async () => {
    await handler(client);
    expect(client.commands.has('good')).toBe(true);
    expect(restPutMock).toHaveBeenCalledWith('route', { body: [{ name: 'good' }] });
  });

  it('skips invalid command modules', async () => {
    await handler(client);
    expect(client.commands.has('bad')).toBe(false);
  });
});
