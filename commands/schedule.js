const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('View the event schedule')
    .addSubcommand(sub =>
      sub.setName('today')
         .setDescription('View today’s schedule'))
    .addSubcommand(sub =>
      sub.setName('next')
         .setDescription('View the next event')),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    switch (interaction.options.getSubcommand()) {
      case 'today': return await require('./schedule/today')(interaction, guildId);
      case 'next': return await require('./schedule/next')(interaction, guildId);
    }
  },
};
