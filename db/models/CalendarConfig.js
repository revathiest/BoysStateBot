const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const CalendarConfig = sequelize.define('CalendarConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Primary key for calendar configs',
  },
  guildId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Discord Guild ID (server ID)',
  },
  calendarId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Google Calendar ID for the guild',
  }, 
  label: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'User-friendly name or alias for the calendar',
  }, 
  startDate: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
}, {
  tableName: 'calendar_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['guildId', 'calendarId'],
    },
  ],
});

module.exports = CalendarConfig;
