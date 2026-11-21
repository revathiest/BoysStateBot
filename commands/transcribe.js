const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const startHandler = require('./transcribe/start');
const stopHandler = require('./transcribe/stop');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transcribe')
    .setDescription('Transcribe a voice channel session.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Join a voice channel and start transcribing.')
        .addChannelOption(opt =>
          opt.setName('voice').setDescription('Voice channel (defaults to yours)').setRequired(false)
        )
        .addChannelOption(opt =>
          opt.setName('output').setDescription('Channel for the transcript (defaults to here)').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('stop')
        .setDescription('Stop transcribing and post the transcript.')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'start') return startHandler(interaction);
    if (sub === 'stop') return stopHandler(interaction);
  },
};
