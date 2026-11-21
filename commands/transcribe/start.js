const { MessageFlags } = require('discord.js');
const manager = require('../../utils/transcription/manager');

function reply(interaction, title, description, color) {
  return interaction.editReply({ embeds: [{ title, description, color }] });
}

/**
 * Handle `/transcribe start`.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
module.exports = async function start(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!interaction.member.permissions.has('Administrator')) {
    return reply(interaction, '🚫 Permission Denied', 'You must be an administrator to use this command.', 0xFF0000);
  }
  if (!process.env.OPENAI_API_KEY) {
    return reply(interaction, '❌ Not Configured', '`OPENAI_API_KEY` is not set, so transcription is unavailable.', 0xFF0000);
  }

  const voiceChannel = interaction.options.getChannel('voice') || interaction.member.voice?.channel;
  if (!voiceChannel || !voiceChannel.isVoiceBased?.()) {
    return reply(interaction, '❌ No Voice Channel', 'Join a voice channel or pick one with the `voice` option.', 0xFF0000);
  }
  const textChannel = interaction.options.getChannel('output') || interaction.channel;

  try {
    await manager.begin({
      guild: interaction.guild,
      voiceChannel,
      textChannel,
      startedBy: interaction.user.id,
    });
  } catch (err) {
    console.error('Failed to start transcription:', err);
    return reply(interaction, '❌ Could Not Start', err.message, 0xFF0000);
  }

  try {
    await textChannel.send({
      embeds: [{
        title: '🔴 Transcription Started',
        description: `Speech in **${voiceChannel.name}** is being converted to text by a third-party speech-to-text service. Audio is not saved. Leave the channel if you do not consent.`,
        color: 0xE74C3C,
      }],
    });
  } catch (err) {
    console.error('Failed to post transcription notice:', err);
  }

  return reply(interaction, '✅ Transcribing', `Joined **${voiceChannel.name}**. Use \`/transcribe stop\` to finish.`, 0x2ECC71);
};
