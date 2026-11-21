// utils/transcription/manager.js
// Tracks one active transcription session per guild and handles
// finishing (format, persist, post) so /transcribe stop and
// unexpected disconnects share the same path.

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { startSession } = require('./session');
const { formatTranscript, transcriptFileName } = require('./formatter');

const active = new Map(); // guildId -> { session, meta }

/**
 * @param {string} guildId
 * @returns {object|undefined} The active record, if any.
 */
function getActive(guildId) {
  return active.get(guildId);
}

/**
 * Begin transcribing a voice channel for a guild.
 * @param {object} opts
 * @param {object} opts.guild
 * @param {object} opts.voiceChannel
 * @param {object} opts.textChannel - Where the transcript is posted on finish.
 * @param {string} opts.startedBy - User ID.
 * @param {Function} [opts.start] - Injected session starter for testing.
 * @param {object} [opts.deps] - Forwarded to startSession.
 * @returns {Promise<object>} The active record.
 */
async function begin({ guild, voiceChannel, textChannel, startedBy, start = startSession, deps }) {
  if (active.has(guild.id)) throw new Error('A transcription is already running in this server.');

  // Reserve the slot first so concurrent /transcribe start calls can't double-join.
  const record = { session: null, meta: { guild, voiceChannel, textChannel, startedBy } };
  active.set(guild.id, record);
  try {
    record.session = await start({
      voiceChannel,
      deps,
      resolveName: async userId => {
        const member = guild.members.cache.get(userId) || await guild.members.fetch(userId);
        return member.displayName;
      },
      onDisconnect: () => {
        finish(guild.id).catch(err => console.error('Transcript finish after disconnect failed:', err));
      },
    });
  } catch (err) {
    active.delete(guild.id);
    throw err;
  }
  return record;
}

/**
 * Stop the guild's session, save the transcript and post it.
 * @param {string} guildId
 * @param {object} [opts]
 * @param {object} [opts.Transcript] - Injected model for testing.
 * @returns {Promise<{saved: boolean, entryCount: number}|null>} null if nothing active.
 */
async function finish(guildId, opts = {}) {
  const record = active.get(guildId);
  if (!record || !record.session) return null;
  active.delete(guildId);

  const { meta, session } = record;
  const Transcript = opts.Transcript || require('../../db/models').Transcript;
  const { entries, startedAt, endedAt } = await session.stop();
  const content = formatTranscript(entries, {
    channelName: meta.voiceChannel.name, startedAt, endedAt,
  });

  let summary = null;
  if (entries.length > 0) {
    try {
      const summarize = opts.summarize || require('./summarizer').summarizeTranscript;
      summary = (await summarize(content)) || null;
    } catch (err) {
      console.error(`Failed to summarise transcript for guild ${guildId}:`, err.message);
    }
  }

  let saved = true;
  try {
    await Transcript.create({
      guildId,
      voiceChannelId: meta.voiceChannel.id,
      textChannelId: meta.textChannel.id,
      startedBy: meta.startedBy,
      startedAt,
      endedAt,
      entryCount: entries.length,
      content,
      summary,
    });
  } catch (err) {
    saved = false;
    console.error(`Failed to save transcript for guild ${guildId}:`, err);
  }

  try {
    const header = `Voice channel **${meta.voiceChannel.name}** — ${entries.length} entries.`;
    const description = summary ? `${header}\n\n${summary}`.slice(0, 4000) : header;
    const embed = new EmbedBuilder()
      .setTitle('📝 Transcript Ready')
      .setDescription(description)
      .setColor(0x3498DB);
    if (!saved) embed.setFooter({ text: '⚠️ Could not save to the database; this file is the only copy.' });
    await meta.textChannel.send({
      embeds: [embed],
      files: [new AttachmentBuilder(Buffer.from(content, 'utf8'), {
        name: transcriptFileName(meta.voiceChannel.name, startedAt),
      })],
    });
  } catch (err) {
    console.error(`Failed to post transcript for guild ${guildId}:`, err);
  }

  return { saved, entryCount: entries.length };
}

module.exports = { getActive, begin, finish };
