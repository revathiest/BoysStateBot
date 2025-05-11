const CalendarConfig = require('../../db/models/CalendarConfig');

module.exports = async function list(interaction, guildId) {

  try {
    const configs = await CalendarConfig.findAll({ where: { guildId } });

    if (configs.length === 0) {
      return await interaction.reply({
        embeds: [{
          title: '📋 No Calendars Configured',
          description: 'No calendars have been configured for this server.',
          color: 0xCCCCCC,
        }],
        ephemeral: true,
      });
    }

    const list = configs.map(c =>
      `• **${c.label || '(no label)'}** → \`${c.calendarId}\``).join('\n');

    await interaction.reply({
      embeds: [{
        title: '📋 Configured Calendars',
        description: list,
        color: 0x2ECC71,
      }],
      ephemeral: true,
    });

  } catch (error) {
    console.error('[calendar:list] ❌ Error listing calendars:', error);
    await interaction.reply({
      embeds: [{
        title: '❌ Error Listing Calendars',
        description: `An unexpected error occurred:\n\`${error.message}\``,
        color: 0xFF0000,
      }],
      ephemeral: true,
    });
  }
};
