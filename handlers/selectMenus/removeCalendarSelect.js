const CalendarConfig = require('../../db/models/CalendarConfig');

module.exports = async function removeCalendarSelect(interaction) {
  const selectedId = interaction.values[0];
  console.log(`[calendar:remove] Selected calendar ID: ${selectedId}`);

  const config = await CalendarConfig.findByPk(selectedId);
  if (!config) {
    return await interaction.update({ content: '❌ Calendar not found.', components: [] });
  }

  await config.destroy();

  await interaction.update({
    embeds: [{
      title: '✅ Calendar Removed',
      description: `Calendar \`${config.calendarId}\` has been removed from this server.`,
      color: 0x00FF00,
    }],
    components: [],
  });
};
