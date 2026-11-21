const { EventEmitter } = require('events');
const { PassThrough } = require('stream');
const { startSession, STOP_FLUSH_TIMEOUT_MS } = require('../../../utils/transcription/session');

const ONE_SECOND = 192000; // 48kHz 16-bit stereo
const flush = () => new Promise(resolve => setImmediate(resolve));

function build(transcribe) {
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
    entersState: jest.fn().mockResolvedValue(undefined),
    VoiceConnectionStatus: {
      Ready: 'ready', Disconnected: 'disconnected', Signalling: 'signalling', Connecting: 'connecting',
    },
    EndBehaviorType: { AfterSilence: 1 },
  };
  const voiceChannel = {
    id: 'vc', name: 'General', guild: { id: 'g', voiceAdapterCreator: 'adapter', members: { cache: new Map() } },
  };
  return {
    voiceChannel, speaking, streams, connection, deps: { voice, prism: { opus: { Decoder: PassThrough } }, transcribe },
  };
}

describe('session stop with a stuck transcription', () => {
  afterEach(() => jest.useRealTimers());

  test('stop returns within the flush timeout even if an API call never settles', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
    const ctx = build(jest.fn(() => new Promise(() => {})));
    const session = await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'Amy', deps: ctx.deps });

    ctx.speaking.emit('start', 'u1');
    ctx.streams[0].write(Buffer.alloc(ONE_SECOND));
    ctx.streams[0].end();
    await flush();

    const stopped = session.stop();
    await jest.advanceTimersByTimeAsync(STOP_FLUSH_TIMEOUT_MS + 1);
    const result = await stopped;
    expect(result.entries).toEqual([]);
    expect(ctx.connection.destroy).toHaveBeenCalled();
  });

  test('stop does not wait for the timeout when work finishes quickly', async () => {
    const ctx = build(jest.fn().mockResolvedValue('hi there'));
    const session = await startSession({ voiceChannel: ctx.voiceChannel, resolveName: async () => 'Amy', deps: ctx.deps });
    ctx.speaking.emit('start', 'u1');
    ctx.streams[0].write(Buffer.alloc(ONE_SECOND));
    ctx.streams[0].end();
    await flush();
    const result = await session.stop();
    expect(result.entries).toHaveLength(1);
  });
});
