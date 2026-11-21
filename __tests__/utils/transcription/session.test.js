const { EventEmitter } = require('events');
const { PassThrough } = require('stream');
const { startSession } = require('../../../utils/transcription/session');

const flush = () => new Promise(resolve => setImmediate(resolve));
const ONE_SECOND = 192000; // 48kHz 16-bit stereo

class FakeDecoder extends PassThrough {}

function build({ entersState, transcribe, members = new Map() } = {}) {
  const speaking = new EventEmitter();
  const streams = [];
  const connection = new EventEmitter();
  connection.receiver = {
    speaking,
    subscribe: jest.fn(() => {
      const s = new PassThrough();
      streams.push(s);
      return s;
    }),
  };
  connection.destroy = jest.fn();
  const voice = {
    joinVoiceChannel: jest.fn(() => connection),
    entersState: entersState || jest.fn().mockResolvedValue(undefined),
    VoiceConnectionStatus: {
      Ready: 'ready', Disconnected: 'disconnected', Signalling: 'signalling', Connecting: 'connecting',
    },
    EndBehaviorType: { AfterSilence: 1 },
  };
  const prism = { opus: { Decoder: FakeDecoder } };
  const voiceChannel = {
    id: 'vc', name: 'General',
    guild: { id: 'g', voiceAdapterCreator: 'adapter', members: { cache: members } },
  };
  const deps = { voice, prism, transcribe: transcribe || jest.fn().mockResolvedValue('hello world') };
  return { connection, voice, voiceChannel, deps, speaking, streams };
}

