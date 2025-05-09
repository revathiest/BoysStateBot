const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const setHandler = require('./calendar/set');
const editHandler = require('./calendar/edit');
const removeHandler = require('./calendar/remove');
const listHandler = require('./calendar/list');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calendar')
    .setDescription('Manage Google Calendar configurations.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Adds a calendar for this server.')
        .addStringOption(option => option.setName('calendar_id').setDescription('Calendar ID').setRequired(true))
        .addStringOption(option => option.setName('label').setDescription('Optional label'))
        .addBooleanOption(option => option.setName('replace').setDescription('Replace existing calendars')))
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Updates or removes the label for a calendar.'))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Removes a calendar from this server.'))
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Lists all calendars configured for this server.')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    console.log(`[calendar] Received subcommand: ${sub}`);

    if (sub === 'set') return setHandler(interaction, guildId);
    if (sub === 'edit') return editHandler(interaction, guildId);
    if (sub === 'remove') return removeHandler(interaction, guildId);
    if (sub === 'list') return listHandler(interaction, guildId);
  },
};
