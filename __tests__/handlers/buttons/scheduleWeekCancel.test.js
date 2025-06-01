const handler = require('../../../handlers/buttons/scheduleWeekCancel');

describe('scheduleWeekCancel', () => {
  it('updates interaction with cancellation message', async () => {
    const update = jest.fn();
    const interaction = { update };
    await handler(interaction);
    expect(update).toHaveBeenCalled();
  });
});
