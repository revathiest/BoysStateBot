const CalendarConfig = require('../../db/models/CalendarConfig');

module.exports = async function editCalendarModal(interaction) {
  const calendarId = interaction.customId.split('_').pop();
  const newLabel = interaction.fields.getTextInputValue('new_label');

  console.log(`[calendar:edit] Modal submitted for calendar ID ${calendarId} with label: ${newLabel}`);

  const config = await CalendarConfig.findByPk(calendarId);
  if (!config) {
    return await interaction.reply({ content: '❌ Calendar not found in database.', ephemeral: true });
  }

  await config.update({ label: newLabel });

  await interaction.reply({
    embeds: [{
      title: '✅ Calendar Label Updated',
      description: `Label for calendar \`${config.calendarId}\` updated to **${newLabel}**.`,
      color: 0x00FF00,
    }],
    ephemeral: true,
  });
};
