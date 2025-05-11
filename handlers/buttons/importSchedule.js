const { google } = require('googleapis');
const auth = require('../../utils/googleAuth');
const { CalendarConfig } = require('../../db/models');
const schedule = require('../../nmbs_schedule.json');

module.exports = async (interaction) => {
  const parts = interaction.customId.split('_');
  const action = parts.slice(0, -1).join('_');
  const [userId, guildId] = parts.at(-1).split(':');

  if (action !== 'import_schedule') return;

  if (interaction.user.id !== userId || interaction.guildId !== guildId) {
    console.warn('[DEBUG] User/Guild ID mismatch.');
    return interaction.reply({
      content: 'This button wasn’t meant for you.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const config = await CalendarConfig.findOne({ where: { guildId: interaction.guildId } });

    if (!config || !config.calendarId) {
      console.warn('[DEBUG] No calendar configured.');
      return interaction.editReply({ content: '❌ No calendar configured for this server.' });
    }

    const client = await auth.getClient();

    const calendar = google.calendar({ version: 'v3', auth: client });

    const created = [];
    const failed = [];

    for (const entry of schedule) {
      const event = {
        summary: entry.summary,
        location: entry.location,
        start: {
          dateTime: `${entry.date}T${entry.start}:00-06:00`,
          timeZone: 'America/Denver',
        },
        end: {
          dateTime: `${entry.date}T${entry.end}:00-06:00`,
          timeZone: 'America/Denver',
        },
      };

      try {
        const res = await calendar.events.insert({
          calendarId: config.calendarId,
          resource: event,
        });
        created.push(event.summary);
      } catch (err) {
        console.error('[IMPORT ERROR]', event.summary, err.message);
        failed.push(event.summary);
      }
    }

    let msg = `✅ Imported ${created.length} events.`;
    if (failed.length) msg += `\n⚠️ Failed: ${failed.join(', ')}`;
    await interaction.editReply({ content: msg });

  } catch (err) {
    console.error('[IMPORT FATAL]', err);
    await interaction.editReply({ content: `❌ Error: ${err.message}` });
  }
};
