const { formatTranscript, transcriptFileName } = require('../../../utils/transcription/formatter');

describe('formatter', () => {
  const meta = {
    channelName: 'General',
    startedAt: new Date('2026-01-02T03:04:05Z'),
    endedAt: new Date('2026-01-02T04:00:00Z'),
  };

  test('sorts entries chronologically with UTC timestamps', () => {
    const out = formatTranscript([
      { spokeAt: new Date('2026-01-02T03:10:09Z'), speaker: 'Bob', text: 'second' },
      { spokeAt: new Date('2026-01-02T03:05:00Z'), speaker: 'Amy', text: 'first' },
    ], meta);
    expect(out).toContain('Transcript of #General');
    expect(out).toContain('Entries: 2');
    expect(out.indexOf('[03:05:00] Amy: first')).toBeLessThan(out.indexOf('[03:10:09] Bob: second'));
  });

  test('does not mutate input order', () => {
    const entries = [
      { spokeAt: new Date(2), speaker: 'B', text: 'b' },
      { spokeAt: new Date(1), speaker: 'A', text: 'a' },
    ];
    formatTranscript(entries, meta);
    expect(entries[0].speaker).toBe('B');
  });

  test('handles empty transcript', () => {
    const out = formatTranscript([], meta);
    expect(out).toContain('Entries: 0');
    expect(out).toContain('(No speech was transcribed.)');
  });

  test('file name is sanitised', () => {
    expect(transcriptFileName('My Room!!', meta.startedAt)).toBe('transcript-My-Room-2026-01-02T03-04-05.txt');
    expect(transcriptFileName('***', meta.startedAt)).toBe('transcript-voice-2026-01-02T03-04-05.txt');
  });
});
