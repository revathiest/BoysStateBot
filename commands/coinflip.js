const { SlashCommandBuilder } = require('discord.js');

const outcomes = ['heads', 'tails'];
let pendingFlips = new Map(); // key: opponentId, value: { flipperId, result, timeoutId }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin and challenge another user to call it.')
    .addSubcommand(sub =>
      sub.setName('challenge')
        .setDescription('Flip a coin and challenge another user.')
        .addUserOption(option =>
          option.setName('opponent')
            .setDescription('The user to challenge')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('call')
        .setDescription('Call the result of a pending coin flip.')
        .addStringOption(option =>
          option.setName('guess')
            .setDescription('Your guess: heads or tails')
            .setRequired(true)
            .addChoices(
              { name: 'Heads', value: 'heads' },
              { name: 'Tails', value: 'tails' }
            )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'challenge') {
      const flipper = interaction.user;
      const opponent = interaction.options.getUser('opponent');

      if (flipper.id === opponent.id) {
        return interaction.reply({ content: '❌ You can’t challenge yourself, mate.', ephemeral: true });
      }

      if (pendingFlips.has(opponent.id)) {
        return interaction.reply({ content: '❌ That user already has a pending coin flip to call.', ephemeral: true });
      }

      const flipperMember = await interaction.guild.members.fetch(flipper.id);
      const opponentMember = await interaction.guild.members.fetch(opponent.id);

      const result = outcomes[Math.floor(Math.random() * 2)];

      // Set timeout to auto-remove challenge after 2 minutes
      const timeoutId = setTimeout(() => {
        pendingFlips.delete(opponent.id);

        (async () => {
          try {
            const freshFlipper = await interaction.guild.members.fetch(flipper.id);
            const freshOpponent = await interaction.guild.members.fetch(opponent.id);
            console.log(`⚠️ Coin flip from ${freshFlipper.displayName} to ${freshOpponent.displayName} timed out.`);
          } catch (err) {
            console.error('⚠️ Coinflip timeout fetch error:', err);
          }
        })();
      }, 2 * 60 * 1000);

      pendingFlips.set(opponent.id, { flipperId: flipper.id, result, timeoutId });

      return interaction.reply(
        `🪙 **${flipperMember.displayName}** flipped a coin and challenged **${opponentMember.displayName}**!\n` +
        `${opponent}, type \`/coinflip call\` and choose heads or tails *within 2 minutes*!`
      );
    }

    if (subcommand === 'call') {
      const caller = interaction.user;
      const guess = interaction.options.getString('guess');

      const flip = pendingFlips.get(caller.id);
      if (!flip) {
        return interaction.reply({ content: '❌ You have no pending coin flip to call.', ephemeral: true });
      }

      const { flipperId, result, timeoutId } = flip;
      clearTimeout(timeoutId);
      pendingFlips.delete(caller.id);

      const flipperMember = await interaction.guild.members.fetch(flipperId);
      const callerMember = await interaction.guild.members.fetch(caller.id);

      const winner = guess === result ? callerMember : flipperMember;

      return interaction.reply(
        `🪙 **${flipperMember.displayName}** flipped a coin...\n` +
        `**${callerMember.displayName}** guessed **${guess}**...\n\n` +
        `🎉 The result was **${result}**!\n` +
        `🏆 **${winner.displayName}** wins the coin flip!`
      );
    }
  }
};
