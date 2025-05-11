const { google } = require('googleapis');
const { CalendarConfig } = require('../../db/models');
const auth = require('../../utils/googleAuth');

module.exports = async (interaction) => {

  const parts = interaction.customId.split('_');
  const action = parts.slice(0, -1).join('_'); // 'confirm_clear_week'
  const [userId, guildId] = parts.at(-1).split(':');
  
  if (action !== 'confirm_clear_week') return;

  if (interaction.user.id !== userId || interaction.guildId !== guildId) {
    console.warn('[DEBUG] Button pressed by wrong user or in wrong guild.');
    return interaction.reply({
      content: 'This button wasn’t meant for you.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const config = await CalendarConfig.findOne({ where: { guildId: interaction.guildId } });

    if (!config?.calendarId) {
      console.warn('[DEBUG] No calendar configured for this guild:', guildId);
      return interaction.editReply({ content: '❌ No calendar configured for this server.' });
    }

    const calendar = google.calendar({
      version: 'v3',
      auth: await auth.getClient(),
    });

    const timeMin = new Date('2025-06-01T00:00:00Z').toISOString();
    const timeMax = new Date('2025-06-07T00:00:00Z').toISOString();

    const res = await calendar.events.list({
      calendarId: config.calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      maxResults: 2500,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];

    const deleted = [];
    const failed = [];

    for (const event of events) {
      try {
        await calendar.events.delete({
          calendarId: config.calendarId,
          eventId: event.id,
        });
        deleted.push(event.summary || event.id);
      } catch (err) {
        console.error(`[ERROR] Failed to delete event: ${event.summary || event.id}`, err);
        failed.push(event.summary || event.id);
      }
    }

    let msg = `🗑 Deleted ${deleted.length} events.`;
    if (failed.length) msg += `\n⚠️ Failed to delete: ${failed.join(', ')}`;

    await interaction.editReply({ content: msg });
  } catch (err) {
    console.error('[ERROR] General failure in clear-week handler:', err);
    await interaction.editReply({ content: `❌ Error: ${err.message}` });
  }
};
