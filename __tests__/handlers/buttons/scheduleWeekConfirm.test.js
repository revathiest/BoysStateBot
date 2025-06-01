jest.mock('../../../utils/scheduleEmbedBuilder', () => {
  const fn = jest.fn(() => ({ title: 'embed' }));
  return fn;
});

jest.mock('../../../utils/scheduleFormatter', () => jest.fn(() => 'list'));

const buildEmbed = require('../../../utils/scheduleEmbedBuilder');
const formatList = require('../../../utils/scheduleFormatter');

jest.mock('../../../db/models', () => {
  const eventFindAll = jest.fn();
  const configFindOne = jest.fn();
  return {
    CalendarEvent: { findAll: eventFindAll },
    CalendarConfig: { findOne: configFindOne },
    __esModule: true,
    __mock: { eventFindAll, configFindOne }
  };
});

const { __mock } = require('../../../db/models');
const eventFindAll = __mock.eventFindAll;
const configFindOne = __mock.configFindOne;

const handler = require('../../../handlers/buttons/scheduleWeekConfirm');

describe('scheduleWeekConfirm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles missing config dates', async () => {
    configFindOne.mockResolvedValue(null);
    const interaction = { update: jest.fn(), guildId: '1' };
    await handler(interaction);
    expect(interaction.update).toHaveBeenCalled();
    expect(buildEmbed).toHaveBeenCalled();
  });

  it('shows events from database', async () => {
    configFindOne.mockResolvedValue({ startDate: '2025-06-01', endDate: '2025-06-02', guildId: '1' });
    eventFindAll.mockResolvedValue([
      { startTime: new Date('2025-06-01T10:00:00Z'), summary: 'A' },
      { startTime: new Date('2025-06-02T10:00:00Z'), summary: 'B' }
    ]);
    const interaction = { update: jest.fn(), followUp: jest.fn(), guildId: '1' };
    await handler(interaction);
    expect(interaction.update).toHaveBeenCalled();
    expect(buildEmbed).toHaveBeenCalled();
  });

  it('handles database errors gracefully', async () => {
    configFindOne.mockRejectedValueOnce(new Error('db fail'));
    const interaction = { update: jest.fn(), guildId: '1' };
    await handler(interaction);
    expect(interaction.update).toHaveBeenCalled();
    expect(buildEmbed).toHaveBeenCalledWith(expect.stringContaining('Error Fetching'), expect.any(String), 0xFF0000);
  });
});
