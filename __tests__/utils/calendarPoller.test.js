jest.mock('googleapis', () => {
  const getClient = jest.fn().mockResolvedValue('mockAuthClient');

  return {
    google: {
      auth: {
        GoogleAuth: jest.fn(() => ({ getClient }))
      },
      calendar: jest.fn(() => ({
        events: {
          list: jest.fn().mockResolvedValue({
            data: {
              items: [{
                id: 'event1',
                summary: 'Test Event',
                start: { dateTime: '2025-05-10T12:00:00Z' },
                end: { dateTime: '2025-05-10T13:00:00Z' },
                location: 'Location A',
              }]
            }
          })
        }
      })),
    },
  };
});

const { pollCalendars } = require('../../utils/calendarPoller');
const { CalendarConfig, CalendarEvent, NotificationChannel } = require('../../db/models');

describe('calendarPoller', () => {
  const sendMock = jest.fn();
  const fetchMock = jest.fn().mockResolvedValue({ send: sendMock });
  const clientMock = { channels: { fetch: fetchMock } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('adds new event from API and sends notification', async () => {
    CalendarConfig.findAll = jest.fn().mockResolvedValue([{ guildId: 'guild1', calendarId: 'cal1' }]);
    CalendarEvent.findOne = jest.fn().mockResolvedValue(null);
    CalendarEvent.findAll = jest.fn().mockResolvedValue([]);
    CalendarEvent.create = jest.fn().mockResolvedValue({});
    NotificationChannel.findOne = jest.fn().mockResolvedValue({ channelId: '1234567890' });

    await pollCalendars(clientMock);

    expect(CalendarEvent.create).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('1234567890');
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array) }));
  });

  test('updates event if time or location changed and sends notification', async () => {
    const saveMock = jest.fn();
    CalendarConfig.findAll = jest.fn().mockResolvedValue([{ guildId: 'guild1', calendarId: 'cal1' }]);
    CalendarEvent.findOne = jest.fn().mockResolvedValue({
      eventId: 'event1',
      startTime: new Date('2025-05-10T11:00:00Z'),
      location: 'Old Location',
      save: saveMock,
    });
    CalendarEvent.findAll = jest.fn().mockResolvedValue([]);
    NotificationChannel.findOne = jest.fn().mockResolvedValue({ channelId: '1234567890' });

    await pollCalendars(clientMock);

    expect(saveMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('1234567890');
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array) }));
  });

  test('deletes stale event if missing from API and sends notification', async () => {
    const destroyMock = jest.fn();
    CalendarConfig.findAll = jest.fn().mockResolvedValue([{ guildId: 'guild1', calendarId: 'cal1' }]);
    CalendarEvent.findOne = jest.fn().mockResolvedValue(null);
    CalendarEvent.findAll = jest.fn().mockResolvedValue([{ eventId: 'eventOld', summary: 'Old Event', startTime: new Date(), location: '', destroy: destroyMock }]);
    NotificationChannel.findOne = jest.fn().mockResolvedValue({ channelId: '1234567890' });

    await pollCalendars(clientMock);

    expect(destroyMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('1234567890');
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array) }));
  });
  test('throws descriptive error if client is missing', async () => {
    await expect(pollCalendars()).rejects.toThrow('[pollCalendars] A valid Discord client must be passed');
  });  
});
