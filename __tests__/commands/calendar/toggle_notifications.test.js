jest.mock('../../../db/models/NotificationChannel', () => {
  const findOne = jest.fn();
  return { findOne, __esModule: true, __mock: { findOne } };
});

const { __mock } = require('../../../db/models/NotificationChannel');
const findOne = __mock.findOne;
const handler = require('../../../commands/calendar/toggle-notifications');

describe('calendar toggle-notifications', () => {
  beforeEach(() => jest.clearAllMocks());

  test('no channel configured', async () => {
    findOne.mockResolvedValue(null);
    const reply = jest.fn();
    await handler({ reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('toggles setting', async () => {
    const save = jest.fn();
    findOne.mockResolvedValue({ enabled: true, save });
    const reply = jest.fn();
    await handler({ reply }, 'g');
    expect(save).toHaveBeenCalled();
    expect(reply).toHaveBeenCalled();
  });
});
