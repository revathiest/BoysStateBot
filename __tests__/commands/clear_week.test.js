const clearWeek = require('../../commands/clear_week');

describe('clear-week command', () => {
  test('replies with confirm button', async () => {
    const interaction = { user: { id: 'u1' }, guildId: 'g1', reply: jest.fn(() => Promise.resolve()) };
    await clearWeek.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array), components: expect.any(Array), ephemeral: true }));
  });
});
