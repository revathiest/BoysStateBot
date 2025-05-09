const CalendarConfig = require('../../db/models/CalendarConfig');
const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = async function remove(interaction, guildId) {
  console.log('[calendar:remove] Triggered remove subcommand.');

  const configs = await CalendarConfig.findAll({ where: { guildId } });

  if (configs.length === 0) {
    return await interaction.reply({
      embeds: [{
        title: '📋 No Calendars Configured',
        description: 'There are no calendars configured for this server.',
        color: 0xCCCCCC,
      }],
      ephemeral: true,
    });
  }

  if (configs.length === 1) {
    const config = configs[0];
    await config.destroy();
    return await interaction.reply({
      embeds: [{
        title: '✅ Calendar Removed',
        description: `Calendar \`${config.calendarId}\` has been removed from this server.`,
        color: 0x00FF00,
      }],
      ephemeral: true,
    });
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId('remove_calendar_select')
    .setPlaceholder('Select a calendar to remove')
    .addOptions(configs.map(c => new StringSelectMenuOptionBuilder()
      .setLabel(c.label || '(no label)')
      .setValue(c.id.toString())
      .setDescription(c.calendarId)));

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    content: 'Select a calendar to remove:',
    components: [row],
    ephemeral: true,
  });
};
