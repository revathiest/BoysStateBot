const { CalendarConfig, CalendarEvent } = require('../../db/models');
const { Op } = require('sequelize');
const formatScheduleList = require('../../utils/scheduleFormatter');
const buildScheduleEmbed = require('../../utils/scheduleEmbedBuilder');
const { MessageFlags } = require('discord-api-types/v10');

module.exports = async function today(interaction, guildId) {
  try {
    const config = await CalendarConfig.findOne({ where: { guildId } });
    if (!config || !config.startDate || !config.endDate) {
      return interaction.reply({
        embeds: [buildScheduleEmbed('⚠️ Calendar Range Not Configured', 'Configure a calendar date range first.', 0xFFAA00)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const now = new Date();
    const todayUTCStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const todayUTCEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

    const events = await CalendarEvent.findAll({
      where: {
        guildId,
        startTime: { [Op.between]: [todayUTCStart, todayUTCEnd] },
      },
      order: [['startTime', 'ASC']],
    });

    if (!events.length) {
      return interaction.reply({
        embeds: [buildScheduleEmbed("Today's Schedule", 'No events scheduled for today.', 0xCCCCCC)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const list = formatScheduleList(events);
    await interaction.reply({
      embeds: [buildScheduleEmbed(`Today's Schedule`, list)], 
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('[schedule:today] ❌ Error listing schedule:', err);
    await interaction.reply({
      embeds: [buildScheduleEmbed('Today’s Schedule', 'No events scheduled for today.', 0xCCCCCC)],
      flags: MessageFlags.Ephemeral,
    });
  }
};