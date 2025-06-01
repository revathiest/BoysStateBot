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
const { StringSelectMenuBuilder } = require('discord.js');

describe('drive grep', () => {
  beforeEach(() => jest.clearAllMocks());

  test('replies when no files match', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.listMock.mockResolvedValue({ data: { files: [] } });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'foo') };
    const user = { id: 'u' };
    await grep({ options, deferReply, editReply, user });
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('No files') }));
  });

  test('lists matching files with select menu', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.listMock.mockResolvedValue({ data: { files: [{ id: '1', name: 'a.txt' }, { id: '2', name: 'b.txt' }] } });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'foo') };
    const user = { id: 'u1' };
    await grep({ options, deferReply, editReply, user });
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    const reply = editReply.mock.calls[0][0];
    expect(reply).toEqual(expect.objectContaining({ components: expect.any(Array) }));
    expect(StringSelectMenuBuilder.mock.instances[0].data.options).toHaveLength(2);
    expect(StringSelectMenuBuilder.mock.instances[0].data.customId).toBe('drive_grep_select_u1');
  });

  test('deduplicates files with same id', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.listMock.mockResolvedValue({ data: { files: [
      { id: '1', name: 'a.txt' },
      { id: '1', name: 'copy of a.txt' },
      { id: '2', name: 'b.txt' },
    ] } });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'foo') };
    const user = { id: 'u2' };
    await grep({ options, deferReply, editReply, user });
    expect(StringSelectMenuBuilder.mock.instances[0].data.options).toHaveLength(2);
  });

  test('paginates through results', async () => {
    driveAuthMock.getClient.mockResolvedValue({});
    gMock.listMock
      .mockResolvedValueOnce({ data: { files: [{ id: '1', name: 'a.txt' }], nextPageToken: 'token' } })
      .mockResolvedValueOnce({ data: { files: [{ id: '2', name: 'b.txt' }] } });
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'foo') };
    const user = { id: 'u' };
    await grep({ options, deferReply, editReply, user });
    expect(gMock.listMock).toHaveBeenCalledTimes(2);
    const reply = editReply.mock.calls[0][0];
    expect(reply).toEqual(expect.objectContaining({ components: expect.any(Array) }));
  });

  test('handles errors gracefully', async () => {
    driveAuthMock.getClient.mockRejectedValue(new Error('bad'));
    const deferReply = jest.fn();
    const editReply = jest.fn();
    const options = { getString: jest.fn(() => 'foo') };
    const user = { id: 'u' };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await grep({ options, deferReply, editReply, user });
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Error') }));
    errorSpy.mockRestore();
  });
});
