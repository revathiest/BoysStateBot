// utils/transcription/summarizer.js
// Summarises a transcript with OpenAI's chat completions API.

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
// ~75k tokens per request, well inside gpt-4o-mini's 128k context. Longer transcripts are chunked.
const CHUNK_CHARS = 300000;
const MAX_INPUT_CHARS = CHUNK_CHARS; // kept for backwards compatibility
const REQUEST_TIMEOUT_MS = 60000;

const SYSTEM_PROMPT = [
  'You summarise meeting transcripts. Respond in Markdown with these sections, omitting any that do not apply:',
  '**Summary** (2-4 sentences), **Key Points** (bullets), **Decisions** (bullets),',
  '**Action Items** (bullets, "Owner – task" when an owner is clear), **Open Questions** (bullets).',
  'Only use information in the transcript. Do not invent details.',
].join(' ');

const MERGE_PROMPT = [
  'You are given partial summaries of consecutive parts of one long meeting transcript.',
  'Merge them into a single summary using the same Markdown sections (Summary, Key Points, Decisions, Action Items, Open Questions),',
  'omitting any that do not apply. Deduplicate, keep chronological order, and only use information present in the partial summaries.',
].join(' ');

/**
 * Split text into chunks of at most `size` chars, breaking on line boundaries
 * (an over-long single line is hard-split).
 * @param {string} text
 * @param {number} size
 * @returns {string[]}
 */
function splitIntoChunks(text, size) {
  const chunks = [];
  let current = '';
  const flush = () => { if (current) { chunks.push(current); current = ''; } };
  text.split('\n').forEach(rawLine => {
    let line = rawLine;
    while (line.length > size) {
      flush();
      chunks.push(line.slice(0, size));
      line = line.slice(size);
    }
    if (current.length + line.length + 1 > size) flush();
    current += `${line}\n`;
  });
  flush();
  return chunks;
}

async function callChat({ apiKey, fetchImpl, model, system, user }) {
  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Summary API error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

/**
 * Summarise transcript text. Transcripts longer than CHUNK_CHARS are summarised
 * in parts and the partial summaries merged, so nothing is silently dropped.
 * @param {string} transcript - Formatted transcript.
 * @param {object} [opts]
 * @param {string} [opts.apiKey] - Defaults to OPENAI_API_KEY.
 * @param {string} [opts.model] - Defaults to OPENAI_SUMMARY_MODEL or gpt-4o-mini.
 * @param {number} [opts.chunkChars] - Max characters per request (defaults to CHUNK_CHARS).
 * @param {Function} [opts.fetchImpl] - Injected fetch for testing.
 * @returns {Promise<string>} Markdown summary.
 */
async function summarizeTranscript(transcript, opts = {}) {
  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  const fetchImpl = opts.fetchImpl || fetch;
  const model = opts.model || process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini';
  const base = { apiKey, fetchImpl, model };

  const chunks = splitIntoChunks(transcript, opts.chunkChars || CHUNK_CHARS);
  if (chunks.length <= 1) {
    return callChat({ ...base, system: SYSTEM_PROMPT, user: transcript });
  }

  const partials = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const part = await callChat({
      ...base,
      system: SYSTEM_PROMPT,
      user: `(Part ${i + 1} of ${chunks.length})\n${chunks[i]}`,
    });
    partials.push(`### Part ${i + 1}\n${part}`);
  }
  return callChat({ ...base, system: MERGE_PROMPT, user: partials.join('\n\n') });
}

module.exports = {
  summarizeTranscript, splitIntoChunks, ENDPOINT, MAX_INPUT_CHARS, CHUNK_CHARS,
};
