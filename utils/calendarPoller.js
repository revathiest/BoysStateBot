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

function getMountainOffset(date) {
  const year = date.getUTCFullYear();
  const dstStart = new Date(Date.UTC(year, 2, 8, 9));
  while (dstStart.getUTCDay() !== 0) dstStart.setUTCDate(dstStart.getUTCDate() + 1);
  const dstEnd = new Date(Date.UTC(year, 10, 1, 8));
  while (dstEnd.getUTCDay() !== 0) dstEnd.setUTCDate(dstEnd.getUTCDate() + 1);
  const inDst = date >= dstStart && date < dstEnd;
  return (inDst ? -6 : -7) * 60 * 60 * 1000;
}

function getTimezoneOffset(zone, date = new Date()) {
  if (zone === 'America/Denver') {
    return -getMountainOffset(date);
  }
  const local = new Date(date.toLocaleString('en-US', { timeZone: zone }));
  return date.getTime() - local.getTime();
}

function parseDateInZone(dateStr, zone) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const offset = getTimezoneOffset(zone, utc);
  return new Date(utc.getTime() + offset);
}

function buildEventEmbed(type, summary, startTime, location, changes = {}) {
  const embed = new EmbedBuilder()
    .setTitle('<:newmexicoflag:1370750476332564520> NM Boys & Girls State Schedule Update')
    .setColor(
      type === 'added' ? 0x2ECC71 :
      type === 'updated' ? 0x3498DB :
      0xE74C3C
    )
    .setDescription(
      type === 'added' ? '✅ **A new schedule item has been added!**' :
      type === 'updated' ? '🔄 **A schedule item has been updated!**' :
      '❌ **A schedule item has been cancelled!**'
    )
    .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_New_Mexico.svg')
    .addFields(
      { name: '**Event**', value: `${summary || 'Untitled Event'}`, inline: false },
      { name: '**Start**', value: `<t:${Math.floor(startTime.getTime() / 1000)}:F>`, inline: true },
      { name: '**Location**', value: location || '_TBD_', inline: false },
    )
    .setTimestamp()
    .setFooter({ text: 'New Mexico Boys & Girls State' });

  if (type === 'updated') {
    if (changes.startTime) {
      embed.addFields({
        name: '**Time Updated**',
        value: `from: <t:${Math.floor(changes.startTime.old.getTime() / 1000)}:F>\nto:   <t:${Math.floor(changes.startTime.new.getTime() / 1000)}:F>`,
        inline: false,
      });
    }
    if (changes.location) {
      embed.addFields({
        name: '**Location Updated**',
        value: `from: ${changes.location.old || '_none_'}\nto:   ${changes.location.new || '_none_'}`,
        inline: false,
      });
    }
  }

  return embed;
}

async function pollCalendars(client, onChange) {
  if (!client || !client.channels || typeof client.channels.fetch !== 'function') {
    throw new Error('[pollCalendars] A valid Discord client must be passed to pollCalendars(client)');
  }

  const authClient = await auth.getClient();
  const calendarClient = google.calendar({ version: 'v3', auth: authClient });
  const configs = await CalendarConfig.findAll();

  for (const config of configs) {
    const { guildId, calendarId } = config;

    try {
      if (!config.startDate || !config.endDate) {
        continue;
      }
      
      const [sy, sm, sd] = config.startDate.split('-');
      const [ey, em, ed] = config.endDate.split('-');
      
      const timeMin = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0));
      const timeMax = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));    

      const res = await calendarClient.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = res.data.items || [];

      for (const apiEvent of events) {
        const existing = await CalendarEvent.findOne({
          where: { guildId, calendarId, eventId: apiEvent.id },
        });

        const startTime = apiEvent.start.dateTime
          ? new Date(apiEvent.start.dateTime)
          : parseDateInZone(apiEvent.start.date, 'America/Denver');
        const endTime = apiEvent.end.dateTime
          ? new Date(apiEvent.end.dateTime)
          : parseDateInZone(apiEvent.end.date, 'America/Denver');
        const location = apiEvent.location || '';
        const summary = apiEvent.summary || '';

        const notifConfig = await NotificationChannel.findOne({ where: { guildId } });
        const channel = notifConfig && notifConfig.enabled !== false
          ? await client.channels.fetch(notifConfig.channelId).catch(() => null)
          : null;

        if (!existing) {
          await CalendarEvent.create({ guildId, calendarId, eventId: apiEvent.id, summary, location, startTime, endTime });
          if (channel) {
            const embed = buildEventEmbed('added', summary, startTime, location);
            await channel.send({ embeds: [embed] });
          }
          if (onChange) await onChange(guildId, startTime);
        } else if (existing.startTime.getTime() !== startTime.getTime() || existing.location !== location) {

          const changes = {};
          if (existing.startTime.getTime() !== startTime.getTime()) {
            changes.startTime = { old: existing.startTime, new: startTime };
          }
          if (existing.location !== location) {
            changes.location = { old: existing.location, new: location };
          }

          existing.startTime = startTime;
          existing.endTime = endTime;
          existing.location = location;
          existing.summary = summary;
          await existing.save();

          if (channel) {
            const embed = buildEventEmbed('updated', summary, startTime, location, changes);
            await channel.send({ embeds: [embed] });
          }
          if (onChange) await onChange(guildId, startTime);
        }
      }

      const currentEventIds = events.map(e => e.id);
      const staleEvents = await CalendarEvent.findAll({
        where: { guildId, calendarId, eventId: { [require('sequelize').Op.notIn]: currentEventIds } },
      });

      for (const stale of staleEvents) {
        await stale.destroy();
        const notifConfig = await NotificationChannel.findOne({ where: { guildId } });
        const channel = notifConfig && notifConfig.enabled !== false
          ? await client.channels.fetch(notifConfig.channelId).catch(() => null)
          : null;
        if (channel) {
          const embed = buildEventEmbed('cancelled', stale.summary, stale.startTime || new Date(), stale.location);
          await channel.send({ embeds: [embed] });
        }
        if (onChange) await onChange(guildId, stale.startTime);
      }

    } catch (err) {
      console.error(`[${guildId}] Error polling calendar ${calendarId}:`, err);
    }
  }
}

module.exports = { pollCalendars };
