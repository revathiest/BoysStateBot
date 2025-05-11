const { google } = require('googleapis');
const { CalendarConfig } = require('../../db/models');
const auth = require('../../utils/googleAuth');

module.exports = async (interaction) => {
  const [action, userId, guildId] = interaction.customId.split(':');
  if (action !== 'confirm-clear-week') return;

  if (interaction.user.id !== userId || interaction.guildId !== guildId) {
    return interaction.reply({ content: 'This button wasn’t meant for you.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const config = await CalendarConfig.findOne({ where: { guildId } });
    if (!config?.calendarId) {
      return interaction.editReply({ content: '❌ No calendar configured for this server.' });
    }

    const calendar = google.calendar({ version: 'v3', auth: await auth.getClient() });

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
        await calendar.events.delete({ calendarId: config.calendarId, eventId: event.id });
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
    console.error('[clear-week button] Deletion error:', err);
    await interaction.editReply({ content: `❌ Error: ${err.message}` });
  }
};
