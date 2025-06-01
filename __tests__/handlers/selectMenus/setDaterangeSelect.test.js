jest.mock('../../../db/models', () => {
  const update = jest.fn();
  return { CalendarConfig: { update }, __esModule: true, __mock: { update } };
});

const { __mock } = require('../../../db/models');
const updateModel = __mock.update;

const handler = require('../../../handlers/selectMenus/setDaterangeSelect');

describe('setDaterangeSelect', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('updates date range and interaction', async () => {
    const interaction = {
      customId: 'set-daterange:2025-06-01:2025-06-02',
      values: ['cal'],
      guildId: '1',
      update: jest.fn()
    };
    await handler(interaction);
    expect(updateModel).toHaveBeenCalledWith(
      { startDate: '2025-06-01', endDate: '2025-06-02' },
      { where: { guildId: '1', calendarId: 'cal' } }
    );
    expect(interaction.update).toHaveBeenCalledWith({
      content: '✅ Date range set for **cal**: 2025-06-01 → 2025-06-02',
      components: []
    });
  });
});
