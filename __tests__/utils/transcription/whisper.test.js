const { transcribeAudio, ENDPOINT } = require('../../../utils/transcription/whisper');

describe('transcribeAudio', () => {
  const origEnv = { ...process.env };
  afterEach(() => { process.env = { ...origEnv }; });

  test('throws without an API key', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(transcribeAudio(Buffer.alloc(4), { fetchImpl: jest.fn() })).rejects.toThrow('OPENAI_API_KEY');
  });

  test('posts audio and returns trimmed text', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ text: '  hello there ' }) });
    const text = await transcribeAudio(Buffer.alloc(4), { apiKey: 'k', fetchImpl, language: 'en' });
    expect(text).toBe('hello there');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer k');
    expect(init.body.get('model')).toBe('whisper-1');
    expect(init.body.get('language')).toBe('en');
    expect(init.body.get('file')).toBeTruthy();
  });

  test('uses env model and key, omits language when unset', async () => {
    process.env.OPENAI_API_KEY = 'envkey';
    process.env.OPENAI_TRANSCRIBE_MODEL = 'custom-model';
    delete process.env.TRANSCRIPTION_LANGUAGE;
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    const text = await transcribeAudio(Buffer.alloc(4), { fetchImpl });
    expect(text).toBe('');
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer envkey');
    expect(init.body.get('model')).toBe('custom-model');
    expect(init.body.has('language')).toBe(false);
  });

  test('throws with status on API error', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'slow down' });
    await expect(transcribeAudio(Buffer.alloc(4), { apiKey: 'k', fetchImpl })).rejects.toThrow('429: slow down');
  });

  test('tolerates unreadable error body', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 500, text: async () => { throw new Error('x'); } });
    await expect(transcribeAudio(Buffer.alloc(4), { apiKey: 'k', fetchImpl })).rejects.toThrow('500');
  });
});
