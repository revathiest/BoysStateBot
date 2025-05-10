// handlers/selectMenus/set-daterange.js
const { CalendarConfig } = require('../../db/models');

module.exports = async function(interaction) {
  const customId = interaction.customId; // format: set-daterange:YYYY-MM-DD:YYYY-MM-DD
  const selectedCalendarId = interaction.values[0];

  const [, start, end] = customId.split(':');

  await CalendarConfig.update(
    { startDate: start, endDate: end },
    { where: { guildId: interaction.guildId, calendarId: selectedCalendarId } }
  );

  await interaction.update({
    content: `✅ Date range set for **${selectedCalendarId}**: ${start} → ${end}`,
    components: []
  });
};
