const mockDefine = jest.fn().mockReturnValue({ name: 'CalendarConfig' });
jest.mock('../../../db/index', () => ({ define: mockDefine }));

describe('CalendarConfig model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('defines CalendarConfig schema', () => {
    const model = require('../../../db/models/CalendarConfig');
    expect(mockDefine).toHaveBeenCalledWith(
      'CalendarConfig',
      expect.objectContaining({
        guildId: expect.anything(),
        calendarId: expect.anything(),
        label: expect.anything(),
      }),
      expect.objectContaining({ tableName: 'calendar_configs' })
    );
    expect(model).toEqual({ name: 'CalendarConfig' });
  });
});
