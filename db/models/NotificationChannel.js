const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const NotificationChannel = sequelize.define('NotificationChannel', {
  guildId: {
    type: DataTypes.STRING,
    primaryKey: true,
    comment: 'Discord guild ID',
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Channel ID to send notifications to',
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether calendar notifications are enabled',
  },
}, {
  tableName: 'notification_channels',
  timestamps: false,
});

module.exports = NotificationChannel;
