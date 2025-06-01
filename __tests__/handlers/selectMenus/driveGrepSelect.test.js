jest.mock('../../../utils/googleDrive', () => {
  const getClient = jest.fn();
  return { getClient, __esModule: true, __mock: { getClient } };
});

jest.mock('googleapis', () => {
  const getMock = jest.fn();
  return { google: { drive: jest.fn(() => ({ files: { get: getMock } })) }, __esModule: true, __mock: { getMock } };
});

const { __mock: driveAuthMock } = require('../../../utils/googleDrive');
const { __mock: gMock } = require('googleapis');
const handler = require('../../../handlers/selectMenus/driveGrepSelect');

describe('driveGrepSelect', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects wrong user', async () => {
    const reply = jest.fn();
    const interaction = {
      customId: 'drive_grep_select_1',
      user: { id: '2' },
      values: ['x'],
      reply,
    };
    await handler(interaction);
    expect(reply).toHaveBeenCalled();
  });

  test('downloads selected file', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.getMock
      .mockResolvedValueOnce({ data: { name: 'file.txt' } })
      .mockResolvedValueOnce({ data: Buffer.from('abc') });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const interaction = {
      customId: 'drive_grep_select_1',
      user: { id: '1' },
      values: ['fileId'],
      deferReply,
      editReply,
    };
    await handler(interaction);
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ files: [expect.objectContaining({ name: 'file.txt' })] }));
  });

  test('handles errors gracefully', async () => {
    driveAuthMock.getClient.mockRejectedValue(new Error('bad'));
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const interaction = {
      customId: 'drive_grep_select_1',
      user: { id: '1' },
      values: ['fileId'],
      deferReply,
      editReply,
    };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handler(interaction);
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Error') }));
    errorSpy.mockRestore();
  });
});
