jest.mock('../../../utils/googleDrive', () => {
  const getClient = jest.fn();
  return { getClient, __esModule: true, __mock: { getClient } };
});

jest.mock('googleapis', () => {
  const getMock = jest.fn();
  const exportMock = jest.fn();
  return {
    google: { drive: jest.fn(() => ({ files: { get: getMock, export: exportMock } })) },
    __esModule: true,
    __mock: { getMock, exportMock },
  };
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
      .mockResolvedValueOnce({ data: { name: 'file.txt', mimeType: 'text/plain' } })
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

  test('exports google docs files as pdf', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.getMock.mockResolvedValueOnce({ data: { name: 'Doc', mimeType: 'application/vnd.google-apps.document' } });
    gMock.exportMock.mockResolvedValueOnce({ data: Buffer.from('pdf') });
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
    expect(gMock.exportMock).toHaveBeenCalledWith(
      { fileId: 'fileId', mimeType: 'application/pdf' },
      { responseType: 'arraybuffer' },
    );
    expect(editReply).toHaveBeenCalledWith(
      expect.objectContaining({ files: [expect.objectContaining({ name: 'Doc.pdf' })] }),
    );
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
