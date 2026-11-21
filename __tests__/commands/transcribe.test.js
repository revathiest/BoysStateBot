jest.mock('../../utils/transcription/manager', () => ({ begin: jest.fn(), finish: jest.fn() }));

const manager = require('../../utils/transcription/manager');
const cmd = require('../../commands/transcribe');

function makeInteraction({ sub, admin = true, voice, output, memberVoice, channel } = {}) {
  const textChannel = channel || { send: jest.fn().mockResolvedValue(undefined) };
  return {
    options: {
      getSubcommand: jest.fn(() => sub),
      getChannel: jest.fn(name => (name === 'voice' ? voice : output)),
    },
    member: { permissions: { has: jest.fn(() => admin) }, voice: { channel: memberVoice } },
    guild: { id: 'g' },
    user: { id: 'me' },
    channel: textChannel,
    deferReply: jest.fn().mockResolvedValue(undefined),
    editReply: jest.fn().mockResolvedValue(undefined),
    textChannel,
  };
}

const voiceCh = { id: 'v', name: 'General', isVoiceBased: () => true };
const lastTitle = i => i.editReply.mock.calls[0][0].embeds[0].title;

describe('transcribe command', () => {
  let errSpy;
  const origKey = process.env.OPENAI_API_KEY;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'k';
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
    if (origKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = origKey;
  });

  test('defines start and stop subcommands', () => {
    expect(cmd.data.name).toBe('transcribe');
    expect(cmd.data.options.map(o => o.name)).toEqual(['start', 'stop']);
  });

  describe('start', () => {
    test('denies non-admins', async () => {
      const i = makeInteraction({ sub: 'start', admin: false, memberVoice: voiceCh });
      await cmd.execute(i);
      expect(lastTitle(i)).toContain('Permission Denied');
      expect(manager.begin).not.toHaveBeenCalled();
    });

    test('requires OPENAI_API_KEY', async () => {
      delete process.env.OPENAI_API_KEY;
      const i = makeInteraction({ sub: 'start', memberVoice: voiceCh });
      await cmd.execute(i);
      expect(lastTitle(i)).toContain('Not Configured');
      expect(manager.begin).not.toHaveBeenCalled();
    });

    test('requires a voice channel', async () => {
      const i = makeInteraction({ sub: 'start' });
      await cmd.execute(i);
      expect(lastTitle(i)).toContain('No Voice Channel');
    });

    test('rejects non-voice channels', async () => {
      const i = makeInteraction({ sub: 'start', voice: { id: 'x', isVoiceBased: () => false } });
      await cmd.execute(i);
      expect(lastTitle(i)).toContain('No Voice Channel');
    });

    test('starts in the member voice channel and announces', async () => {
      manager.begin.mockResolvedValue({});
      const i = makeInteraction({ sub: 'start', memberVoice: voiceCh });
      await cmd.execute(i);
      expect(manager.begin).toHaveBeenCalledWith({
        guild: i.guild, voiceChannel: voiceCh, textChannel: i.channel, startedBy: 'me',
      });
      expect(i.textChannel.send.mock.calls[0][0].embeds[0].title).toContain('Transcription Started');
      expect(lastTitle(i)).toContain('Transcribing');
    });

    test('honours explicit voice and output options', async () => {
      manager.begin.mockResolvedValue({});
      const out = { id: 'o', send: jest.fn().mockResolvedValue(undefined) };
      const i = makeInteraction({ sub: 'start', voice: voiceCh, output: out });
      await cmd.execute(i);
      expect(manager.begin).toHaveBeenCalledWith(expect.objectContaining({ voiceChannel: voiceCh, textChannel: out }));
      expect(out.send).toHaveBeenCalled();
    });

    test('reports start failures', async () => {
      manager.begin.mockRejectedValue(new Error('already running'));
      const i = makeInteraction({ sub: 'start', memberVoice: voiceCh });
      await cmd.execute(i);
      expect(lastTitle(i)).toContain('Could Not Start');
      expect(i.editReply.mock.calls[0][0].embeds[0].description).toBe('already running');
    });

    test('still succeeds when the notice cannot be posted', async () => {
      manager.begin.mockResolvedValue({});
      const i = makeInteraction({ sub: 'start', memberVoice: voiceCh });
      i.textChannel.send.mockRejectedValue(new Error('no perms'));
      await cmd.execute(i);
      expect(lastTitle(i)).toContain('Transcribing');
    });
  });

  describe('stop', () => {
    test('denies non-admins', async () => {
      const i = makeInteraction({ sub: 'stop', admin: false });
      await cmd.execute(i);
      expect(lastTitle(i)).toContain('Permission Denied');
      expect(manager.finish).not.toHaveBeenCalled();
    });

    test('reports nothing running', async () => {
      manager.finish.mockResolvedValue(null);
      const i = makeInteraction({ sub: 'stop' });
      await cmd.execute(i);
      expect(manager.finish).toHaveBeenCalledWith('g');
      expect(lastTitle(i)).toContain('Nothing Running');
    });

    test('reports success when saved', async () => {
      manager.finish.mockResolvedValue({ saved: true, entryCount: 4 });
      const i = makeInteraction({ sub: 'stop' });
      await cmd.execute(i);
      const desc = i.editReply.mock.calls[0][0].embeds[0].description;
      expect(desc).toContain('4 entries');
      expect(desc).toContain('Transcript posted.');
      expect(desc).toContain('Saved to the database');
    });

    test('warns when the DB save failed', async () => {
      manager.finish.mockResolvedValue({ saved: false, entryCount: 1, saveError: 'disk full' });
      const i = makeInteraction({ sub: 'stop' });
      await cmd.execute(i);
      expect(i.editReply.mock.calls[0][0].embeds[0].description).toContain('Database save failed: disk full');
    });

    test('spells out summary and post failures', async () => {
      manager.finish.mockResolvedValue({
        saved: true, entryCount: 2, summaryError: 'API 429', postError: 'Missing Access',
      });
      const i = makeInteraction({ sub: 'stop' });
      await cmd.execute(i);
      const desc = i.editReply.mock.calls[0][0].embeds[0].description;
      expect(desc).toContain('Summary failed: API 429');
      expect(desc).toContain('Could not post the transcript: Missing Access');
    });

    test('reports unexpected errors', async () => {
      manager.finish.mockRejectedValue(new Error('x'));
      const i = makeInteraction({ sub: 'stop' });
      await cmd.execute(i);
      expect(lastTitle(i)).toContain('Error');
    });
  });
});
