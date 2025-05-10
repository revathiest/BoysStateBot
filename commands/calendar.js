const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const setHandler = require('./calendar/set');
const editHandler = require('./calendar/edit');
const removeHandler = require('./calendar/remove');
const listHandler = require('./calendar/list');
const setChannelHandler = require('./calendar/set-channel');
const listChannelsHandler = require('./calendar/list-channels');
const removeChannelHandler = require('./calendar/remove-channel');

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
         .setDescription('Updates or removes the label for a calendar.')
    )
    .addSubcommand(sub =>
      sub.setName('remove')
         .setDescription('Removes a calendar from this server.')
    )
    .addSubcommand(sub =>
      sub.setName('list')
         .setDescription('Lists all calendars configured for this server.')
    )
    .addSubcommand(sub =>
      sub.setName('set-channel')
         .setDescription('Sets the notification channel for this server.')
         .addChannelOption(opt =>
           opt.setName('channel')
              .setDescription('Channel to send notifications to')
              .setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('list-channels')
         .setDescription('Lists notification channels configured for this server.')
    )
    .addSubcommand(sub =>
      sub.setName('remove-channel')
         .setDescription('Removes a notification channel.')
         .addStringOption(opt =>
           opt.setName('channel_id')
              .setDescription('The channel ID to remove.')
              .setRequired(true)
         )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    console.log(`[calendar] Received subcommand: ${sub}`);

    if (sub === 'set') return setHandler(interaction, guildId);
    if (sub === 'edit') return editHandler(interaction, guildId);
    if (sub === 'remove') return removeHandler(interaction, guildId);
    if (sub === 'list') return listHandler(interaction, guildId);
    if (sub === 'set-channel') return setChannelHandler(interaction, guildId);
    if (sub === 'list-channels') return listChannelsHandler(interaction, guildId);
    if (sub === 'remove-channel') return removeChannelHandler(interaction, guildId);
  },
};
