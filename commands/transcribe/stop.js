const { MessageFlags } = require('discord.js');
const manager = require('../../utils/transcription/manager');

/**
 * Handle `/transcribe stop`.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
module.exports = async function stop(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!interaction.member.permissions.has('Administrator')) {
    return interaction.editReply({ embeds: [{ title: '🚫 Permission Denied', description: 'You must be an administrator to use this command.', color: 0xFF0000 }] });
  }

  let result;
  try {
    result = await manager.finish(interaction.guild.id);
  } catch (err) {
    console.error('Failed to finish transcription:', err);
    return interaction.editReply({ embeds: [{ title: '❌ Error', description: 'Something went wrong while finishing the transcript.', color: 0xFF0000 }] });
  }

  if (!result) {
    return interaction.editReply({ embeds: [{ title: 'ℹ️ Nothing Running', description: 'No transcription is active in this server.', color: 0x95A5A6 }] });
  }
  return interaction.editReply({
    embeds: [{
      title: '⏹️ Transcription Stopped',
      description: `${result.entryCount} entries captured. ${result.saved ? 'Transcript posted and saved.' : 'Transcript posted, but saving to the database failed.'}`,
      color: 0x2ECC71,
    }],
  });
};
