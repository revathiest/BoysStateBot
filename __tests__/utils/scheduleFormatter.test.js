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

  it('formats all-day events and trims comma in location', () => {
    const start = new Date('2025-06-02T00:00:00Z');
    const events = [{ summary: 'Opening', startTime: start, location: 'Field, ABQ' }];
    const result = formatScheduleList(events);
    expect(result).toContain('(All Day)');
    expect(result).toContain('Opening Ceremony');
    expect(result).toContain('Field');
    expect(result).not.toContain('ABQ');
  });

  it('handles missing location gracefully', () => {
    const start = new Date('2025-06-02T05:30:00Z');
    const events = [{ summary: 'Dinner', startTime: start }];
    const result = formatScheduleList(events);
    expect(result).toContain('Dinner');
    expect(result).not.toContain('@');
  });

  it('detects all-day events using UTC time', () => {
    const fakeDate = {
      getUTCHours: () => 0,
      getUTCMinutes: () => 0,
      getUTCSeconds: () => 0,
      getHours: () => 17,
      getMinutes: () => 0,
      getSeconds: () => 0,
      toLocaleTimeString: () => '05:00 PM',
    };

    const events = [{ summary: 'Meeting', startTime: fakeDate }];
    const result = formatScheduleList(events);
    expect(result).toContain('(All Day)');
  });
});
