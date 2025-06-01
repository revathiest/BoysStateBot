jest.mock('../../../db/models', () => {
  const findAll = jest.fn();
  return { NotificationChannels: { findAll }, __esModule: true, __mock: { findAll } };
});

const { NotificationChannels, __mock } = require('../../../db/models');
const findAll = NotificationChannels.findAll;
const list = require('../../../commands/calendar/list-channels');

describe('calendar list-channels', () => {
  beforeEach(() => jest.clearAllMocks());

  test('no channels configured', async () => {
    findAll.mockResolvedValue([]);
    const reply = jest.fn();
    await list({ reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('lists channels', async () => {
    findAll.mockResolvedValue([{ channelId: '1' }]);
    const reply = jest.fn();
    const guild = { channels: { cache: new Map([['1', { name: 'general' }]]) } };
    await list({ guild, reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });
});
