const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { SlashCommandBuilder } = require('discord.js');
const { CalendarConfig } = require('../db/models');
const auth = require('../utils/googleAuth');

const SCHEDULE_FILE = path.join(__dirname, '../nmbs_schedule.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('import-schedule')
    .setDescription('Bulk imports the full 2025 schedule into the configured calendar (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guildId;
    console.log(`[import-schedule] Triggered by guild: ${guildId}`);

    await interaction.deferReply({ ephemeral: true });

    const config = await CalendarConfig.findOne({ where: { guildId } });
    if (!config || !config.calendarId) {
      console.warn(`[import-schedule] No calendar config found for guild ${guildId}`);
      return interaction.editReply({ content: '❌ No calendar configured for this server.' });
    }

    console.log(`[import-schedule] Using calendarId: ${config.calendarId}`);

    let raw;
    try {
      raw = fs.readFileSync(SCHEDULE_FILE, 'utf8');
      console.log(`[import-schedule] Schedule file loaded (${SCHEDULE_FILE})`);
    } catch (err) {
      console.error(`[import-schedule] Failed to read file:`, err);
      return interaction.editReply({ content: '❌ Could not read the schedule file.' });
    }

    let events;
    try {
      events = JSON.parse(raw);
      console.log(`[import-schedule] Parsed ${events.length} events from file.`);
    } catch (err) {
      console.error(`[import-schedule] Failed to parse JSON:`, err);
      return interaction.editReply({ content: '❌ Schedule file is not valid JSON.' });
    }

    const calendar = google.calendar({ version: 'v3', auth: await auth.getClient() });
    const created = [];
    const failed = [];

    for (const item of events) {
      try {
        const startDateTime = new Date(`${item.date} ${item.start}`);
        const endDateTime = new Date(`${item.date} ${item.end}`);

        console.log(`[import-schedule] Inserting event: ${item.summary} (${startDateTime.toISOString()} → ${endDateTime.toISOString()})`);

        const res = await calendar.events.insert({
          calendarId: config.calendarId,
          resource: {
            summary: item.summary,
            location: item.location,
            start: { dateTime: startDateTime.toISOString(), timeZone: 'UTC' },
            end: { dateTime: endDateTime.toISOString(), timeZone: 'UTC' },
          },
        });

        console.log(`[import-schedule] Created event: ${res.data.id || 'No ID'} → ${res.data.htmlLink || 'No link'}`);
        created.push(item.summary);
      } catch (err) {
        console.error(`[import-schedule] Failed to create event: ${item.summary}`, err);
        failed.push({ summary: item.summary, error: err.message });
      }
    }

    let msg = `✅ Created ${created.length} events.`;
    if (failed.length) msg += `\n❌ Failed: ${failed.map(f => f.summary).join(', ')}`;

    console.log(`[import-schedule] Import complete. Success: ${created.length}, Failed: ${failed.length}`);
    await interaction.editReply({ content: msg });
  },
};
