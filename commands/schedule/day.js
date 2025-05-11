const { CalendarConfig, CalendarEvent } = require('../../db/models');
const { Op } = require('sequelize');
const formatScheduleList = require('../../utils/scheduleFormatter');
const buildScheduleEmbed = require('../../utils/scheduleEmbedBuilder');
const { MessageFlags } = require('discord-api-types/v10');

module.exports = async function day(interaction, guildId) {
  try {
    const inputDay = interaction.options.getString('day');

    const config = await CalendarConfig.findOne({ where: { guildId } });
    if (!config || !config.startDate || !config.endDate) {
      return interaction.reply({
        embeds: [
          buildScheduleEmbed(
            '⚠️ Date Range Not Configured',
            'No startDate and/or endDate configured for this server\'s calendar.',
            0xFFAA00
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Safe local parsing
    const startParts = config.startDate.split('-');
    const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);

    const endParts = config.endDate.split('-');
    const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    const anchorSunday = new Date(startDate);
    anchorSunday.setDate(startDate.getDate() - startDate.getDay());

    const dayIndex = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }[inputDay];

    if (dayIndex === undefined) {
      console.warn(`[schedule:day] Invalid input day: ${inputDay}`);
      return interaction.reply({
        embeds: [
          buildScheduleEmbed(
            '⚠️ Invalid Day',
            `Unknown day: ${inputDay}`,
            0xFFAA00
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const targetDate = new Date(anchorSunday);
    targetDate.setDate(anchorSunday.getDate() + dayIndex);

    if (targetDate < startDate || targetDate > endDate) {
      console.warn(`[schedule:day] Target date ${targetDate.toDateString()} is outside configured range.`);
      return interaction.reply({
        embeds: [
          buildScheduleEmbed(
            '⚠️ Date Outside Configured Range',
            `${inputDay.charAt(0).toUpperCase() + inputDay.slice(1)} is outside the configured range (${config.startDate} → ${config.endDate}).`,
            0xFFAA00
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Define UTC query window
    const startOfDayUTC = new Date(Date.UTC(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      0, 0, 0, 0
    ));
    const endOfDayUTC = new Date(Date.UTC(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23, 59, 59, 999
    ));

    const events = await CalendarEvent.findAll({
      where: {
        guildId,
        startTime: { [Op.between]: [startOfDayUTC, endOfDayUTC] },
      },
      order: [['startTime', 'ASC']],
    });

    if (!events.length) {
      return interaction.reply({
        embeds: [
          buildScheduleEmbed(
            `Schedule for ${inputDay.charAt(0).toUpperCase() + inputDay.slice(1)}`,
            `No events scheduled for ${inputDay}.`,
            0xCCCCCC
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const list = formatScheduleList(events);

    await interaction.reply({
      embeds: [
        buildScheduleEmbed(
          `Schedule for ${inputDay.charAt(0).toUpperCase() + inputDay.slice(1)}`,
          list
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  } catch (err) {
    console.error(`[schedule:day] ⚠️ Error listing schedule:`, err);
    await interaction.reply({
      embeds: [
        buildScheduleEmbed(
          '⚠️ Error Fetching Schedule',
          `An unexpected error occurred:\n\`${err.message}\``,
          0xFF0000
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
};
