jest.mock('../../db/models/TriviaQuestion', () => ({
  findAll: jest.fn(() => Promise.resolve([]))
}));
const TriviaQuestion = require('../../db/models/TriviaQuestion');
const nmtrivia = require('../../commands/nmtrivia');

describe('nmtrivia command', () => {
  test('handles db error gracefully', async () => {
    TriviaQuestion.findAll.mockRejectedValueOnce(new Error('db fail'));
    const interaction = { reply: jest.fn(() => Promise.resolve()) };
    await nmtrivia.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Database error'), ephemeral: true }));
  });

  test('informs when no questions exist', async () => {
    TriviaQuestion.findAll.mockResolvedValueOnce([]);
    const interaction = { reply: jest.fn(() => Promise.resolve()) };
    await nmtrivia.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('No trivia questions'),
      ephemeral: true
    }));
  });
});
