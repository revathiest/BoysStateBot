const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
const path = require('path');
const CalendarConfig = require('../db/models/CalendarConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gcal_test')
    .setDescription('Tests Google Calendar API connection and displays calendar info'),
  async execute(interaction) {
    try {
      const guildId = interaction.guildId;

      // Load calendar ID from DB
      const config = await CalendarConfig.findOne({ where: { guildId } });

      if (!config) {
        return await interaction.reply({
          content: '❌ No calendar configured for this server. Use `/set_calendar` first.',
          ephemeral: true,
        });
      }

      const calendarId = config.calendarId;

      // Authenticate using the service account JSON key
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '../google-credentials.json'),
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      });

      const calendar = google.calendar({ version: 'v3', auth });

      // Attempt to get calendar metadata (summary, timeZone)
      const calendarInfoRes = await calendar.calendars.get({
        calendarId: calendarId,
      });

      const calendarInfo = calendarInfoRes.data;

      // Fetch upcoming events
      const eventsRes = await calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 5,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = eventsRes.data.items;

      const embed = {
        title: '✅ Google Calendar Test',
        description: `Successfully connected to calendar:\n**${calendarInfo.summary}**\nID: \`${calendarId}\`\nTime zone: ${calendarInfo.timeZone}`,
        color: 0x2ecc71,
        fields: [
          { name: 'Events Found', value: `${events.length}`, inline: true },
        ],
      };

      if (events.length > 0) {
        const event = events[0];
        embed.fields.push(
          { name: 'Next Event', value: `**${event.summary}**` },
          { name: 'Start', value: event.start.dateTime || event.start.date },
          { name: 'Event ID', value: event.id }
        );
      } else {
        embed.fields.push({ name: 'Next Event', value: 'No upcoming events found.' });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Google Calendar API error:', error);
      await interaction.reply({
        content: `❌ Failed to connect to Google Calendar:\n\`\`\`${error.message}\`\`\``,
        ephemeral: true,
      });
    }
  },
};
