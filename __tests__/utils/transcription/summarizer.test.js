const { summarizeTranscript, ENDPOINT, MAX_INPUT_CHARS } = require('../../../utils/transcription/summarizer');

const okFetch = text => jest.fn().mockResolvedValue({
  ok: true, json: async () => ({ choices: [{ message: { content: `  ${text}  ` } }] }),
});

describe('summarizeTranscript', () => {
  const origKey = process.env.OPENAI_API_KEY;
  const origModel = process.env.OPENAI_SUMMARY_MODEL;
  afterEach(() => {
    if (origKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = origKey;
    if (origModel === undefined) delete process.env.OPENAI_SUMMARY_MODEL; else process.env.OPENAI_SUMMARY_MODEL = origModel;
  });

  test('posts transcript with auth and returns trimmed summary', async () => {
    delete process.env.OPENAI_SUMMARY_MODEL;
    const fetchImpl = okFetch('done');
    const out = await summarizeTranscript('hello', { apiKey: 'k', fetchImpl });
    expect(out).toBe('done');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.headers.Authorization).toBe('Bearer k');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.messages[1]).toEqual({ role: 'user', content: 'hello' });
    expect(body.messages[0].content).toContain('Action Items');
  });

  test('uses env key and model, truncates long input', async () => {
    process.env.OPENAI_API_KEY = 'envk';
    process.env.OPENAI_SUMMARY_MODEL = 'm2';
    const fetchImpl = okFetch('x');
    await summarizeTranscript('a'.repeat(MAX_INPUT_CHARS + 50), { fetchImpl });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.model).toBe('m2');
    expect(body.messages[1].content).toHaveLength(MAX_INPUT_CHARS);
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer envk');
  });

  test('throws without a key', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(summarizeTranscript('t', { fetchImpl: jest.fn() })).rejects.toThrow('OPENAI_API_KEY');
  });

  test('throws on API errors', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'slow down' });
    await expect(summarizeTranscript('t', { apiKey: 'k', fetchImpl })).rejects.toThrow('Summary API error 429: slow down');
  });

  test('tolerates unreadable error bodies and empty choices', async () => {
    const bad = jest.fn().mockResolvedValue({ ok: false, status: 500, text: async () => { throw new Error('x'); } });
    await expect(summarizeTranscript('t', { apiKey: 'k', fetchImpl: bad })).rejects.toThrow('Summary API error 500');
    const empty = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    await expect(summarizeTranscript('t', { apiKey: 'k', fetchImpl: empty })).resolves.toBe('');
  });
});
