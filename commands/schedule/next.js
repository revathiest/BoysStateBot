const CalendarEvent = require('../../db/models').CalendarEvent;
const { Op } = require('sequelize');
const formatScheduleList = require('../../utils/scheduleFormatter');
const buildScheduleEmbed = require('../../utils/scheduleEmbedBuilder');
const { MessageFlags } = require('discord.js');

module.exports = async function next(interaction, guildId) {
  try {
    const now = new Date();

    const event = await CalendarEvent.findOne({
      where: {
        guildId,
        startTime: { [Op.gte]: now },
      },
      order: [['startTime', 'ASC']],
    });

    if (!event) {
      return await interaction.reply({
        embeds: [{
          title: '<:newmexicoflag:1370750476332564520> Next Event',
          description: 'There are no upcoming events scheduled.',
          color: 0xCCCCCC,
          footer: { text: 'New Mexico Boys & Girls State' },
        }],
        flags: MessageFlags.Ephemeral,
      });
    }

    const list = formatScheduleList([event]);

    await interaction.reply({
        embeds: [buildScheduleEmbed(`Next Event`, list)],
        flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('[schedule:next] ❌ Error fetching next event:', err);
    await interaction.reply({
      embeds: [buildScheduleEmbed('Next Event', 'There are no upcoming events scheduled.', 0xCCCCCC)],
      flags: MessageFlags.Ephemeral,
    });
  }
};
