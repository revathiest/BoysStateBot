const formatScheduleList = require('../../utils/scheduleFormatter');

describe('formatScheduleList', () => {
    const formatTime = (date) =>
      date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
  
  it('formats a list of events', () => {
    const event1 = new Date('2025-06-01T08:00:00Z');
    const event2 = new Date('2025-06-01T09:00:00Z');
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
