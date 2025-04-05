const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const coinImages = {
  heads: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/1879CC_Morgan_Dollar_obverse.jpg',
  tails: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/1879CC_Morgan_Dollar_reverse.jpg',
};

let pendingFlips = new Map(); // key: opponentId, value: { challengerId, result, timeoutId }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Challenge someone to a coin flip')
    .addSubcommand(sub =>
      sub.setName('challenge')
        .setDescription('Challenge another user')
        .addUserOption(option =>
          option.setName('opponent')
            .setDescription('The person you want to challenge')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('call')
        .setDescription('Call the coin flip result')
        .addStringOption(option =>
          option.setName('side')
            .setDescription('Your call: heads or tails')
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
      const challenger = interaction.user;
      const opponent = interaction.options.getUser('opponent');
      const challengerMember = await interaction.guild.members.fetch(challenger.id);
      const opponentMember = await interaction.guild.members.fetch(opponent.id);

      if (challenger.id === opponent.id) {
        const testerRole = interaction.guild.roles.cache.find(r => r.name === 'Bot Tester');
        const hasTesterRole = testerRole && challengerMember.roles.cache.has(testerRole.id);

        if (!hasTesterRole) {
          return interaction.reply({
            content: '❌ You can’t flip a coin against yourself, love.',
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      if (pendingFlips.has(opponent.id)) {
        return interaction.reply({
          content: '❌ That person already has a pending coin flip challenge.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Flip the coin secretly now
      const result = Math.random() < 0.5 ? 'heads' : 'tails';

      const timeoutId = setTimeout(() => {
        pendingFlips.delete(opponent.id);
        interaction.followUp({
          content: `⌛ **${opponentMember.displayName}** didn't respond in time. The challenge from **${challengerMember.displayName}** expired.`
        }).catch(() => {});
      }, 2 * 60 * 1000); // 2 minutes

      pendingFlips.set(opponent.id, { challengerId: challenger.id, result, timeoutId });

      return interaction.reply(
        `🪙 **${challengerMember.displayName}** flipped a coin and challenged **${opponentMember.displayName}**!\n` +
        `${opponent}, use \`/coinflip call\` to choose heads or tails within 2 minutes!`
      );
    }

    if (subcommand === 'call') {
      const opponent = interaction.user;
      const call = interaction.options.getString('side');
      const challengeData = pendingFlips.get(opponent.id);

      if (!challengeData) {
        return interaction.reply({
          content: '❌ You have no pending coin flip challenges.',
          flags: MessageFlags.Ephemeral
        });
      }

      const { challengerId, result, timeoutId } = challengeData;
      const challenger = await interaction.client.users.fetch(challengerId);
      const challengerMember = await interaction.guild.members.fetch(challenger.id);
      const opponentMember = await interaction.guild.members.fetch(opponent.id);

      clearTimeout(timeoutId);
      pendingFlips.delete(opponent.id);

      const correct = call === result;
      const coinImage = coinImages[result];

      const resultText = correct
        ? `🏆 **${opponentMember.displayName}** called **${call}** and was **right**!`
        : `😬 **${opponentMember.displayName}** called **${call}** but the coin landed on **${result}**.`;

      const embed = new EmbedBuilder()
        .setTitle('🪙 Coin Flip Result')
        .setDescription(resultText)
        .setThumbnail(coinImage)
        .setFooter({ text: `Flipped by ${challengerMember.displayName}` });

      return interaction.reply({ embeds: [embed] });
    }
  }
};
