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
});
