const NotificationChannel = require('../../db/models/NotificationChannel');

module.exports = async function toggleNotifications(interaction, guildId) {
  try {
    const config = await NotificationChannel.findOne({ where: { guildId } });
    if (!config) {
      return await interaction.reply({
        embeds: [{
          title: '❌ No Notification Channel Configured',
          description: 'Use `/calendar set-channel` first to specify a channel.',
          color: 0xFF0000,
        }],
        ephemeral: true,
      });
    }

    config.enabled = !config.enabled;
    await config.save();

    await interaction.reply({
      embeds: [{
        title: config.enabled ? '✅ Notifications Enabled' : '🔕 Notifications Disabled',
        description: config.enabled
          ? 'Schedule update notifications will be sent.'
          : 'No schedule update notifications will be sent.',
        color: config.enabled ? 0x2ECC71 : 0xCCCCCC,
      }],
      ephemeral: true,
    });
  } catch (error) {
    console.error('[calendar:toggle-notifications] ❌ Error:', error);
    await interaction.reply({
      embeds: [{
        title: '❌ Error Toggling Notifications',
        description: `An unexpected error occurred:\n\`${error.message}\``,
        color: 0xFF0000,
      }],
      ephemeral: true,
    });
  }
};
