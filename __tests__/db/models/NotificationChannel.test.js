const mockDefine = jest.fn().mockReturnValue({ name: 'NotificationChannel' });
jest.mock('../../../db/index', () => ({ define: mockDefine }));

describe('NotificationChannel model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('defines NotificationChannel schema', () => {
    const model = require('../../../db/models/NotificationChannel');
    expect(mockDefine).toHaveBeenCalledWith(
      'NotificationChannel',
      expect.objectContaining({
        guildId: expect.anything(),
        channelId: expect.anything(),
      }),
      expect.objectContaining({ tableName: 'notification_channels' })
    );
    expect(model).toEqual({ name: 'NotificationChannel' });
  });
});
