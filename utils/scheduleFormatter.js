/**
 * Convert a list of calendar events into a formatted string.
 *
 * Some events use short summaries which we expand into their full titles for
 * readability. Additional logic like all-day formatting and location trimming
 * is also handled here.
 *
 * @param {Array<Object>} events - Calendar events with summary, startTime and
 * location fields.
 * @returns {string} New line separated formatted events or an empty string when
 * no events are supplied.
 */
module.exports = function formatScheduleList(events) {
  const EVENT_ALIASES = {
    Opening: 'Opening Ceremony',
    Reg: 'Registration',
  };

  return events
    .map((ev) => {
      const isAllDay =
        ev.startTime.getUTCHours() === 0 &&
        ev.startTime.getUTCMinutes() === 0 &&
        ev.startTime.getUTCSeconds() === 0;
      const location = ev.location
        ? ev.location.includes(',')
          ? ev.location.split(',')[0].trim()
          : ev.location
        : null;

      const summary = EVENT_ALIASES[ev.summary] || ev.summary;

      if (isAllDay) {
        return `🗓 **(All Day)** ${summary}${location ? ` @ ${location}` : ''}`;
      }

      const time = ev.startTime.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

      return `🕒 **${time}** ${summary}${location ? ` @ ${location}` : ''}`;
    })
    .join('\n');
};
