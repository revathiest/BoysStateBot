const mockDefine = jest.fn().mockReturnValue({ name: 'ScheduleChannel' });
jest.mock('../../../db/index', () => ({ define: mockDefine }));

describe('ScheduleChannel model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('defines ScheduleChannel schema', () => {
    const model = require('../../../db/models/ScheduleChannel');
    expect(mockDefine).toHaveBeenCalledWith(
      'ScheduleChannel',
      expect.objectContaining({
        guildId: expect.anything(),
        channelId: expect.anything(),
        messageId: expect.anything(),
      }),
      expect.objectContaining({ tableName: 'schedule_channels' })
    );
    expect(model).toEqual({ name: 'ScheduleChannel' });
  });
});
