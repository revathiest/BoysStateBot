jest.mock('../../db/models', () => ({
  ScheduleChannel: { upsert: jest.fn() },
  __esModule: true
}));
const { ScheduleChannel } = require('../../db/models');
const upsert = ScheduleChannel.upsert;
const cmd = require('../../commands/set_schedule_channel');

describe('set_schedule_channel command', () => {
  beforeEach(() => jest.clearAllMocks());

  test('requires admin', async () => {
    const reply = jest.fn();
    const interaction = {
      member: { permissions: { has: () => false } },
      reply
    };
    await cmd.execute(interaction);
    expect(reply).toHaveBeenCalled();
  });

  test('sets channel', async () => {
    upsert.mockResolvedValue();
    const reply = jest.fn();
    const interaction = {
      member: { permissions: { has: () => true } },
      options: { getChannel: jest.fn(() => ({ id: '1' })) },
      guildId: 'g',
      reply
    };
    await cmd.execute(interaction);
    expect(upsert).toHaveBeenCalledWith({ guildId: 'g', channelId: '1' });
    expect(reply).toHaveBeenCalled();
  });
});
