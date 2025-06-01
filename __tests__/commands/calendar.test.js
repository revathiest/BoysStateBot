jest.mock('../../commands/calendar/set', () => jest.fn());
jest.mock('../../commands/calendar/edit', () => jest.fn());
jest.mock('../../commands/calendar/remove', () => jest.fn());
jest.mock('../../commands/calendar/list', () => jest.fn());
jest.mock('../../commands/calendar/set-channel', () => jest.fn());
jest.mock('../../commands/calendar/list-channels', () => jest.fn());
jest.mock('../../commands/calendar/remove-channel', () => jest.fn());
jest.mock('../../commands/calendar/toggle-notifications', () => jest.fn());
jest.mock('../../commands/calendar/set-daterange', () => jest.fn());
jest.mock('../../commands/calendar/link', () => jest.fn());

const set = require('../../commands/calendar/set');
const edit = require('../../commands/calendar/edit');
const remove = require('../../commands/calendar/remove');
const list = require('../../commands/calendar/list');
const setChannel = require('../../commands/calendar/set-channel');
const listChannels = require('../../commands/calendar/list-channels');
const removeChannel = require('../../commands/calendar/remove-channel');
const toggleNotifications = require('../../commands/calendar/toggle-notifications');
const setDaterange = require('../../commands/calendar/set-daterange');
const link = require('../../commands/calendar/link');
const calendar = require('../../commands/calendar');

describe('calendar command', () => {
  beforeEach(() => jest.clearAllMocks());

  test('routes to correct subhandler', async () => {
    const interaction = { guildId: 'g1', options: { getSubcommand: jest.fn() } };

    const map = {
      'set': set,
      'edit': edit,
      'remove': remove,
      'list': list,
      'set-channel': setChannel,
      'list-channels': listChannels,
      'remove-channel': removeChannel,
      'toggle-notifications': toggleNotifications,
      'set-daterange': setDaterange,
      'link': link,
    };

    for (const [sub, handler] of Object.entries(map)) {
      interaction.options.getSubcommand.mockReturnValue(sub);
      await calendar.execute(interaction);
      expect(handler).toHaveBeenCalledWith(interaction, 'g1');
    }
  });
});
