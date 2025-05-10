const CalendarEvent = require('../../db/models').CalendarEvent;
const { Op } = require('sequelize');
const formatScheduleList = require('../../utils/scheduleFormatter');
const buildScheduleEmbed = require('../../utils/scheduleEmbedBuilder');
const { MessageFlags } = require('discord-api-types/v10');

module.exports = async function day(interaction, guildId) {
  try {
    const inputDay = interaction.options.getString('day'); // expects lowercase string: 'monday', etc

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    const dayIndex = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }[inputDay];

    const targetDate = new Date(sunday);
    targetDate.setDate(sunday.getDate() + dayIndex);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await CalendarEvent.findAll({
      where: {
        guildId,
        startTime: { [Op.between]: [startOfDay, endOfDay] },
      },
      order: [['startTime', 'ASC']],
    });

    if (!events.length) {
      return await interaction.reply({
        embeds: [buildScheduleEmbed(`Schedule for ${inputDay.charAt(0).toUpperCase() + inputDay.slice(1)}`, `No events scheduled for ${inputDay}.`, 0xCCCCCC)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const list = formatScheduleList(events);

    await interaction.reply({
      embeds: [buildScheduleEmbed(`Schedule for ${inputDay.charAt(0).toUpperCase() + inputDay.slice(1)}`, list)],
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('[schedule:day] ❌ Error listing schedule:', err);
    await interaction.reply({
      embeds: [buildScheduleEmbed('❌ Error Fetching Day’s Schedule', `An unexpected error occurred:\n\`${err.message}\``, 0xFF0000)],
      flags: MessageFlags.Ephemeral,
    });
  }
};
