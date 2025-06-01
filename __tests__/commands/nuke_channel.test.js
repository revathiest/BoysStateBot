const nuke = require('../../commands/nuke_channel');

function createMessage(id, recent = true) {
  return { id, createdTimestamp: recent ? Date.now() : Date.now() - 20 * 24 * 60 * 60 * 1000, delete: jest.fn(() => Promise.resolve()) };
}

describe('nuke-channel command', () => {
  function collection(items) {
    const map = new Map(items.map(i => [i.id, i]));
    return {
      size: map.size,
      filter: fn => collection(Array.from(map.values()).filter(fn)),
      has: id => map.has(id),
      values: () => map.values(),
    };
  }

  test('deletes recent messages in bulk', async () => {
    const messages = collection([
      createMessage('1'),
      createMessage('2')
    ]);
    const channel = {
      name: 'general',
      messages: {
        fetch: jest.fn()
      },
      bulkDelete: jest.fn(() => Promise.resolve()),
    };
    channel.messages.fetch.mockResolvedValueOnce(messages).mockResolvedValueOnce(collection([]));
    const interaction = { channel, reply: jest.fn(() => Promise.resolve()), editReply: jest.fn(() => Promise.resolve()) };
    await nuke.execute(interaction);
    expect(channel.bulkDelete).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({ content: '✅ Channel nuked.' });
  });
});
