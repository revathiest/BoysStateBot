const CalendarConfig = require('../../db/models/CalendarConfig');
const { google } = require('googleapis');
const path = require('path');

module.exports = async function set(interaction, guildId) {
  const calendarId = interaction.options.getString('calendar_id');
  const replace = interaction.options.getBoolean('replace');
  const userLabel = interaction.options.getString('label');

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../../google-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    let calendarInfoRes;
    try {
      calendarInfoRes = await calendar.calendars.get({ calendarId });
    } catch (error) {
      console.error('[calendar:set] ❌ Calendar validation failed:', error);
      let message = '❌ Calendar not found or inaccessible.\nPlease check the ID and ensure the service account has access.';
      if (error.code !== 404) {
        message = `❌ Failed to validate calendar:\n\`${error.message}\``;
      }
      return await interaction.reply({ content: message, ephemeral: true });
    }

    const label = userLabel || calendarInfoRes.data.summary || calendarId;

    if (replace) {
      await CalendarConfig.destroy({ where: { guildId } });
    }

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