describe('startSession', () => {
  let errSpy;
  beforeEach(() => { errSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => errSpy.mockRestore());

  test('joins undeafened and transcribes an utterance', async () => {
    const ctx = build();
    const session = await startSession({
      voiceChannel: ctx.voiceChannel, resolveName: async () => 'Amy', deps: ctx.deps,
    });
    expect(ctx.voice.joinVoiceChannel).toHaveBeenCalledWith(expect.objectContaining({
      channelId: 'vc', guildId: 'g', adapterCreator: 'adapter', selfDeaf: false,
    }));

    ctx.speaking.emit('start', 'u1');
    ctx.streams[0].write(Buffer.alloc(ONE_SECOND));
    ctx.streams[0].end();
    await flush();

    const result = await session.stop();
    expect(ctx.deps.transcribe).toHaveBeenCalledTimes(1);
    expect(ctx.deps.transcribe.mock.calls[0][0].toString('ascii', 0, 4)).toBe('RIFF');
    expect(result.entries).toEqual([
      expect.objectContaining({ userId: 'u1', speaker: 'Amy', text: 'hello world' }),
    ]);
    expect(result.endedAt).toBeInstanceOf(Date);
    expect(ctx.connection.destroy).toHaveBeenCalled();
  });

  test('skips utterances that are too short', async () => {
    const ctx = build();
    const session = await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', deps: ctx.deps });
    ctx.speaking.emit('start', 'u1');
    ctx.streams[0].write(Buffer.alloc(1000));
    ctx.streams[0].end();
    await flush();
    const { entries } = await session.stop();
    expect(ctx.deps.transcribe).not.toHaveBeenCalled();
    expect(entries).toHaveLength(0);
  });

  test('drops empty transcription results', async () => {
    const ctx = build({ transcribe: jest.fn().mockResolvedValue('') });
    const session = await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', deps: ctx.deps });
    ctx.speaking.emit('start', 'u1');
    ctx.streams[0].write(Buffer.alloc(ONE_SECOND));
    ctx.streams[0].end();
    await flush();
    expect((await session.stop()).entries).toHaveLength(0);
  });

  test('logs and continues when transcription fails', async () => {
    const ctx = build({ transcribe: jest.fn().mockRejectedValue(new Error('api down')) });
    const session = await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', deps: ctx.deps });
    ctx.speaking.emit('start', 'u1');
    ctx.streams[0].write(Buffer.alloc(ONE_SECOND));
    ctx.streams[0].end();
    await flush();
    expect((await session.stop()).entries).toHaveLength(0);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('u1'), 'api down');
  });

  test('falls back to user id when name lookup fails', async () => {
    const ctx = build();
    const session = await startSession({
      voiceChannel: ctx.voiceChannel, resolveName: async () => { throw new Error('nope'); }, deps: ctx.deps,
    });
    ctx.speaking.emit('start', 'u9');
    ctx.streams[0].write(Buffer.alloc(ONE_SECOND));
    ctx.streams[0].end();
    await flush();
    expect((await session.stop()).entries[0].speaker).toBe('u9');
  });

  test('ignores bots', async () => {
    const members = new Map([['bot1', { user: { bot: true } }]]);
    const ctx = build({ members });
    await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', deps: ctx.deps });
    ctx.speaking.emit('start', 'bot1');
    expect(ctx.connection.receiver.subscribe).not.toHaveBeenCalled();
  });

  test('does not double-subscribe while a user is already being recorded', async () => {
    const ctx = build();
    await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', deps: ctx.deps });
    ctx.speaking.emit('start', 'u1');
    ctx.speaking.emit('start', 'u1');
    expect(ctx.connection.receiver.subscribe).toHaveBeenCalledTimes(1);
  });

  test('caps very long utterances by destroying the stream', async () => {
    const ctx = build();
    const session = await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', deps: ctx.deps });
    ctx.speaking.emit('start', 'u1');
    ctx.streams[0].write(Buffer.alloc(ONE_SECOND * 121));
    await flush();
    await flush();
    expect(ctx.streams[0].destroyed).toBe(true);
    const { entries } = await session.stop();
    expect(entries).toHaveLength(1);
  });

  test('ignores speech after stop', async () => {
    const ctx = build();
    const session = await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', deps: ctx.deps });
    await session.stop();
    ctx.speaking.emit('start', 'u1');
    expect(ctx.connection.receiver.subscribe).not.toHaveBeenCalled();
  });

  test('stream errors still end the utterance without crashing', async () => {
    const ctx = build();
    const session = await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', deps: ctx.deps });
    ctx.speaking.emit('start', 'u1');
    ctx.streams[0].emit('error', new Error('boom'));
    await flush();
    expect((await session.stop()).entries).toHaveLength(0);
  });

  test('throws and cleans up if the connection never becomes ready', async () => {
    const ctx = build({ entersState: jest.fn().mockRejectedValue(new Error('timeout')) });
    await expect(startSession({
      voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', deps: ctx.deps,
    })).rejects.toThrow('Could not join voice channel: timeout');
    expect(ctx.connection.destroy).toHaveBeenCalled();
  });

  test('calls onDisconnect when reconnect fails', async () => {
    const entersState = jest.fn(async (conn, status) => {
      if (status !== 'ready') throw new Error('no reconnect');
    });
    const ctx = build({ entersState });
    const onDisconnect = jest.fn();
    await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', onDisconnect, deps: ctx.deps });
    ctx.connection.emit('disconnected');
    await flush();
    await flush();
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  test('does not call onDisconnect when the connection recovers', async () => {
    const ctx = build();
    const onDisconnect = jest.fn();
    await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', onDisconnect, deps: ctx.deps });
    ctx.connection.emit('disconnected');
    await flush();
    await flush();
    expect(onDisconnect).not.toHaveBeenCalled();
  });

  test('does not call onDisconnect after stop', async () => {
    const entersState = jest.fn(async (conn, status) => {
      if (status !== 'ready') throw new Error('no reconnect');
    });
    const ctx = build({ entersState });
    const onDisconnect = jest.fn();
    const session = await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'A', onDisconnect, deps: ctx.deps });
    await session.stop();
    ctx.connection.emit('disconnected');
    await flush();
    expect(onDisconnect).not.toHaveBeenCalled();
  });
});
