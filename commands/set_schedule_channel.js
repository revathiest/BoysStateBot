const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ScheduleChannel = require('../db/models').ScheduleChannel;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set_schedule_channel')
    .setDescription('Sets the channel used for daily schedule posts.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel for daily schedule messages')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        embeds: [{ title: '🚫 Permission Denied', description: 'You must be an administrator to use this command.', color: 0xFF0000 }],
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guildId;

    await ScheduleChannel.upsert({ guildId, channelId: channel.id });

    await interaction.reply({
      embeds: [{ title: '✅ Daily Schedule Channel Set', description: `Daily schedule updates will post in <#${channel.id}>.`, color: 0x2ECC71 }],
      ephemeral: true,
    });
  }
};
