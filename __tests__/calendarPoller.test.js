// Mocks must come FIRST (hoisted before require)
jest.mock('../db/models', () => ({
    CalendarConfig: { findAll: jest.fn() },
    CalendarEvent: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  }));
  
  jest.mock('googleapis', () => ({
    google: {
      calendar: jest.fn(),
      auth: { GoogleAuth: jest.fn() },
    },
  }));
  
  const { google } = require('googleapis');
  const { CalendarConfig, CalendarEvent } = require('../db/models');
  const { pollCalendars } = require('../utils/calendarPoller');
  
  describe('calendarPoller', () => {
    let mockEventsList;
    let mockCalendarApi;
  
    beforeEach(() => {
      jest.clearAllMocks();
  
      mockEventsList = jest.fn();
      mockCalendarApi = { events: { list: mockEventsList } };
  
      google.calendar.mockReturnValue(mockCalendarApi);
    });
  
    test('adds new event from API', async () => {
      CalendarConfig.findAll.mockResolvedValue([
        { guildId: 'guild1', calendarId: 'cal1' },
      ]);
      CalendarEvent.findOne.mockResolvedValue(null);
      CalendarEvent.findAll.mockResolvedValue([]);
      CalendarEvent.create.mockResolvedValue({}); // avoid unhandled promise
  
      mockEventsList.mockResolvedValue({
        data: {
          items: [
            {
              id: 'event1',
              summary: 'Test Event',
              start: { dateTime: '2025-05-10T12:00:00Z' },
              end: { dateTime: '2025-05-10T13:00:00Z' },
              location: 'Location A',
            },
          ],
        },
      });
  
      await pollCalendars();
  
      expect(CalendarEvent.create).toHaveBeenCalledWith(expect.objectContaining({
        guildId: 'guild1',
        calendarId: 'cal1',
        eventId: 'event1',
        summary: 'Test Event',
        location: 'Location A',
      }));
    });
  
    test('updates event if time or location changed', async () => {
      const saveMock = jest.fn();
      CalendarConfig.findAll.mockResolvedValue([
        { guildId: 'guild1', calendarId: 'cal1' },
      ]);
      CalendarEvent.findOne.mockResolvedValue({
        eventId: 'event1',
        startTime: new Date('2025-05-10T11:00:00Z'),
        location: 'Old Location',
        save: saveMock,
      });
      CalendarEvent.findAll.mockResolvedValue([]);
  
      mockEventsList.mockResolvedValue({
        data: {
          items: [
            {
              id: 'event1',
              summary: 'Test Event Updated',
              start: { dateTime: '2025-05-10T12:00:00Z' },
              end: { dateTime: '2025-05-10T13:00:00Z' },
              location: 'New Location',
            },
          ],
        },
      });
  
      await pollCalendars();
  
      expect(saveMock).toHaveBeenCalled();
    });
  
    test('deletes stale event if missing from API', async () => {
      const destroyMock = jest.fn();
      CalendarConfig.findAll.mockResolvedValue([
        { guildId: 'guild1', calendarId: 'cal1' },
      ]);
      CalendarEvent.findOne.mockResolvedValue(null);
      CalendarEvent.findAll.mockResolvedValue([
        { eventId: 'eventOld', summary: 'Old Event', destroy: destroyMock },
      ]);
  
      mockEventsList.mockResolvedValue({
        data: { items: [] },
      });
  
      await pollCalendars();
  
      expect(destroyMock).toHaveBeenCalled();
    });
  });
  