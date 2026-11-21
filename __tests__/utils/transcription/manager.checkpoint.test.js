jest.mock('../../../db/models', () => ({ Transcript: { create: jest.fn() } }));

const manager = require('../../../utils/transcription/manager');

function setup() {
  const textChannel = { id: 't1', send: jest.fn().mockResolvedValue(undefined) };
  const voiceChannel = { id: 'v1', name: 'General' };
  const guild = { id: `g-${Math.random()}`, members: { cache: new Map(), fetch: jest.fn() } };
  const session = {
    entries: [{ spokeAt: new Date('2026-01-01T00:00:01Z'), speaker: 'Amy', text: 'hello there' }],
    startedAt: new Date('2026-01-01T00:00:00Z'),
    stop: jest.fn().mockResolvedValue({
      entries: [{ spokeAt: new Date('2026-01-01T00:00:01Z'), speaker: 'Amy', text: 'hello there' }],
      startedAt: new Date('2026-01-01T00:00:00Z'),
      endedAt: new Date('2026-01-01T00:01:00Z'),
    }),
  };
  const start = jest.fn().mockResolvedValue(session);
  const row = { update: jest.fn().mockResolvedValue({}) };
  const Transcript = { create: jest.fn().mockResolvedValue(row) };
  return { textChannel, voiceChannel, guild, session, start, row, Transcript };
}

function begin(c, extra = {}) {
  return manager.begin({
    guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start, ...extra,
  });
}

const noSummary = () => jest.fn().mockResolvedValue(null);

describe('transcription manager checkpoints and long output', () => {
  let errSpy;
  beforeEach(() => { errSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { errSpy.mockRestore(); jest.useRealTimers(); });

  test('begin creates a draft row', async () => {
    const c = setup();
    await begin(c, { Transcript: c.Transcript });
    expect(c.Transcript.create).toHaveBeenCalledWith(expect.objectContaining({
      guildId: c.guild.id, voiceChannelId: 'v1', textChannelId: 't1', startedBy: 'me', entryCount: 0,
    }));
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
  });

  test('checkpoint writes the current entries to the draft row', async () => {
    const c = setup();
    await begin(c, { Transcript: c.Transcript });
    await expect(manager.checkpoint(c.guild.id)).resolves.toBe(true);
    expect(c.row.update).toHaveBeenCalledWith(expect.objectContaining({
      entryCount: 1, content: expect.stringContaining('Amy: hello there'),
    }));
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
  });

  test('checkpoint does nothing without an active session or draft row', async () => {
    await expect(manager.checkpoint('nobody')).resolves.toBe(false);
    const c = setup();
    await begin(c, { Transcript: { create: jest.fn().mockResolvedValue(undefined) } });
    await expect(manager.checkpoint(c.guild.id)).resolves.toBe(false);
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
  });

  test('checkpoint failures are logged and swallowed', async () => {
    const c = setup();
    c.row.update.mockRejectedValueOnce(new Error('db hiccup'));
    await begin(c, { Transcript: c.Transcript });
    await expect(manager.checkpoint(c.guild.id)).resolves.toBe(false);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('checkpoint failed'), 'db hiccup');
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
  });

  test('overlapping checkpoints are skipped', async () => {
    const c = setup();
    let release;
    c.row.update.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    await begin(c, { Transcript: c.Transcript });
    const first = manager.checkpoint(c.guild.id);
    await expect(manager.checkpoint(c.guild.id)).resolves.toBe(false);
    release({});
    await expect(first).resolves.toBe(true);
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
  });

  test('the checkpoint timer fires periodically and stops after finish', async () => {
    jest.useFakeTimers();
    const c = setup();
    await begin(c, { Transcript: c.Transcript, checkpointMs: 1000 });
    await jest.advanceTimersByTimeAsync(2500);
    expect(c.row.update).toHaveBeenCalledTimes(2);
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
    const calls = c.row.update.mock.calls.length;
    await jest.advanceTimersByTimeAsync(5000);
    expect(c.row.update).toHaveBeenCalledTimes(calls);
  });

  test('finish updates the draft row instead of creating a second one', async () => {
    const c = setup();
    await begin(c, { Transcript: c.Transcript });
    const result = await manager.finish(c.guild.id, {
      Transcript: c.Transcript, summarize: jest.fn().mockResolvedValue('S'),
    });
    expect(result).toMatchObject({ saved: true, entryCount: 1 });
    expect(c.Transcript.create).toHaveBeenCalledTimes(1);
    expect(c.row.update).toHaveBeenLastCalledWith(expect.objectContaining({ summary: 'S', entryCount: 1 }));
  });

  test('finish reports a failed final update but still posts', async () => {
    const c = setup();
    await begin(c, { Transcript: c.Transcript });
    c.row.update.mockRejectedValue(new Error('gone'));
    const result = await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
    expect(result.saved).toBe(false);
    expect(c.textChannel.send).toHaveBeenCalled();
  });

  test('begin survives a failing draft insert and finish falls back to create', async () => {
    const c = setup();
    const broken = { create: jest.fn().mockRejectedValue(new Error('no table')) };
    await begin(c, { Transcript: broken });
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('draft transcript'), 'no table');
    const result = await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
    expect(result.saved).toBe(true);
    expect(c.Transcript.create).toHaveBeenCalledTimes(1);
  });

  test('a summary longer than the embed is truncated and attached in full', async () => {
    const c = setup();
    await begin(c, { Transcript: c.Transcript });
    const long = 'word '.repeat(2000);
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: jest.fn().mockResolvedValue(long) });
    const sent = c.textChannel.send.mock.calls[0][0];
    expect(sent.embeds[0].data.description.length).toBeLessThanOrEqual(manager.EMBED_LIMIT);
    expect(sent.embeds[0].data.description).toContain('full summary attached');
    expect(sent.files).toHaveLength(2);
    expect(sent.files[1].name).toMatch(/^summary-.*\.md$/);
    expect(sent.files[1].attachment.toString('utf8')).toBe(long);
  });

  test('a summary failure is reported in the result and the posted footer', async () => {
    const c = setup();
    await begin(c, { Transcript: c.Transcript });
    const result = await manager.finish(c.guild.id, {
      Transcript: c.Transcript, summarize: jest.fn().mockRejectedValue(new Error('API 429')),
    });
    expect(result.summaryError).toBe('API 429');
    const embed = c.textChannel.send.mock.calls[0][0].embeds[0];
    expect(embed.data.footer.text).toContain('Summary failed: API 429');
  });

  test('a failed post is returned to the caller', async () => {
    const c = setup();
    c.textChannel.send.mockRejectedValue(new Error('Missing Access'));
    await begin(c, { Transcript: c.Transcript });
    const result = await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
    expect(result.postError).toBe('Missing Access');
  });

  test('if the session fails to stop, the live entries are still delivered', async () => {
    const c = setup();
    c.session.stop.mockRejectedValue(new Error('boom'));
    await begin(c, { Transcript: c.Transcript });
    const result = await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: noSummary() });
    expect(result.entryCount).toBe(1);
    expect(c.textChannel.send).toHaveBeenCalled();
  });

  test('a short summary needs no extra attachment', async () => {
    const c = setup();
    await begin(c, { Transcript: c.Transcript });
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize: jest.fn().mockResolvedValue('short') });
    expect(c.textChannel.send.mock.calls[0][0].files).toHaveLength(1);
  });
});
