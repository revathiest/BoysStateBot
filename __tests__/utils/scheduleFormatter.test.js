const formatScheduleList = require('../../utils/scheduleFormatter');

describe('formatScheduleList', () => {
  it('formats timed events with location', () => {
    const e1 = new Date('2025-06-01T08:00:00Z');
    const e2 = new Date('2025-06-01T09:00:00Z');
    const events = [
      { summary: 'Opening', startTime: e1, location: 'Hall' },
      { summary: 'Reg', startTime: e2, location: 'Desk' },
    ];
    const result = formatScheduleList(events);
  
    expect(result).toContain('Opening Ceremony');
    expect(result).toContain('Registration');
  });  

  it('returns empty string for no events', () => {
    expect(formatScheduleList([])).toBe('');
  });
});
