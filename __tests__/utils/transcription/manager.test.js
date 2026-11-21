jest.mock('../../../db/models', () => ({ Transcript: { create: jest.fn() } }));

const manager = require('../../../utils/transcription/manager');

function setup(overrides = {}) {
  const textChannel = { id: 't1', send: jest.fn().mockResolvedValue(undefined) };
  const voiceChannel = { id: 'v1', name: 'General' };
  const members = {
    cache: new Map([['u1', { displayName: 'Amy' }]]),
    fetch: jest.fn().mockResolvedValue({ displayName: 'Fetched' }),
  };
  const guild = { id: `g-${Math.random()}`, members };
  const session = {
    stop: jest.fn().mockResolvedValue({
      entries: [{ spokeAt: new Date('2026-01-01T00:00:01Z'), speaker: 'Amy', text: 'hi' }],
      startedAt: new Date('2026-01-01T00:00:00Z'),
      endedAt: new Date('2026-01-01T00:01:00Z'),
    }),
  };
  const start = jest.fn().mockResolvedValue(session);
  const Transcript = { create: jest.fn().mockResolvedValue({}) };
  return { textChannel, voiceChannel, guild, session, start, Transcript, members, ...overrides };
}

describe('transcription manager', () => {
  let errSpy;
  beforeEach(() => { errSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => errSpy.mockRestore());

  test('begin registers an active session', async () => {
    const c = setup();
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    expect(manager.getActive(c.guild.id).session).toBe(c.session);
    await manager.finish(c.guild.id, { Transcript: c.Transcript });
  });

  test('begin rejects when a session is already active', async () => {
    const c = setup();
    const args = { guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start };
    await manager.begin(args);
    await expect(manager.begin(args)).rejects.toThrow('already running');
    expect(c.start).toHaveBeenCalledTimes(1);
    await manager.finish(c.guild.id, { Transcript: c.Transcript });
  });

  test('begin frees the slot when starting fails', async () => {
    const c = setup();
    c.start.mockRejectedValueOnce(new Error('join failed'));
    await expect(manager.begin({
      guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start,
    })).rejects.toThrow('join failed');
    expect(manager.getActive(c.guild.id)).toBeUndefined();
  });

  test('resolveName uses cache then falls back to fetch', async () => {
    const c = setup();
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    const { resolveName } = c.start.mock.calls[0][0];
    await expect(resolveName('u1')).resolves.toBe('Amy');
    await expect(resolveName('u2')).resolves.toBe('Fetched');
    expect(c.members.fetch).toHaveBeenCalledWith('u2');
    await manager.finish(c.guild.id, { Transcript: c.Transcript });
  });

  test('finish saves to DB and posts the file', async () => {
    const c = setup();
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    const result = await manager.finish(c.guild.id, { Transcript: c.Transcript });

    expect(result).toMatchObject({ saved: true, entryCount: 1 });
    expect(c.Transcript.create).toHaveBeenCalledWith(expect.objectContaining({
      guildId: c.guild.id, voiceChannelId: 'v1', textChannelId: 't1', startedBy: 'me', entryCount: 1,
      content: expect.stringContaining('Amy: hi'),
    }));
    const sent = c.textChannel.send.mock.calls[0][0];
    expect(sent.files).toHaveLength(1);
    expect(sent.embeds).toHaveLength(1);
    expect(manager.getActive(c.guild.id)).toBeUndefined();
  });

  test('finish still posts when the DB save fails', async () => {
    const c = setup();
    c.Transcript.create.mockRejectedValue(new Error('db down'));
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    const result = await manager.finish(c.guild.id, { Transcript: c.Transcript });
    expect(result.saved).toBe(false);
    expect(c.textChannel.send).toHaveBeenCalled();
  });

  test('finish survives a failed post', async () => {
    const c = setup();
    c.textChannel.send.mockRejectedValue(new Error('no perms'));
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    await expect(manager.finish(c.guild.id, { Transcript: c.Transcript })).resolves.toMatchObject({ saved: true, entryCount: 1 });
  });

  test('finish returns null when nothing is active', async () => {
    await expect(manager.finish('nope', { Transcript: {} })).resolves.toBeNull();
  });

  test('finish uses the real model by default', async () => {
    const { Transcript } = require('../../../db/models');
    Transcript.create.mockResolvedValue({});
    const c = setup();
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    await manager.finish(c.guild.id);
    expect(Transcript.create).toHaveBeenCalled();
  });

  test('unexpected disconnect finishes the session', async () => {
    const c = setup();
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    const { Transcript } = require('../../../db/models');
    Transcript.create.mockResolvedValue({});
    c.start.mock.calls[0][0].onDisconnect();
    await new Promise(resolve => setImmediate(resolve));
    expect(c.session.stop).toHaveBeenCalled();
    expect(manager.getActive(c.guild.id)).toBeUndefined();
  });

  test('disconnect with a failing stop still logs why', async () => {
    const c = setup();
    c.session.stop.mockRejectedValue(new Error('boom'));
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    c.start.mock.calls[0][0].onDisconnect();
    await new Promise(resolve => setImmediate(resolve));
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to stop transcription session'), expect.any(Error));
  });
});

describe('transcription manager summaries', () => {
  let errSpy;
  beforeEach(() => { errSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => errSpy.mockRestore());

  async function run(summarize) {
    const c = setup();
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize });
    return c;
  }

  test('saves and posts the summary', async () => {
    const summarize = jest.fn().mockResolvedValue('**Summary** all good');
    const c = await run(summarize);
    expect(summarize).toHaveBeenCalledWith(expect.stringContaining('Amy: hi'));
    expect(c.Transcript.create).toHaveBeenCalledWith(expect.objectContaining({ summary: '**Summary** all good' }));
    expect(c.textChannel.send.mock.calls[0][0].embeds).toHaveLength(1);
  });

  test('continues without a summary when summarising fails', async () => {
    const c = await run(jest.fn().mockRejectedValue(new Error('quota')));
    expect(c.Transcript.create).toHaveBeenCalledWith(expect.objectContaining({ summary: null }));
    expect(c.textChannel.send).toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('summarise'), 'quota');
  });

  test('skips summarising an empty transcript', async () => {
    const c = setup();
    c.session.stop.mockResolvedValue({ entries: [], startedAt: new Date(), endedAt: new Date() });
    const summarize = jest.fn();
    await manager.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    await manager.finish(c.guild.id, { Transcript: c.Transcript, summarize });
    expect(summarize).not.toHaveBeenCalled();
  });

  test('empty model output is stored as null', async () => {
    const c = await run(jest.fn().mockResolvedValue(''));
    expect(c.Transcript.create).toHaveBeenCalledWith(expect.objectContaining({ summary: null }));
  });

  test('uses the default summarizer when none is injected', async () => {
    jest.resetModules();
    jest.doMock('../../../utils/transcription/summarizer', () => ({ summarizeTranscript: jest.fn().mockResolvedValue('S') }));
    const fresh = require('../../../utils/transcription/manager');
    const c = setup();
    await fresh.begin({ guild: c.guild, voiceChannel: c.voiceChannel, textChannel: c.textChannel, startedBy: 'me', start: c.start });
    await fresh.finish(c.guild.id, { Transcript: c.Transcript });
    expect(c.Transcript.create).toHaveBeenCalledWith(expect.objectContaining({ summary: 'S' }));
  });
});
