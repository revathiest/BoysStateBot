jest.mock('../../../db/models', () => { const destroy = jest.fn(); return { NotificationChannels: { destroy }, __esModule: true, __mock: { destroy } }; });

const { NotificationChannels, __mock } = require('../../../db/models');
const destroy = NotificationChannels.destroy;
const handler = require('../../../commands/calendar/remove-channel');

describe('calendar remove-channel', () => {
  beforeEach(() => jest.clearAllMocks());

  test('not found', async () => {
    destroy.mockResolvedValue(0);
    const reply = jest.fn();
    const options = { getString: jest.fn(() => '1') };
    await handler({ options, reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('removed', async () => {
    destroy.mockResolvedValue(1);
    const reply = jest.fn();
    const options = { getString: jest.fn(() => '1') };
    await handler({ options, reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });
});
