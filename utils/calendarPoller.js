const { google } = require('googleapis');
const path = require('path');
const CalendarConfig = require('../db/models').CalendarConfig;
const CalendarEvent = require('../db/models').CalendarEvent;
const NotificationChannel = require('../db/models').NotificationChannel;
const { EmbedBuilder } = require('discord.js');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../google-credentials.json'),
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
});

// 🔥 NEW: helper function for building notification embeds
function buildEventEmbed(type, summary, startTime, location) {
  const embed = new EmbedBuilder()
    .setTitle('📅 Calendar Event Notification')
    .setColor(
      type === 'added' ? 0x2ECC71 :
      type === 'updated' ? 0x3498DB :
      0xE74C3C
    )
    .setDescription(
      type === 'added' ? '✅ **New event added!**' :
      type === 'updated' ? '🔄 **Event updated!**' :
      '❌ **Event cancelled!**'
    )
    .addFields(
      { name: 'Event', value: summary, inline: true },
      { name: 'Start', value: startTime.toLocaleString(), inline: true },
      { name: 'Location', value: location || 'N/A', inline: true },
    );

  return embed;
}

async function pollCalendars(client) {
  const authClient = await auth.getClient();
  const calendarClient = google.calendar({ version: 'v3', auth: authClient });
  const configs = await CalendarConfig.findAll();

  for (const config of configs) {
    const { guildId, calendarId } = config;

    try {
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
        const summary = apiEvent.summary || '';

        const notifConfig = await NotificationChannel.findOne({ where: { guildId } });
        const channel = notifConfig ? await client.channels.fetch(notifConfig.channelId).catch(() => null) : null;

        if (!existing) {
          await CalendarEvent.create({ guildId, calendarId, eventId: apiEvent.id, summary, location, startTime, endTime });
          if (channel) {
            const embed = buildEventEmbed('added', summary, startTime, location);
            await channel.send({ embeds: [embed] });
          }
        } else if (existing.startTime.getTime() !== startTime.getTime() || existing.location !== location) {
          existing.startTime = startTime;
          existing.endTime = endTime;
          existing.location = location;
          existing.summary = summary;
          await existing.save();
          if (channel) {
            const embed = buildEventEmbed('updated', summary, startTime, location);
            await channel.send({ embeds: [embed] });
          }
        }
      }

      const currentEventIds = events.map(e => e.id);
      const staleEvents = await CalendarEvent.findAll({
        where: { guildId, calendarId, eventId: { [require('sequelize').Op.notIn]: currentEventIds } },
      });

      for (const stale of staleEvents) {
        await stale.destroy();
        const notifConfig = await NotificationChannel.findOne({ where: { guildId } });
        const channel = notifConfig ? await client.channels.fetch(notifConfig.channelId).catch(() => null) : null;
        if (channel) {
          const embed = buildEventEmbed('cancelled', stale.summary, stale.startTime || new Date(), stale.location);
          await channel.send({ embeds: [embed] });
        }
      }

    } catch (err) {
      console.error(`[${guildId}] Error polling calendar ${calendarId}:`, err);
    }
  }
}

module.exports = { pollCalendars };
