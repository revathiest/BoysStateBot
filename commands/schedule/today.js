const CalendarEvent = require('../../db/models').CalendarEvent;
const { Op } = require('sequelize');
const formatScheduleList = require('../../utils/scheduleFormatter');
const buildScheduleEmbed = require('../../utils/scheduleEmbedBuilder');
const { MessageFlags } = require('discord.js');

module.exports = async function today(interaction, guildId) {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
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
        embeds: [{
          title: '<:newmexicoflag:1370750476332564520> Today’s Schedule',
          description: 'No events scheduled for today.',
          color: 0xCCCCCC,
          footer: { text: 'New Mexico Boys & Girls State' },
        }],
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
