const mockDefine = jest.fn().mockReturnValue({ name: 'CalendarEvent' });
jest.mock('../../../db/index', () => ({ define: mockDefine }));

describe('CalendarEvent model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('defines CalendarEvent schema', () => {
    const model = require('../../../db/models/CalendarEvent');
    expect(mockDefine).toHaveBeenCalledWith(
      'CalendarEvent',
      expect.objectContaining({
        eventId: expect.anything(),
        summary: expect.anything(),
        startTime: expect.anything(),
        endTime: expect.anything(),
      }),
      expect.objectContaining({ tableName: 'calendar_events' })
    );
    expect(model).toEqual({ name: 'CalendarEvent' });
  });
});
