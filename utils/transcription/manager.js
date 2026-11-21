// utils/transcription/manager.js
// Tracks one active transcription session per guild and handles
// finishing (format, persist, post) so /transcribe stop and
// unexpected disconnects share the same path.

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { startSession } = require('./session');
const { formatTranscript, transcriptFileName } = require('./formatter');

const CHECKPOINT_MS = 3 * 60 * 1000;
const EMBED_LIMIT = 4000;

const active = new Map(); // guildId -> { session, meta, row, timer, inflight }

function loadTranscriptModel() {
  return require('../../db/models').Transcript;
}

/**
 * Save the in-progress transcript to the DB so a crash or restart can't lose
 * the whole meeting. Best effort: failures are logged, never thrown.
 * @param {string} guildId
 * @param {object} [opts]
 * @param {object} [opts.Transcript] - Injected model for testing.
 * @returns {Promise<boolean>} true if a checkpoint was written.
 */
async function checkpoint(guildId, opts = {}) {
  const record = active.get(guildId);
  if (!record || !record.session || !record.row || record.inflight) return false;
  const { meta, session } = record;
  const endedAt = new Date();
  const run = (async () => {
    try {
      const entries = session.entries || [];
      const content = formatTranscript(entries, {
        channelName: meta.voiceChannel.name, startedAt: session.startedAt || meta.startedAt, endedAt,
      });
      await record.row.update({ endedAt, entryCount: entries.length, content });
      return true;
    } catch (err) {
      console.error(`Transcript checkpoint failed for guild ${guildId}:`, err.message);
      return false;
    }
  })();
  record.inflight = run;
  try {
    return await run;
  } finally {
    record.inflight = null;
  }
}

async function createDraftRow(Transcript, { guild, voiceChannel, textChannel, startedBy, startedAt }) {
  try {
    const row = await Transcript.create({
      guildId: guild.id,
      voiceChannelId: voiceChannel.id,
      textChannelId: textChannel.id,
      startedBy,
      startedAt,
      endedAt: startedAt,
      entryCount: 0,
      content: '(Transcription in progress.)',
    });
    return row && typeof row.update === 'function' ? row : null;
  } catch (err) {
    console.error(`Could not create draft transcript for guild ${guild.id}:`, err.message);
    return null;
  }
}

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
 * @param {object} [opts.Transcript] - Injected model for testing.
 * @param {number} [opts.checkpointMs] - Interval between DB checkpoints.
 * @returns {Promise<object>} The active record.
 */
async function begin({
  guild, voiceChannel, textChannel, startedBy, start = startSession, deps, Transcript, checkpointMs = CHECKPOINT_MS,
}) {
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

  record.meta.startedAt = record.session.startedAt || new Date();
  record.row = await createDraftRow(Transcript || loadTranscriptModel(), {
    guild, voiceChannel, textChannel, startedBy, startedAt: record.meta.startedAt,
  });
  if (record.row) {
    record.timer = setInterval(() => { checkpoint(guild.id); }, checkpointMs);
    if (record.timer.unref) record.timer.unref();
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
  if (record.timer) clearInterval(record.timer);
  if (record.inflight) await record.inflight;

  const { meta, session } = record;
  const Transcript = opts.Transcript || loadTranscriptModel();
  let stopped;
  try {
    stopped = await session.stop();
  } catch (err) {
    console.error(`Failed to stop transcription session for guild ${guildId}:`, err);
    stopped = { entries: session.entries || [], startedAt: meta.startedAt, endedAt: new Date() };
  }
  const { entries, startedAt, endedAt } = stopped;
  const content = formatTranscript(entries, {
    channelName: meta.voiceChannel.name, startedAt, endedAt,
  });

  let summary = null;
  let summaryError = null;
  if (entries.length > 0) {
    try {
      const summarize = opts.summarize || require('./summarizer').summarizeTranscript;
      summary = (await summarize(content)) || null;
    } catch (err) {
      summaryError = err.message;
      console.error(`Failed to summarise transcript for guild ${guildId}:`, err.message);
    }
  }

  let saved = true;
  let saveError = null;
  let postError = null;
  try {
    const fields = { startedAt, endedAt, entryCount: entries.length, content, summary };
    if (record.row) {
      await record.row.update(fields);
    } else {
      await Transcript.create({
        guildId,
        voiceChannelId: meta.voiceChannel.id,
        textChannelId: meta.textChannel.id,
        startedBy: meta.startedBy,
        ...fields,
      });
    }
  } catch (err) {
    saved = false;
    saveError = err.message;
    console.error(`Failed to save transcript for guild ${guildId}:`, err);
  }

  try {
    const header = `Voice channel **${meta.voiceChannel.name}** — ${entries.length} entries.`;
    const full = summary ? `${header}\n\n${summary}` : header;
    const overflow = full.length > EMBED_LIMIT;
    const note = '\n… (full summary attached)';
    const description = overflow ? full.slice(0, EMBED_LIMIT - note.length) + note : full;
    const embed = new EmbedBuilder()
      .setTitle('📝 Transcript Ready')
      .setDescription(description)
      .setColor(0x3498DB);
    const fileName = transcriptFileName(meta.voiceChannel.name, startedAt);
    const files = [new AttachmentBuilder(Buffer.from(content, 'utf8'), { name: fileName })];
    if (overflow) {
      files.push(new AttachmentBuilder(Buffer.from(summary, 'utf8'), {
        name: fileName.replace(/^transcript-/, 'summary-').replace(/\.txt$/, '.md'),
      }));
    }
    const warnings = [];
    if (summaryError) warnings.push(`Summary failed: ${summaryError}`);
    if (!saved) warnings.push(`Could not save to the database (${saveError}); this file is the only copy.`);
    if (warnings.length) embed.setFooter({ text: `⚠️ ${warnings.join(' ').slice(0, 2000)}` });
    await meta.textChannel.send({
      embeds: [embed],
      files,
    });
  } catch (err) {
    postError = err.message;
    console.error(`Failed to post transcript for guild ${guildId}:`, err);
  }

  return {
    saved, entryCount: entries.length, summaryError, saveError, postError,
  };
}

module.exports = { getActive, begin, finish, checkpoint, CHECKPOINT_MS, EMBED_LIMIT };
