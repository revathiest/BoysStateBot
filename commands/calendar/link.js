const { EmbedBuilder } = require('discord.js');
const { CalendarConfig } = require('../../db/models');

module.exports = async function calendarLinkHandler(interaction, guildId) {
  try {
    const config = await CalendarConfig.findOne({ where: { guildId } });

    if (!config || !config.calendarId || !config.startDate) {
      return interaction.reply({
        content: 'Calendar is not fully configured for this server.',
        ephemeral: true,
      });
    }

    const [yearStr, monthStr, dayStr] = config.startDate.split('-');
    const start = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
    start.setDate(start.getDate() - start.getDay()); // Snap to Sunday

    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');

    const calendarUrl = `https://calendar.google.com/calendar/u/0/r/week/${year}/${month}/${day}?cid=${encodeURIComponent(config.calendarId)}`;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedStart = start.toLocaleDateString('en-US', options);

    const embed = new EmbedBuilder()
      .setTitle('📅 NM Boys State Schedule')
      .setDescription(
        `Here’s the editable calendar for **${formattedStart}**.\n` +
        `[🗓️ Open Calendar in Week View](${calendarUrl})`
      )
      .setColor(0x1D4ED8)
      .setFooter({ text: 'Google Calendar • Week View' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (err) {
    console.error('[calendar:link] Failed to fetch calendar config:', err);
    return interaction.reply({
      content: 'There was an error retrieving the calendar link.',
      ephemeral: true,
    });
  }
};
