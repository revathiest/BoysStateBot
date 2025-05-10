const buildScheduleEmbed = require('../../utils/scheduleEmbedBuilder');
const formatScheduleList = require('../../utils/scheduleFormatter');
const CalendarEvent = require('../../db/models').CalendarEvent;
const { Op } = require('sequelize');
const { MessageFlags } = require('discord-api-types/v10');

async function scheduleWeekCancel(interaction) {
    await interaction.update({ content: '✅ Cancelled.', components: [], flags: MessageFlags.Ephemeral });
  }

async function scheduleWeekConfirm(interaction) {

    try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - dayOfWeek);
        sunday.setHours(0, 0, 0, 0);
    
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        saturday.setHours(23, 59, 59, 999);
    
        const events = await CalendarEvent.findAll({
          where: {
            guildId,
            startTime: { [Op.between]: [sunday, saturday] },
          },
          order: [['startTime', 'ASC']],
        });
    
        if (!events.length) {
          return await interaction.reply({
            embeds: [buildScheduleEmbed('This Week’s Schedule', 'No events scheduled for this week.', 0xCCCCCC)],
            flags: MessageFlags.Ephemeral,
          });
        }
    
        // Group events by day name
        const days = {};
        for (let i = 0; i < 7; i++) {
          const dayName = new Date(sunday.getTime() + i * 86400000).toLocaleDateString(undefined, { weekday: 'long' });
          days[dayName] = [];
        }
    
        for (const event of events) {
          const dayName = event.startTime.toLocaleDateString(undefined, { weekday: 'long' });
          days[dayName].push(event);
        }
    
        // Build embeds per day
        const embeds = Object.entries(days).map(([day, dayEvents]) => {
          if (!dayEvents.length) {
            return buildScheduleEmbed(`Schedule for ${day}`, '_No events scheduled for this day._', 0xCCCCCC);
          }
    
          const list = formatScheduleList(dayEvents);
          return buildScheduleEmbed(`Schedule for ${day}`, list);
        });
    
        // Send embeds in batches of 10
        await interaction.reply({
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
        console.error('[schedule:week] ❌ Error listing schedule:', err);
        await interaction.reply({
          embeds: [buildScheduleEmbed('❌ Error Fetching Weekly Schedule', `An unexpected error occurred:\n\`${err.message}\``, 0xFF0000)],
          flags: MessageFlags.Ephemeral,
        });
      }
  };

  module.exports = {
    scheduleWeekCancel,
    scheduleWeekConfirm
  }
  