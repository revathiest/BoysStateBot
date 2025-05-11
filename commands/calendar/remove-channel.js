const NotificationChannels = require('../../db/models').NotificationChannels;

module.exports = async function removeChannel(interaction, guildId) {

  try {
    const channelId = interaction.options.getString('channel_id');

    const deleted = await NotificationChannels.destroy({
      where: { guildId, channelId }
    });

    if (deleted === 0) {
      return await interaction.reply({
        embeds: [{
          title: '❌ Channel Not Found',
          description: `No notification channel found with ID \`${channelId}\` for this server.`,
          color: 0xFF0000,
        }],
        ephemeral: true,
      });
    }

    await interaction.reply({
      embeds: [{
        title: '✅ Notification Channel Removed',
        description: `Notification channel with ID \`${channelId}\` has been removed.`,
        color: 0x2ECC71,
      }],
      ephemeral: true,
    });

  } catch (error) {
    console.error('[calendar:remove-channel] ❌ Error removing channel:', error);
    await interaction.reply({
      embeds: [{
        title: '❌ Error Removing Notification Channel',
        description: `An unexpected error occurred:\n\`${error.message}\``,
        color: 0xFF0000,
      }],
      ephemeral: true,
    });
  }
};
