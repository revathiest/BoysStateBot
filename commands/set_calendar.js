const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const CalendarConfig = require('../db/models/CalendarConfig');
const { google } = require('googleapis');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set_calendar')
    .setDescription('Sets a Google Calendar ID for this server')
    .addStringOption(option =>
      option.setName('calendar_id')
        .setDescription('The Google Calendar ID to add')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('replace')
        .setDescription('Replace existing calendars for this server?'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    const calendarId = interaction.options.getString('calendar_id');
    const replace = interaction.options.getBoolean('replace');
    const guildId = interaction.guildId;

    console.log(`[set_calendar] Received command: calendarId=${calendarId}, replace=${replace}, guildId=${guildId}`);

    try {
      console.log('[set_calendar] Initializing Google auth...');
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '../google-credentials.json'),
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      });
      
      const calendar = google.calendar({ version: 'v3', auth });
      
      console.log('[set_calendar] Attempting to fetch calendar metadata...');
      let calendarInfoRes;
      
      try {
        calendarInfoRes = await calendar.calendars.get({ calendarId });
        console.log('[set_calendar] Calendar metadata fetched:', calendarInfoRes.data);
      } catch (error) {
        console.error('[set_calendar] ❌ Calendar validation failed:', error);
      
        let message = '❌ Calendar not found or inaccessible.\nPlease check the ID and ensure the service account has access.';
        
        if (error.code !== 404) {
          message = `❌ Failed to validate calendar:\n\`${error.message}\``;
        }
      
        return await interaction.reply({
          content: message,
          ephemeral: true,
        });
      }
      
      if (replace) {
        console.log('[set_calendar] Replacing existing calendar configs...');
        await CalendarConfig.destroy({ where: { guildId } });
      }

      console.log('[set_calendar] Saving calendar config to database...');
      await CalendarConfig.create({ guildId, calendarId });

      console.log('[set_calendar] Calendar config saved successfully.');

      await interaction.reply({
        content: replace
          ? `✅ Existing calendars replaced. Set calendar ID to \`${calendarId}\`.`
          : `✅ Added calendar ID \`${calendarId}\` for this server.`,
        ephemeral: true,
      });

    } catch (error) {
      console.error('[set_calendar] ❌ Error encountered:', error);
      await interaction.reply({
        content: `❌ Failed to set calendar:\n\`${error.message}\``,
        ephemeral: true,
      });
    }
  },
};
