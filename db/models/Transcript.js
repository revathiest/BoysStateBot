const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Transcript = sequelize.define('Transcript', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  guildId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Discord guild ID'
  },
  voiceChannelId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Voice channel that was transcribed'
  },
  textChannelId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Channel the transcript was posted to'
  },
  startedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'User ID that started the session'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  entryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'Full plain-text transcript'
  },
  summary: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'AI-generated summary (key points, action items)'
  }
}, {
  tableName: 'transcripts',
  timestamps: false
});

module.exports = Transcript;
