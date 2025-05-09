const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const CalendarConfig = require('../../db/models/CalendarConfig');

module.exports = async function editCalendarSelect(interaction) {
  const selectedId = interaction.values[0];
  console.log(`[calendar:edit] Selected calendar ID: ${selectedId}`);

  const config = await CalendarConfig.findByPk(selectedId);
  if (!config) {
    return await interaction.update({ content: '❌ Calendar not found.', components: [] });
  }

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

  await interaction.showModal(modal);
};
