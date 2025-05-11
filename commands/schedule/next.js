const { CalendarConfig, CalendarEvent } = require('../../db/models');
const { Op } = require('sequelize');
const formatScheduleList = require('../../utils/scheduleFormatter');
const buildScheduleEmbed = require('../../utils/scheduleEmbedBuilder');
const { MessageFlags } = require('discord-api-types/v10');

module.exports = async function next(interaction, guildId) {
  try {
    const config = await CalendarConfig.findOne({ where: { guildId } });
    if (!config || !config.startDate || !config.endDate) {
      return interaction.reply({
        embeds: [buildScheduleEmbed('⚠️ Calendar Range Not Configured', 'Configure a calendar date range first.', 0xFFAA00)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const now = new Date();
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    ));

    const endParts = config.endDate.split('-');
    const endDate = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59));

    const event = await CalendarEvent.findOne({
      where: {
        guildId,
        startTime: {
          [Op.gte]: nowUTC,
          [Op.lte]: endDate,
        },
      },
      order: [['startTime', 'ASC']],
    });

    if (!event) {
      return interaction.reply({
        embeds: [buildScheduleEmbed('Next Event', 'No upcoming events found within configured range.', 0xCCCCCC)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const list = formatScheduleList([event]);
    await interaction.reply({
      embeds: [buildScheduleEmbed('Next Event', list)],
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error(`[schedule:next] Error:`, err);
    return interaction.reply({
      embeds: [buildScheduleEmbed('⚠️ Error', `Unexpected error: \`${err.message}\``, 0xFF0000)],
      flags: MessageFlags.Ephemeral,
    });
  }
};