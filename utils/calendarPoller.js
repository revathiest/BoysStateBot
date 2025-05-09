const { google } = require('googleapis');
const CalendarConfig = require('../db/models').CalendarConfig;
const CalendarEvent = require('../db/models').CalendarEvent;

// TODO: Replace with your auth client
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
});

async function pollCalendars() {
  const calendarClient = google.calendar({ version: 'v3', auth });
  const configs = await CalendarConfig.findAll();

  for (const config of configs) {
    const { guildId, calendarId } = config;
    console.log(`[${guildId}] Polling calendar: ${calendarId}`);

    const res = await calendarClient.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];

    for (const apiEvent of events) {
      const existing = await CalendarEvent.findOne({
        where: { guildId, calendarId, eventId: apiEvent.id },
      });

      const startTime = new Date(apiEvent.start.dateTime || apiEvent.start.date);
      const endTime = new Date(apiEvent.end.dateTime || apiEvent.end.date);
      const location = apiEvent.location || '';

      if (!existing) {
        await CalendarEvent.create({
          guildId, calendarId, eventId: apiEvent.id,
          summary: apiEvent.summary || '',
          location,
          startTime, endTime,
        });
        console.log(`[${guildId}] ADDED event: ${apiEvent.summary}`);
        // TODO: send "Added" notification
      } else if (
        existing.startTime.getTime() !== startTime.getTime() ||
        existing.location !== location
      ) {
        existing.startTime = startTime;
        existing.endTime = endTime;
        existing.location = location;
        existing.summary = apiEvent.summary || '';
        await existing.save();
        console.log(`[${guildId}] UPDATED event: ${apiEvent.summary}`);
        // TODO: send "Updated" notification
      }
    }

    // Check for deleted events
    const currentEventIds = events.map(e => e.id);
    const staleEvents = await CalendarEvent.findAll({
      where: {
        guildId,
        calendarId,
        eventId: { [require('sequelize').Op.notIn]: currentEventIds },
      },
    });

    for (const stale of staleEvents) {
      await stale.destroy();
      console.log(`[${guildId}] CANCELLED event: ${stale.summary}`);
      // TODO: send "Cancelled" notification
    }
  }
}

module.exports = { pollCalendars };
