
jest.mock('../handlers/commandHandler');
jest.mock('../handlers/interactionHandler');
jest.mock('../utils/calendarPoller', () => ({ pollCalendars: jest.fn(() => Promise.resolve()) }));

let __mock;
let commandHandler;
let interactionHandler;
let pollCalendars;

describe('bot startup', () => {
  let exitSpy;
  let origInterval;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.DISCORD_TOKEN = 'token';
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    origInterval = global.setInterval;
    global.setInterval = jest.fn();
    jest.doMock('discord.js', () => {
      const onMock = jest.fn();
      const onceMock = jest.fn();
      const loginMock = jest.fn(() => Promise.resolve());
      class Client {
        constructor(opts) {
          this.opts = opts;
          this.on = onMock;
          this.once = onceMock;
          this.login = loginMock;
          this.user = { tag: 'tester' };
        }
      }
      const Collection = jest.fn(() => new Map());
      const GatewayIntentBits = { Guilds: 1, GuildMessages: 2, MessageContent: 4 };
      return { Client, Collection, GatewayIntentBits, __esModule: true, __mock: { onMock, onceMock, loginMock } };
    });
    ({ __mock } = require('discord.js'));
    commandHandler = require('../handlers/commandHandler');
    interactionHandler = require('../handlers/interactionHandler');
    ({ pollCalendars } = require('../utils/calendarPoller'));
  });

  afterEach(() => {
    exitSpy.mockRestore();
    global.setInterval = origInterval;
  });

  test('loads client and registers handlers', async () => {
    jest.isolateModules(() => require('../bot'));

    expect(__mock.loginMock).toHaveBeenCalledWith('token');
    expect(__mock.onMock).toHaveBeenCalledWith('interactionCreate', expect.any(Function));
    const readyCb = __mock.onceMock.mock.calls.find(c => c[0] === 'ready')[1];
    expect(readyCb).toBeDefined();

    await readyCb();

    expect(commandHandler).toHaveBeenCalled();
    expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
    const pollFn = global.setInterval.mock.calls[0][0];
    await pollFn();
    expect(pollCalendars).toHaveBeenCalled();
  });

  test('exits when login fails', async () => {
    __mock.loginMock.mockRejectedValueOnce(new Error('bad'));
    jest.isolateModules(() => require('../bot'));
    await Promise.resolve();
    await Promise.resolve();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

