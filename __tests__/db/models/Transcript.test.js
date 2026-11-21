const mockDefine = jest.fn().mockReturnValue({ name: 'Transcript' });
jest.mock('../../../db/index', () => ({ define: mockDefine }));

describe('Transcript model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('defines Transcript schema', () => {
    const model = require('../../../db/models/Transcript');
    expect(mockDefine).toHaveBeenCalledWith(
      'Transcript',
      expect.objectContaining({
        guildId: expect.objectContaining({ allowNull: false }),
        voiceChannelId: expect.anything(),
        textChannelId: expect.anything(),
        startedBy: expect.anything(),
        startedAt: expect.anything(),
        endedAt: expect.anything(),
        entryCount: expect.objectContaining({ defaultValue: 0 }),
        content: expect.objectContaining({ allowNull: false }),
        summary: expect.objectContaining({ allowNull: true }),
      }),
      expect.objectContaining({ tableName: 'transcripts' })
    );
    expect(model).toEqual({ name: 'Transcript' });
  });
});
