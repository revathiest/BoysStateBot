const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('import-schedule')
    .setDescription('📥 Imports the full 2025 schedule into the configured calendar (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📥 Confirm Schedule Import')
      .setDescription(
        'This will **overwrite the calendar** with events from the official Boys State 2025 schedule.\n\n' +
        '**Are you sure you want to proceed?** This cannot be undone.'
      )
      .setColor(0xEAB308)
      .setFooter({ text: 'Schedule will be imported into the configured calendar.' });

    const button = new ButtonBuilder()
      .setCustomId(`import_schedule_${interaction.user.id}:${interaction.guildId}`)
      .setLabel('Yes, import the schedule')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
