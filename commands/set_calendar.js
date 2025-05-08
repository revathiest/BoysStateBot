const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const CalendarConfig = require('../db/models/CalendarConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set_calendar')
    .setDescription('Sets a Google Calendar ID for this server')
    .addStringOption(option =>
      option.setName('calendar_id')
        .setDescription('The Google Calendar ID to add')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('replace')
        .setDescription('Replace existing calendars for this server?'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    const calendarId = interaction.options.getString('calendar_id');
    const replace = interaction.options.getBoolean('replace');
    const guildId = interaction.guildId;

    try {
      if (replace) {
        await CalendarConfig.destroy({ where: { guildId } });
      }

      await CalendarConfig.create({ guildId, calendarId });

      await interaction.reply({
        content: replace
          ? `✅ Existing calendars replaced. Set calendar ID to \`${calendarId}\`.`
          : `✅ Added calendar ID \`${calendarId}\` for this server.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('❌ Failed to set calendar:', error);
      await interaction.reply({
        content: `❌ Failed to set calendar:\n\`\`\`${error.message}\`\`\``,
        ephemeral: true,
      });
    }
  },
};
