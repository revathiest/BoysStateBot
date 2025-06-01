jest.mock('googleapis', () => {
  const insertMock = jest.fn();
  return {
    google: { calendar: jest.fn(() => ({ events: { insert: insertMock } })) },
    __esModule: true,
    __mock: { insertMock }
  };
});

const { __mock } = require('googleapis');
const insertMock = __mock.insertMock;

jest.mock('../../../utils/googleAuth', () => ({ getClient: jest.fn().mockResolvedValue({}) }));

jest.mock('../../../db/models', () => {
  const findOne = jest.fn();
  return { CalendarConfig: { findOne }, __esModule: true, __mock: { findOne } };
});

const { __mock: dbMock } = require('../../../db/models');
const configFindOne = dbMock.findOne;

jest.mock('../../../nmbs_schedule.json', () => ([
  { summary: 'A', date: '2025-06-01', start: '10:00', end: '11:00', location: 'L' },
  { summary: 'B', date: '2025-06-01', start: '12:00', end: '13:00', location: 'L' }
]), { virtual: true });

const handler = require('../../../handlers/buttons/importSchedule');

describe('importSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects wrong user', async () => {
    const reply = jest.fn();
    const interaction = {
      customId: 'import_schedule_1:2',
      user: { id: 'x' },
      guildId: '2',
      reply,
    };
    await handler(interaction);
    expect(reply).toHaveBeenCalled();
  });

  it('handles missing config', async () => {
    configFindOne.mockResolvedValue(null);
    const interaction = {
      customId: 'import_schedule_1:2',
      user: { id: '1' },
      guildId: '2',
      deferReply: jest.fn(),
      editReply: jest.fn(),
    };
    await handler(interaction);
    expect(interaction.editReply).toHaveBeenCalledWith({ content: '❌ No calendar configured for this server.' });
  });

  it('imports events and reports failures', async () => {
    configFindOne.mockResolvedValue({ calendarId: 'cal' });
    insertMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('fail'));
    const interaction = {
      customId: 'import_schedule_1:2',
      user: { id: '1' },
      guildId: '2',
      deferReply: jest.fn(),
      editReply: jest.fn(),
    };
    await handler(interaction);
    const msg = interaction.editReply.mock.calls[0][0].content;
    expect(msg).toContain('Imported 1 events');
    expect(msg).toContain('Failed: B');
  });
});
