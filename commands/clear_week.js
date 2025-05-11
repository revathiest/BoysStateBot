const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-week')
    .setDescription('⚠️ Deletes all events for Boys State week (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Confirm Calendar Deletion')
      .setDescription(
        'This will **permanently delete all events** from the calendar for Boys State week.\n\n' +
        '**This action is irreversible.** Are you absolutely sure you want to proceed?'
      )
      .setColor(0xB91C1C)
      .setFooter({ text: 'This will affect the production calendar.' });

    const button = new ButtonBuilder()
      .setCustomId(`confirm_clear_week_${interaction.user.id}:${interaction.guildId}`)
      .setLabel('Yes, delete the week')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
