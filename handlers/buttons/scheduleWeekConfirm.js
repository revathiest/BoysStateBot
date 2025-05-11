// --- handlers/buttons/scheduleWeekConfirm.js ---
const buildScheduleEmbed = require('../../utils/scheduleEmbedBuilder');
const formatScheduleList = require('../../utils/scheduleFormatter');
const { CalendarEvent, CalendarConfig } = require('../../db/models');
const { Op } = require('sequelize');
const { MessageFlags } = require('discord-api-types/v10');

module.exports = async (interaction) => {
  try {
    const guildId = interaction.guildId;
    const config = await CalendarConfig.findOne({ where: { guildId } });

    if (!config || !config.startDate || !config.endDate) {
      return interaction.update({
        content: '',
        components: [],
        embeds: [
          buildScheduleEmbed('This Week\'s Schedule', 'Calendar date range not configured for this server.', 0xFFAA00)
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const [sy, sm, sd] = config.startDate.split('-');
    const [ey, em, ed] = config.endDate.split('-');

    const startUTC = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0));
    const endUTC = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));

    const events = await CalendarEvent.findAll({
      where: {
        guildId,
        startTime: { [Op.between]: [startUTC, endUTC] },
      },
      order: [['startTime', 'ASC']],
    });

    if (!events.length) {
      return interaction.update({
        content: '',
        components: [],
        embeds: [
          buildScheduleEmbed('This Week\'s Schedule', 'No events scheduled in the configured date range.', 0xCCCCCC)
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Group events by date (YYYY-MM-DD)
    const days = {};
    for (const evt of events) {
      const dateStr = evt.startTime.toISOString().split('T')[0];
      if (!days[dateStr]) days[dateStr] = [];
      days[dateStr].push(evt);
    }

    // Build one embed per day
    const embeds = Object.entries(days).map(([date, dayEvents]) => {
      const list = formatScheduleList(dayEvents);
      return buildScheduleEmbed(`Schedule for ${date}`, list);
    });

    await interaction.update({
      content: '',
      components: [],
      embeds: embeds.slice(0, 10),
      flags: MessageFlags.Ephemeral,
    });

    for (let i = 10; i < embeds.length; i += 10) {
      await interaction.followUp({
        embeds: embeds.slice(i, i + 10),
        flags: MessageFlags.Ephemeral,
      });
    }

  } catch (err) {
    console.error('[schedule:week_confirm] ⚠️ Error fetching weekly schedule:', err);
    await interaction.update({
      content: '',
      components: [],
      embeds: [
        buildScheduleEmbed('⚠️ Error Fetching Weekly Schedule', `An unexpected error occurred:\n\`${err.message}\``, 0xFF0000)
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
};
