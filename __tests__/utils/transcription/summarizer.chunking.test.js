const { summarizeTranscript, splitIntoChunks, CHUNK_CHARS } = require('../../../utils/transcription/summarizer');

const reply = text => ({ ok: true, json: async () => ({ choices: [{ message: { content: text } }] }) });

describe('summarizeTranscript large inputs', () => {
  test('a transcript under the chunk size is sent whole in one request', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(reply('x'));
    const big = 'a'.repeat(CHUNK_CHARS - 10);
    await summarizeTranscript(big, { apiKey: 'k', fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).messages[1].content).toHaveLength(big.length);
  });

  test('requests carry an abort signal so a stall cannot hang forever', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(reply('x'));
    await summarizeTranscript('t', { apiKey: 'k', fetchImpl });
    expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  test('long transcripts are summarised in parts then merged, keeping the end', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(reply('p1'))
      .mockResolvedValueOnce(reply('p2'))
      .mockResolvedValueOnce(reply('merged'));
    const out = await summarizeTranscript('L1\nL2\nL3\nLAST', { apiKey: 'k', fetchImpl, chunkChars: 8 });
    expect(out).toBe('merged');
    const bodies = fetchImpl.mock.calls.map(c => JSON.parse(c[1].body));
    expect(bodies).toHaveLength(3);
    expect(bodies[0].messages[1].content).toContain('Part 1 of 2');
    expect(bodies[1].messages[1].content).toContain('LAST');
    expect(bodies[2].messages[0].content).toContain('Merge');
    expect(bodies[2].messages[1].content).toContain('p1');
    expect(bodies[2].messages[1].content).toContain('p2');
  });

  test('a failing part rejects the whole summary', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'bad' });
    await expect(summarizeTranscript('aaaa\nbbbb\ncccc', { apiKey: 'k', fetchImpl, chunkChars: 6 }))
      .rejects.toThrow('Summary API error 500');
  });
});

describe('splitIntoChunks', () => {
  test('returns one chunk when the text fits', () => {
    expect(splitIntoChunks('a\nb', 100)).toEqual(['a\nb\n']);
  });

  test('breaks on line boundaries without losing lines', () => {
    const chunks = splitIntoChunks('aaa\nbbb\nccc', 8);
    expect(chunks.every(c => c.length <= 8)).toBe(true);
    expect(chunks.join('').split('\n').filter(Boolean)).toEqual(['aaa', 'bbb', 'ccc']);
  });

  test('hard-splits a single over-long line', () => {
    const chunks = splitIntoChunks('x'.repeat(25), 10);
    expect(chunks.every(c => c.length <= 11)).toBe(true);
    expect(chunks.join('').replace(/\n/g, '')).toBe('x'.repeat(25));
  });
});
