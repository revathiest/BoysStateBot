jest.mock('googleapis', () => {
  const listMock = jest.fn();
  const deleteMock = jest.fn();
  return {
    google: { calendar: jest.fn(() => ({ events: { list: listMock, delete: deleteMock } })) },
    __esModule: true,
    __mock: { listMock, deleteMock }
  };
});

const { __mock } = require('googleapis');
const listMock = __mock.listMock;
const deleteMock = __mock.deleteMock;

jest.mock('../../../utils/googleAuth', () => ({ getClient: jest.fn().mockResolvedValue({}) }));

jest.mock('../../../db/models', () => {
  const findOne = jest.fn();
  return { CalendarConfig: { findOne }, __esModule: true, __mock: { findOne } };
});

const { __mock: dbMock } = require('../../../db/models');
const configFindOne = dbMock.findOne;

const handler = require('../../../handlers/buttons/confirmClearWeek');

describe('confirmClearWeek', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects wrong user', async () => {
    const reply = jest.fn();
    const interaction = {
      customId: 'confirm_clear_week_123:456',
      user: { id: '999' },
      guildId: '456',
      reply,
    };
    await handler(interaction);
    expect(reply).toHaveBeenCalled();
  });

  it('handles missing config', async () => {
    configFindOne.mockResolvedValue(null);
    const interaction = {
      customId: 'confirm_clear_week_123:456',
      user: { id: '123' },
      guildId: '456',
      deferReply: jest.fn(),
      editReply: jest.fn(),
    };
    await handler(interaction);
    expect(interaction.editReply).toHaveBeenCalledWith({ content: '❌ No calendar configured for this server.' });
  });

  it('deletes events and reports failures', async () => {
    configFindOne.mockResolvedValue({ calendarId: 'cal' });
    listMock.mockResolvedValue({ data: { items: [{ id: '1', summary: 'one' }, { id: '2', summary: 'two' }] } });
    deleteMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('fail'));
    const interaction = {
      customId: 'confirm_clear_week_123:456',
      user: { id: '123' },
      guildId: '456',
      deferReply: jest.fn(),
      editReply: jest.fn(),
    };
    await handler(interaction);
    const msg = interaction.editReply.mock.calls[0][0].content;
    expect(msg).toContain('Deleted 1 events');
    expect(msg).toContain('Failed to delete: two');
  });
});
