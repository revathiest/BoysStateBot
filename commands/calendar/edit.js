const CalendarConfig = require('../../db/models/CalendarConfig');
const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRow } = require('discord.js');

module.exports = async function edit(interaction, guildId) {
  console.log('[calendar:edit] Triggered edit subcommand.');

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

    const modal = new ModalBuilder()
      .setCustomId(`edit_calendar_modal_${config.id}`)
      .setTitle('Edit Calendar Label')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('new_label')
            .setLabel('New Label')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

    return await interaction.showModal(modal);
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId('edit_calendar_select')
    .setPlaceholder('Select a calendar to edit label')
    .addOptions(configs.map(c => new StringSelectMenuOptionBuilder()
      .setLabel(c.label || '(no label)')
      .setValue(c.id.toString())
      .setDescription(c.calendarId)));

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    content: 'Select a calendar to edit:',
    components: [row],
    ephemeral: true,
  });
};
