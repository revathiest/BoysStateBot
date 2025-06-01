jest.mock('../../../utils/googleDrive', () => {
  const getClient = jest.fn();
  return { getClient, __esModule: true, __mock: { getClient } };
});

jest.mock('googleapis', () => {
  const listMock = jest.fn();
  const getMock = jest.fn();
  return { google: { drive: jest.fn(() => ({ files: { list: listMock, get: getMock } })) }, __esModule: true, __mock: { listMock, getMock } };
});

const { __mock: driveAuthMock } = require('../../../utils/googleDrive');
const { __mock: gMock } = require('googleapis');
const search = require('../../../commands/drive/search');

describe('drive search', () => {
  beforeEach(() => jest.clearAllMocks());

  test('replies when file not found', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.listMock.mockResolvedValue({ data: { files: [] } });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'file.txt') };
    await search({ options, deferReply, editReply });
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('No file') }));
  });

  test('downloads and sends file when found', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.listMock.mockResolvedValue({ data: { files: [{ id: '1', name: 'file.txt' }] } });
    gMock.getMock.mockResolvedValue({ data: Buffer.from('abc') });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'file.txt') };
    await search({ options, deferReply, editReply });
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ files: [expect.objectContaining({ name: 'file.txt' })] }));
  });

  test('handles errors gracefully', async () => {
    driveAuthMock.getClient.mockRejectedValue(new Error('bad'));
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'file.txt') };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await search({ options, deferReply, editReply });
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Error') }));
    errorSpy.mockRestore();
  });
});
