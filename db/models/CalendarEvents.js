const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const CalendarEvent = sequelize.define('CalendarEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Primary key for calendar events',
  },
  guildId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Discord Guild ID',
  },
  calendarId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Google Calendar ID',
  },
  eventId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Google Calendar Event ID',
  },
  summary: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Event title/summary',
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Event location',
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Event start time',
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Event end time',
  },
}, {
  tableName: 'calendar_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['guildId', 'calendarId', 'eventId'] },
  ],
});

module.exports = CalendarEvent;
