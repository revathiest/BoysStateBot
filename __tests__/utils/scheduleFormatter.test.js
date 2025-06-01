// --- __tests__/utils/scheduleFormatter.test.js ---
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
      { summary: 'Opening Ceremony', startTime: event1, location: 'Auditorium' },
      { summary: 'Registration', startTime: event2, location: 'Front Desk' },
    ];
  
    const result = formatScheduleList(events);
  
    expect(result).toContain(formatTime(event1));
    expect(result).toContain('Opening Ceremony');
    expect(result).toContain(formatTime(event2));
    expect(result).toContain('Registration');
  });  

  it('returns fallback for empty list', () => {
    expect(formatScheduleList([])).toMatch("");
  });
});
