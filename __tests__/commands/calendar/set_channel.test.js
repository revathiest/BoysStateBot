jest.mock('../../../db/models/NotificationChannel', () => { const upsert = jest.fn(); return { upsert, __esModule: true, __mock: { upsert } }; });
const { __mock } = require('../../../db/models/NotificationChannel');
const upsert = __mock.upsert;
const setChannel = require('../../../commands/calendar/set-channel');

describe('calendar set-channel', () => {
  beforeEach(() => jest.clearAllMocks());

  test('requires admin', async () => {
    const reply = jest.fn();
    const member = { permissions: { has: () => false } };
    await setChannel({ member, reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('sets channel', async () => {
    upsert.mockResolvedValue();
    const reply = jest.fn();
    const member = { permissions: { has: () => true } };
    const options = { getChannel: jest.fn(() => ({ id: '1' })) };
    await setChannel({ member, options, reply }, 'g');
    expect(upsert).toHaveBeenCalled();
    expect(reply).toHaveBeenCalled();
  });
});
