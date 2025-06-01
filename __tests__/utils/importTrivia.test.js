const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('../../db/models/TriviaQuestion', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const TriviaQuestion = require('../../db/models/TriviaQuestion');
const importTriviaFromJSON = require('../../utils/importTrivia');

describe('importTriviaFromJSON', () => {
  const triviaPath = path.join(path.resolve(__dirname, '../../utils'), '../data/nmtrivia.json');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs and exits when file missing', async () => {
    fs.existsSync.mockReturnValue(false);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await importTriviaFromJSON();
    expect(fs.existsSync).toHaveBeenCalledWith(triviaPath);
    expect(logSpy).toHaveBeenCalled();
    expect(TriviaQuestion.create).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('handles invalid JSON', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('invalid json');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await importTriviaFromJSON();
    expect(errorSpy).toHaveBeenCalled();
    expect(TriviaQuestion.create).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('inserts new questions and skips existing', async () => {
    const data = [{ question: 'q1', answer: 'a1', choices: ['a1','b1','c1','d1'] },
                  { question: 'q2', answer: 'a2', choices: ['a2','b2','c2','d2'] }];
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(data));
    TriviaQuestion.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({});
    await importTriviaFromJSON();
    expect(TriviaQuestion.findOne).toHaveBeenCalledTimes(2);
    expect(TriviaQuestion.create).toHaveBeenCalledTimes(1);
    expect(TriviaQuestion.create.mock.calls[0][0]).toEqual({
      question: 'q1',
      correct_answer: 'a1',
      choice_a: 'a1',
      choice_b: 'b1',
      choice_c: 'c1',
      choice_d: 'd1',
    });
  });
});
