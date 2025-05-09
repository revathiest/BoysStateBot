const CalendarConfig = require('../../db/models/CalendarConfig');
const { google } = require('googleapis');
const path = require('path');

module.exports = async function set(interaction, guildId) {
  const calendarId = interaction.options.getString('calendar_id');
  const replace = interaction.options.getBoolean('replace');
  const userLabel = interaction.options.getString('label');

  console.log(`[calendar:set] calendarId=${calendarId}, replace=${replace}, label=${userLabel}`);

  try {
    console.log('[calendar:set] Initializing Google auth...');
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../../google-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    console.log('[calendar:set] Attempting to fetch calendar metadata...');
    let calendarInfoRes;
    try {
      calendarInfoRes = await calendar.calendars.get({ calendarId });
      console.log('[calendar:set] Calendar metadata fetched:', calendarInfoRes.data);
    } catch (error) {
      console.error('[calendar:set] ❌ Calendar validation failed:', error);
      let message = '❌ Calendar not found or inaccessible.\nPlease check the ID and ensure the service account has access.';
      if (error.code !== 404) {
        message = `❌ Failed to validate calendar:\n\`${error.message}\``;
      }
      return await interaction.reply({ content: message, ephemeral: true });
    }

    const label = userLabel || calendarInfoRes.data.summary || calendarId;
    console.log(`[calendar:set] Using label: ${label}`);

    if (replace) {
      console.log('[calendar:set] Replacing existing calendar configs...');
      await CalendarConfig.destroy({ where: { guildId } });
    }

    console.log('[calendar:set] Saving calendar config to database...');
    await CalendarConfig.create({ guildId, calendarId, label });

    await interaction.reply({
      content: replace
        ? `✅ Existing calendars replaced. Added calendar **${label}** (\`${calendarId}\`).`
        : `✅ Added calendar **${label}** (\`${calendarId}\`) for this server.`,
      ephemeral: true,
    });

  } catch (error) {
    console.error('[calendar:set] ❌ Error encountered:', error);
    await interaction.reply({
      content: `❌ Failed to set calendar:\n\`${error.message}\``,
      ephemeral: true,
    });
  }
};
