const NotificationChannels = require('../../db/models').NotificationChannels;

module.exports = async function listChannels(interaction, guildId) {
  console.log('[calendar:list-channels] Listing notification channels...');

  try {
    const configs = await NotificationChannels.findAll({ where: { guildId } });

    if (configs.length === 0) {
      return await interaction.reply({
        embeds: [{
          title: '📋 No Notification Channels Configured',
          description: 'No notification channels have been configured for this server.',
          color: 0xCCCCCC,
        }],
        ephemeral: true,
      });
    }

    const list = configs.map(c => {
      const channel = interaction.guild.channels.cache.get(c.channelId);
      if (channel) {
        return `• **#${channel.name}**`;
      } else {
        return `• ⚠️ Unknown Channel (ID: \`${c.channelId}\`)`;
      }
    }).join('\n');

    await interaction.reply({
      embeds: [{
        title: '📋 Configured Notification Channels',
        description: list,
        color: 0x2ECC71,
      }],
      ephemeral: true,
    });

  } catch (error) {
    console.error('[calendar:list-channels] ❌ Error listing channels:', error);
    await interaction.reply({
      embeds: [{
        title: '❌ Error Listing Notification Channels',
        description: `An unexpected error occurred:\n\`${error.message}\``,
        color: 0xFF0000,
      }],
      ephemeral: true,
    });
  }
};
