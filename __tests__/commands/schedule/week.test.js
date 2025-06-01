const week = require('../../../commands/schedule/week');

describe('schedule week', () => {
  test('asks for confirmation', async () => {
    const reply = jest.fn();
    await week({ reply });
    expect(reply).toHaveBeenCalled();
  });
});
