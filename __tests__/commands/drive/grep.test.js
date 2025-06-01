jest.mock('../../../utils/googleDrive', () => {
  const getClient = jest.fn();
  return { getClient, __esModule: true, __mock: { getClient } };
});

jest.mock('googleapis', () => {
  const listMock = jest.fn();
  return {
    google: { drive: jest.fn(() => ({ files: { list: listMock } })) },
    __esModule: true,
    __mock: { listMock },
  };
});

const { __mock: driveAuthMock } = require('../../../utils/googleDrive');
const { __mock: gMock } = require('googleapis');
const grep = require('../../../commands/drive/grep');

describe('drive grep', () => {
  beforeEach(() => jest.clearAllMocks());

  test('replies when no files match', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.listMock.mockResolvedValue({ data: { files: [] } });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'foo') };
    await grep({ options, deferReply, editReply });
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('No files') }));
  });

  test('lists matching files', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.listMock.mockResolvedValue({ data: { files: [{ id: '1', name: 'a.txt' }, { id: '2', name: 'b.txt' }] } });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'foo') };
    await grep({ options, deferReply, editReply });
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('https://drive.google.com/uc?id=1') }));
  });

  test('paginates through results', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.listMock
      .mockResolvedValueOnce({ data: { files: [{ id: '1', name: 'a.txt' }], nextPageToken: 'token' } })
      .mockResolvedValueOnce({ data: { files: [{ id: '2', name: 'b.txt' }] } });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'foo') };
    await grep({ options, deferReply, editReply });
    expect(gMock.listMock).toHaveBeenCalledTimes(2);
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('https://drive.google.com/uc?id=2') }));
  });

  test('handles errors gracefully', async () => {
    driveAuthMock.getClient.mockRejectedValue(new Error('bad'));
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'foo') };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await grep({ options, deferReply, editReply });
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Error') }));
    errorSpy.mockRestore();
  });
});
