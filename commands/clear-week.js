const { google } = require('googleapis');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { CalendarConfig } = require('../db/models');
const auth = require('../utils/googleAuth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-week')
    .setDescription('Deletes all events from the calendar for Boys State week (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guildId;
    console.log(`[clear-week] Triggered by guild: ${guildId}`);

    await interaction.deferReply({ ephemeral: true });

    const config = await CalendarConfig.findOne({ where: { guildId } });
    if (!config || !config.calendarId) {
      console.warn(`[clear-week] No calendar config found for guild ${guildId}`);
      return interaction.editReply({ content: '❌ No calendar configured for this server.' });
    }

    const calendarId = config.calendarId;
    const calendar = google.calendar({ version: 'v3', auth: await auth.getClient() });

    const timeMin = new Date('2025-06-01T00:00:00Z').toISOString();
    const timeMax = new Date('2025-06-07T00:00:00Z').toISOString();

    console.log(`[clear-week] Fetching events from ${timeMin} to ${timeMax}`);

    try {
      const res = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        maxResults: 2500,
        orderBy: 'startTime',
      });

      const events = res.data.items || [];
      console.log(`[clear-week] Found ${events.length} events to delete.`);

      const deleted = [];
      const failed = [];

      for (const event of events) {
        try {
          await calendar.events.delete({ calendarId, eventId: event.id });
          console.log(`[clear-week] Deleted: ${event.summary || event.id}`);
          deleted.push(event.summary || event.id);
        } catch (err) {
          console.error(`[clear-week] Failed to delete ${event.summary || event.id}:`, err);
          failed.push(event.summary || event.id);
        }
      }

      let msg = `🗑 Deleted ${deleted.length} events.`;
      if (failed.length) msg += `\n⚠️ Failed to delete: ${failed.join(', ')}`;

      await interaction.editReply({ content: msg });
    } catch (err) {
      console.error(`[clear-week] Error fetching or deleting events:`, err);
      await interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
  },
};
