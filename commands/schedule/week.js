const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MessageFlags } = require('discord-api-types/v10');

module.exports = async function week(interaction) {
  await interaction.reply({
    content: '⚠️ This will send multiple embeds, potentially a long message. Do you want to continue?',
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('schedule_week_confirm_blah')
          .setLabel('Yes, show me the Schedule')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('schedule_week_cancel_blah')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
      )
    ],
    flags: MessageFlags.Ephemeral,
  });
};