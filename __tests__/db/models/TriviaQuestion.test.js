const mockDefine = jest.fn().mockReturnValue({ name: 'TriviaQuestion' });
jest.mock('../../../db/index', () => ({ define: mockDefine }));

describe('TriviaQuestion model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('defines TriviaQuestion schema', () => {
    const model = require('../../../db/models/TriviaQuestion');
    expect(mockDefine).toHaveBeenCalledWith(
      'TriviaQuestion',
      expect.objectContaining({
        question: expect.anything(),
        correct_answer: expect.anything(),
      }),
      expect.objectContaining({ tableName: 'trivia_questions' })
    );
    expect(model).toEqual({ name: 'TriviaQuestion' });
  });
});
