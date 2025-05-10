const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const NotificationChannel = sequelize.define('NotificationChannels', {
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
}, {
  tableName: 'notification_channels',
  timestamps: false,
});

module.exports = NotificationChannel;
