// utils/transcription/whisper.js
// Minimal OpenAI Whisper client (uses Node's built-in fetch/FormData).

const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Transcribe a WAV buffer with OpenAI's transcription API.
 * @param {Buffer} wav - WAV audio.
 * @param {object} [opts]
 * @param {string} [opts.apiKey] - Defaults to OPENAI_API_KEY.
 * @param {string} [opts.model] - Defaults to OPENAI_TRANSCRIBE_MODEL or whisper-1.
 * @param {string} [opts.language] - Defaults to TRANSCRIPTION_LANGUAGE (optional ISO-639-1).
 * @param {Function} [opts.fetchImpl] - Injected fetch for testing.
 * @returns {Promise<string>} Trimmed transcript text (may be empty).
 */
async function transcribeAudio(wav, opts = {}) {
  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  const fetchImpl = opts.fetchImpl || fetch;
  const model = opts.model || process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
  const language = opts.language || process.env.TRANSCRIPTION_LANGUAGE;

  const form = new FormData();
  form.append('file', new Blob([wav], { type: 'audio/wav' }), 'speech.wav');
  form.append('model', model);
  if (language) form.append('language', language);

  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Transcription API error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.text || '').trim();
}

module.exports = { transcribeAudio, ENDPOINT };
