const NotificationChannel = require('../../db/models/NotificationChannel');

module.exports = async function setChannel(interaction, guildId) {
  console.log('[calendar:set-channel] Setting notification channel...');

  if (!interaction.member.permissions.has('Administrator')) {
    return await interaction.reply({
      embeds: [{
        title: '🚫 Permission Denied',
        description: 'You must be an administrator to use this command.',
        color: 0xFF0000,
      }],
      ephemeral: true,
    });
  }

  try {
    const channel = interaction.options.getChannel('channel');

    await NotificationChannel.upsert({
      guildId,
      channelId: channel.id,
    });

    await interaction.reply({
      embeds: [{
        title: '✅ Notification Channel Set',
        description: `Notifications will be sent to <#${channel.id}>.`,
        color: 0x2ECC71,
      }],
      ephemeral: true,
    });

  } catch (error) {
    console.error('[calendar:set-channel] ❌ Error setting notification channel:', error);
    await interaction.reply({
      embeds: [{
        title: '❌ Error Setting Notification Channel',
        description: `An unexpected error occurred:\n\`${error.message}\``,
        color: 0xFF0000,
      }],
      ephemeral: true,
    });
  }
};
