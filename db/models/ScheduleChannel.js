const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const ScheduleChannel = sequelize.define('ScheduleChannel', {
  guildId: {
    type: DataTypes.STRING,
    primaryKey: true,
    comment: 'Discord guild ID'
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Channel ID for daily schedule posts'
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Last posted schedule message ID'
  }
}, {
  tableName: 'schedule_channels',
  timestamps: false
});

module.exports = ScheduleChannel;
