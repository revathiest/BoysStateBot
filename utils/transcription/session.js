// utils/transcription/session.js
// One voice-channel transcription session: joins, listens per speaker,
// sends each utterance to speech-to-text, and collects the entries.

const { downmixTo16kMono, pcmToWav, inputDurationSeconds } = require('./audio');
const { transcribeAudio } = require('./whisper');

const MIN_UTTERANCE_SECONDS = 0.6;
const MAX_UTTERANCE_SECONDS = 120;
const SILENCE_MS = 1200;
const READY_TIMEOUT_MS = 20000;
const RECONNECT_TIMEOUT_MS = 5000;

function defaultDeps() {
  // Loaded lazily so unit tests and non-voice code paths never need voice libs.
  return {
    voice: require('@discordjs/voice'),
    prism: require('prism-media'),
    transcribe: transcribeAudio,
  };
}

/**
 * Join a voice channel and begin transcribing.
 * @param {object} opts
 * @param {object} opts.voiceChannel - Discord voice channel (id, guild, name).
 * @param {Function} opts.resolveName - async (userId) => display name.
 * @param {Function} [opts.onDisconnect] - Called once if the bot is removed from the channel.
 * @param {object} [opts.deps] - Injected { voice, prism, transcribe } for testing.
 * @returns {Promise<{stop: Function, entries: Array, startedAt: Date}>}
 */
async function startSession({ voiceChannel, resolveName, onDisconnect, deps }) {
  const { voice, prism, transcribe } = { ...defaultDeps(), ...deps };
  const {
    joinVoiceChannel, entersState, VoiceConnectionStatus, EndBehaviorType,
  } = voice;

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false, // must hear audio to transcribe it
    selfMute: true,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, READY_TIMEOUT_MS);
  } catch (err) {
    connection.destroy();
    throw new Error(`Could not join voice channel: ${err.message}`);
  }

  const entries = [];
  const pending = new Set();
  const listening = new Set();
  const names = new Map();
  let stopped = false;
  const startedAt = new Date();

  async function nameFor(userId) {
    if (!names.has(userId)) {
      try {
        names.set(userId, (await resolveName(userId)) || userId);
      } catch (err) {
        names.set(userId, userId);
      }
    }
    return names.get(userId);
  }

  async function handleUtterance(userId, spokeAt, pcm) {
    if (inputDurationSeconds(pcm.length) < MIN_UTTERANCE_SECONDS) return;
    try {
      const wav = pcmToWav(downmixTo16kMono(pcm));
      const text = await transcribe(wav);
      if (!text) return;
      entries.push({ userId, speaker: await nameFor(userId), spokeAt, text });
    } catch (err) {
      console.error(`Transcription failed for user ${userId}:`, err.message);
    }
  }

  function listenTo(userId) {
    if (stopped || listening.has(userId)) return;
    listening.add(userId);
    const spokeAt = new Date();
    const chunks = [];
    let bytes = 0;

    const opusStream = connection.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: SILENCE_MS },
    });
    const decoder = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      listening.delete(userId);
      const job = handleUtterance(userId, spokeAt, Buffer.concat(chunks));
      pending.add(job);
      job.finally(() => pending.delete(job));
    };

    decoder.on('data', chunk => {
      chunks.push(chunk);
      bytes += chunk.length;
      if (inputDurationSeconds(bytes) >= MAX_UTTERANCE_SECONDS) opusStream.destroy();
    });
    decoder.on('end', finish);
    decoder.on('close', finish);
    decoder.on('error', finish);
    opusStream.on('error', () => decoder.destroy());
    opusStream.on('close', () => decoder.end()); // destroyed streams don't emit 'end'
    opusStream.pipe(decoder);
  }

  connection.receiver.speaking.on('start', userId => {
    if (stopped) return;
    const isBot = voiceChannel.guild.members?.cache?.get(userId)?.user?.bot;
    if (isBot) return;
    nameFor(userId); // warm the name cache
    listenTo(userId);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    if (stopped) return;
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, RECONNECT_TIMEOUT_MS),
        entersState(connection, VoiceConnectionStatus.Connecting, RECONNECT_TIMEOUT_MS),
      ]);
    } catch (err) {
      if (!stopped && onDisconnect) onDisconnect();
    }
  });

  /**
   * Leave the channel and wait for in-flight transcriptions.
   * @returns {Promise<{entries: Array, startedAt: Date, endedAt: Date}>}
   */
  async function stop() {
    stopped = true;
    try { connection.destroy(); } catch (err) { /* already destroyed */ }
    await new Promise(resolve => setImmediate(resolve)); // let in-flight speech flush
    await Promise.allSettled([...pending]);
    return { entries, startedAt, endedAt: new Date() };
  }

  return { stop, entries, startedAt };
}

module.exports = {
  startSession,
  MIN_UTTERANCE_SECONDS,
  MAX_UTTERANCE_SECONDS,
};
