jest.mock('googleapis', () => {
  const getMock = jest.fn();
  return { google: { auth: { GoogleAuth: jest.fn().mockReturnValue({}) }, calendar: jest.fn(() => ({ calendars: { get: getMock } })) }, __esModule: true, __mock: { getMock } };
});

jest.mock('../../../db/models/CalendarConfig', () => {
  const destroy = jest.fn();
  const create = jest.fn();
  return { destroy, create, __esModule: true, __mock: { destroy, create } };
});

const { __mock: gMock } = require('googleapis');
const { __mock: dbMock } = require('../../../db/models/CalendarConfig');
const setCmd = require('../../../commands/calendar/set');

describe('calendar set', () => {
  beforeEach(() => jest.clearAllMocks());

  test('handles calendar not found', async () => {
    gMock.getMock.mockRejectedValue({ code: 404 });
    const reply = jest.fn();
    const options = { getString: jest.fn(), getBoolean: jest.fn() };
    await setCmd({ options, reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('creates calendar when valid', async () => {
    gMock.getMock.mockResolvedValue({ data: { summary: 'Cal' } });
    const reply = jest.fn();
    const options = { getString: jest.fn(key => key==='calendar_id'? 'id':'label'), getBoolean: jest.fn(() => true) };
    await setCmd({ options, reply }, 'g');
    expect(dbMock.destroy).toHaveBeenCalled();
    expect(dbMock.create).toHaveBeenCalled();
    expect(reply).toHaveBeenCalled();
  });
});
