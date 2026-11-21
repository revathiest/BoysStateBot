// utils/transcription/summarizer.js
// Summarises a transcript with OpenAI's chat completions API.

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MAX_INPUT_CHARS = 100000;

const SYSTEM_PROMPT = [
  'You summarise meeting transcripts. Respond in Markdown with these sections, omitting any that do not apply:',
  '**Summary** (2-4 sentences), **Key Points** (bullets), **Decisions** (bullets),',
  '**Action Items** (bullets, "Owner – task" when an owner is clear), **Open Questions** (bullets).',
  'Only use information in the transcript. Do not invent details.',
].join(' ');

/**
 * Summarise transcript text.
 * @param {string} transcript - Formatted transcript.
 * @param {object} [opts]
 * @param {string} [opts.apiKey] - Defaults to OPENAI_API_KEY.
 * @param {string} [opts.model] - Defaults to OPENAI_SUMMARY_MODEL or gpt-4o-mini.
 * @param {Function} [opts.fetchImpl] - Injected fetch for testing.
 * @returns {Promise<string>} Markdown summary.
 */
async function summarizeTranscript(transcript, opts = {}) {
  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  const fetchImpl = opts.fetchImpl || fetch;
  const model = opts.model || process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini';

  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript.slice(0, MAX_INPUT_CHARS) },
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

module.exports = { summarizeTranscript, ENDPOINT, MAX_INPUT_CHARS };
