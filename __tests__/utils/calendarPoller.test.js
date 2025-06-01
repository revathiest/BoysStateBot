jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({
        getClient: jest.fn().mockResolvedValue({}),
      })),
    },
    calendar: jest.fn().mockReturnValue({
      events: {
        list: jest.fn().mockResolvedValue({
          data: {
            items: [
              {
                id: 'event1',
                summary: 'Test Event',
                start: { dateTime: '2025-06-07T12:00:00Z' },
                end: { dateTime: '2025-06-07T13:00:00Z' },
                location: 'Test Location',
              },
            ],
          },
        }),
      },
    }),
  },
}));

jest.mock('../../db/models', () => {
  return {
    CalendarConfig: {
      findAll: jest.fn(),
    },
    CalendarEvent: {
      findOne: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      findAll: jest.fn(),
    },
    NotificationChannel: {
      findOne: jest.fn(),
    },
  };
});

const { pollCalendars } = require('../../utils/calendarPoller');
const { CalendarConfig, CalendarEvent, NotificationChannel } = require('../../db/models');

const { google } = require('googleapis');
const mockClient = {
  channels: {
    fetch: jest.fn().mockResolvedValue({ send: jest.fn() }),
  },
};

describe('calendarPoller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips configs without startDate or endDate', async () => {
    CalendarConfig.findAll.mockResolvedValue([{ guildId: '123', calendarId: 'abc' }]);
    await pollCalendars(mockClient);
    expect(CalendarEvent.create).not.toHaveBeenCalled();
  });

  it('calls Google API and creates events using configured date range', async () => {
    CalendarConfig.findAll.mockResolvedValue([{
      guildId: '123',
      calendarId: 'abc',
      startDate: '2025-06-01',
      endDate: '2025-06-10',
    }]);

    CalendarEvent.findOne.mockResolvedValue(undefined);
    NotificationChannel.findOne.mockResolvedValue({ channelId: 'abc123' });

    await pollCalendars(mockClient);

    expect(CalendarEvent.create).toHaveBeenCalled();
    const createCallArgs = CalendarEvent.create.mock.calls[0][0];
    console.log('[calendarPoller.test] Create called with:', createCallArgs);

    expect(createCallArgs).toEqual(expect.objectContaining({
      guildId: '123',
      calendarId: 'abc',
      eventId: 'event1',
      summary: 'Test Event',
      location: 'Test Location',
      startTime: new Date('2025-06-07T12:00:00Z'),
      endTime: new Date('2025-06-07T13:00:00Z'),
    }));
  });

  it('parses all-day events from date fields', async () => {
    CalendarConfig.findAll.mockResolvedValue([{ guildId: '1', calendarId: 'cal', startDate: '2025-06-01', endDate: '2025-06-10' }]);
    const allDayEvent = {
      id: 'event2',
      summary: 'All Day',
      start: { date: '2025-06-08' },
      end: { date: '2025-06-09' },
      location: 'Loc',
    };
    google.calendar().events.list.mockResolvedValueOnce({ data: { items: [allDayEvent] } });
    CalendarEvent.findOne.mockResolvedValue(undefined);
    NotificationChannel.findOne.mockResolvedValue({ channelId: 'chan' });
    CalendarEvent.findAll.mockResolvedValue([]);
    const send = jest.fn();
    mockClient.channels.fetch.mockResolvedValue({ send });

    await pollCalendars(mockClient);

    const created = CalendarEvent.create.mock.calls[0][0];
    expect(created.startTime.toISOString()).toBe('2025-06-08T06:00:00.000Z');
    expect(created.endTime.toISOString()).toBe('2025-06-09T06:00:00.000Z');
  });

  it('throws if client is invalid', async () => {
    await expect(pollCalendars({})).rejects.toThrow('pollCalendars');
  });

  it('updates existing events when changed', async () => {
    CalendarConfig.findAll.mockResolvedValue([{ guildId: '1', calendarId: 'cal', startDate: '2025-06-01', endDate: '2025-06-10' }]);
    const save = jest.fn();
    CalendarEvent.findOne.mockResolvedValue({
      startTime: new Date('2025-06-07T10:00:00Z'),
      endTime: new Date('2025-06-07T11:00:00Z'),
      location: 'Old Location',
      summary: 'Old',
      save
    });
    NotificationChannel.findOne.mockResolvedValue({ channelId: 'chan' });
    const send = jest.fn();
    mockClient.channels.fetch.mockResolvedValue({ send });
    CalendarEvent.findAll.mockResolvedValue([]);

    await pollCalendars(mockClient);

    expect(save).toHaveBeenCalled();
    expect(send).toHaveBeenCalled();
    expect(CalendarEvent.create).not.toHaveBeenCalled();
  });

  it('removes stale events and notifies', async () => {
    CalendarConfig.findAll.mockResolvedValue([{ guildId: '1', calendarId: 'cal', startDate: '2025-06-01', endDate: '2025-06-10' }]);
    CalendarEvent.findOne.mockResolvedValue(undefined);
    const staleDestroy = jest.fn();
    CalendarEvent.findAll.mockResolvedValue([{ destroy: staleDestroy, summary: 'Gone', startTime: new Date('2025-06-05T12:00:00Z'), location: 'There' }]);
    NotificationChannel.findOne.mockResolvedValue({ channelId: 'chan' });
    const send = jest.fn();
    mockClient.channels.fetch.mockResolvedValue({ send });

    await pollCalendars(mockClient);

    expect(staleDestroy).toHaveBeenCalled();
    expect(send).toHaveBeenCalled();
  });

  it('does not notify when channel disabled', async () => {
    CalendarConfig.findAll.mockResolvedValue([{ guildId: '1', calendarId: 'cal', startDate: '2025-06-01', endDate: '2025-06-10' }]);
    CalendarEvent.findOne.mockResolvedValue(undefined);
    CalendarEvent.findAll.mockResolvedValue([]);
    NotificationChannel.findOne.mockResolvedValue({ channelId: 'chan', enabled: false });
    const send = jest.fn();
    mockClient.channels.fetch.mockResolvedValue({ send });

    await pollCalendars(mockClient);

    expect(send).not.toHaveBeenCalled();
  });
});
