module.exports = function formatScheduleList(events) {
  return events.map(ev => {
    const isAllDay = ev.startTime.getHours() === 0 && ev.startTime.getMinutes() === 0 && ev.startTime.getSeconds() === 0;
    const location = ev.location ? (ev.location.includes(',') ? ev.location.split(',')[0].trim() : ev.location) : null;

    if (isAllDay) {
      return `🗓 **(All Day)** ${ev.summary}${location ? ` @ ${location}` : ''}`;
    } else {
      const time = ev.startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      return `🕒 **${time}** ${ev.summary}${location ? ` @ ${location}` : ''}`;
    }
  }).join('\n');
};
