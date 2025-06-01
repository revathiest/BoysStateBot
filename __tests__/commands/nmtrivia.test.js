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

  test('declares winner when correct answer is given', async () => {
    jest.useFakeTimers();
    const question = {
      question: 'Capital?',
      correct_answer: 'Santa Fe',
      choice_a: 'Santa Fe',
      choice_b: 'Albuquerque',
      choice_c: 'Roswell',
      choice_d: 'Las Cruces'
    };
    TriviaQuestion.findAll.mockResolvedValueOnce([question]);

    const replyMessage = { edit: jest.fn() };
    const reply = jest.fn(() => Promise.resolve(replyMessage));
    const followUp = jest.fn();
    let collectCb;
    let endCb;
    const collector = {
      on: jest.fn((evt, cb) => { if(evt==='collect') collectCb = cb; else if(evt==='end') endCb = cb; }),
      stop: jest.fn()
    };
    const interaction = {
      reply,
      followUp,
      guild: { members: { fetch: jest.fn(() => Promise.resolve({ displayName: 'Tester' })) } },
      channel: { createMessageCollector: jest.fn(() => collector) }
    };

    jest.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.2).mockReturnValueOnce(0.3).mockReturnValueOnce(0.4);
    await nmtrivia.execute(interaction);

    await collectCb({ content: 'A', author: { id: '123', bot: false } });
    jest.advanceTimersByTime(5000);
    expect(collector.stop).toHaveBeenCalledWith('answered');
    expect(followUp).toHaveBeenCalledWith(expect.stringContaining('Tester'));
    jest.useRealTimers();
    Math.random.mockRestore();
  });

  test('notifies when time runs out with no winner', async () => {
    jest.useFakeTimers();
    const question = {
      question: 'Capital?',
      correct_answer: 'Santa Fe',
      choice_a: 'Santa Fe',
      choice_b: 'Albuquerque',
      choice_c: 'Roswell',
      choice_d: 'Las Cruces'
    };
    TriviaQuestion.findAll.mockResolvedValueOnce([question]);

    const replyMessage = { edit: jest.fn() };
    const reply = jest.fn(() => Promise.resolve(replyMessage));
    const followUp = jest.fn();
    let collectCb;
    let endCb;
    const collector = {
      on: jest.fn((evt, cb) => { if(evt==='collect') collectCb = cb; else if(evt==='end') endCb = cb; }),
      stop: jest.fn()
    };
    const interaction = {
      reply,
      followUp,
      guild: { members: { fetch: jest.fn() } },
      channel: { createMessageCollector: jest.fn(() => collector) }
    };

    jest.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.2).mockReturnValueOnce(0.3).mockReturnValueOnce(0.4);
    await nmtrivia.execute(interaction);

    endCb([], 'time');
    expect(followUp).toHaveBeenCalledWith(expect.stringContaining('Time’s up'));
    jest.advanceTimersByTime(30000);
    Math.random.mockRestore();
    jest.runOnlyPendingTimers();
  });
});
