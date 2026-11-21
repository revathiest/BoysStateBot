const { MessageFlags } = require('discord.js');
const manager = require('../../utils/transcription/manager');

/** Build the stop-reply text, spelling out anything that went wrong. */
function describe(result) {
  const lines = [`${result.entryCount} entries captured.`];
  lines.push(result.postError ? `❌ Could not post the transcript: ${result.postError}` : 'Transcript posted.');
  lines.push(result.saved ? 'Saved to the database.' : `⚠️ Database save failed: ${result.saveError}`);
  if (result.summaryError) lines.push(`⚠️ Summary failed: ${result.summaryError}`);
  return lines.join('\n');
}

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
    return interaction.editReply({ embeds: [{ title: '❌ Error', description: `Something went wrong while finishing the transcript: ${err.message}`, color: 0xFF0000 }] });
  }

  if (!result) {
    return interaction.editReply({ embeds: [{ title: 'ℹ️ Nothing Running', description: 'No transcription is active in this server.', color: 0x95A5A6 }] });
  }
  return interaction.editReply({
    embeds: [{
      title: '⏹️ Transcription Stopped',
      description: describe(result),
      color: (result.postError || !result.saved || result.summaryError) ? 0xF39C12 : 0x2ECC71,
    }],
  });
};
