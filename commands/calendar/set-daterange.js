// commands/calendar/set-daterange.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { CalendarConfig } = require('../../db/models');

module.exports = async function(interaction, guildId) {
  const start = interaction.options.getString('start');
  const end = interaction.options.getString('end');

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start) || !dateRegex.test(end)) {
    return interaction.reply({ content: '❌ Invalid date format. Use YYYY-MM-DD.', ephemeral: true });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate) || isNaN(endDate)) {
    return interaction.reply({ content: '❌ Invalid date values.', ephemeral: true });
  }

  if (startDate >= endDate) {
    return interaction.reply({ content: '❌ Start date must be before end date.', ephemeral: true });
  }

  const configs = await CalendarConfig.findAll({ where: { guildId } });

  if (configs.length === 0) {
    return interaction.reply({
      content: '❌ No calendars configured for this server.',
      ephemeral: true
    });
  }

  if (configs.length === 1) {
    const calendar = configs[0];
    await calendar.update({ startDate: start, endDate: end });

    return interaction.reply({
      content: `✅ Date range set for **${calendar.label || calendar.calendarId}**: ${start} → ${end}`,
      ephemeral: true
    });
  }

  // Multiple calendars → send select menu
  const options = configs.map(c => ({
    label: c.label || c.calendarId,
    value: c.calendarId
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId(`set_daterange_select_:${start}:${end}`)
    .setPlaceholder('Select a calendar')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(select);

  await interaction.reply({
    content: 'Select the calendar to set date range for:',
    components: [row],
    ephemeral: true
  });
};
