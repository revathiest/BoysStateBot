const importSchedule = require('../../commands/import_schedule');

describe('import-schedule command', () => {
  test('replies with confirmation embed', async () => {
    const interaction = { user: { id: 'u1' }, guildId: 'g1', reply: jest.fn(() => Promise.resolve()) };
    await importSchedule.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array), components: expect.any(Array), ephemeral: true }));
  });
});
