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
         .setDescription('View the next event'))
    .addSubcommand(sub =>
    sub.setName('week')
        .setDescription('View the full week schedule'))
    .addSubcommand(sub =>
    sub.setName('day')
        .setDescription('View the schedule for a day of the week')
        .addStringOption(opt =>
        opt.setName('day')
            .setDescription('Day of the week')
            .setRequired(true)
            .addChoices(
                { name: 'Sunday', value: 'sunday' },
                { name: 'Monday', value: 'monday' },
                { name: 'Tuesday', value: 'tuesday' },
                { name: 'Wednesday', value: 'wednesday' },
                { name: 'Thursday', value: 'thursday' },
                { name: 'Friday', value: 'friday' },
                { name: 'Saturday', value: 'saturday' },
            )
        )),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    switch (interaction.options.getSubcommand()) {
      case 'today': return await require('./schedule/today')(interaction, guildId);
      case 'next': return await require('./schedule/next')(interaction, guildId);
      case 'week': return await require('./schedule/week')(interaction, guildId);
      case 'day': return await require('./schedule/day')(interaction, guildId);
    }
  },
};
