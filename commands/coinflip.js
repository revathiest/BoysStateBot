const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const HEADS_IMG = 'https://www.wholesalecoinsdirect.com/media/catalog/product/p/r/prod-21morganms70-smint-2021-s-morgan-silver-dollar-obverse-650x650.jpg';
const TAILS_IMG = 'https://www.wholesalecoinsdirect.com/media/catalog/product/p/r/prod-21morganms70-smint-2021-s-morgan-silver-dollar-reverse-650x650.jpg';

let pendingFlips = new Map(); // key: challengedUserId, value: { challengerId, result, timeout }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Challenge someone to a coin flip')
    .addUserOption(option =>
      option.setName('opponent')
        .setDescription('The user to challenge')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('call')
        .setDescription('Your call: heads or tails')
        .setRequired(false)
        .addChoices(
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' }
        )
    ),

  async execute(interaction) {
    const challenger = interaction.user;
    const opponent = interaction.options.getUser('opponent');
    const call = interaction.options.getString('call');

    const challengerMember = await interaction.guild.members.fetch(challenger.id);
    const opponentMember = await interaction.guild.members.fetch(opponent.id);

    const testerRole = interaction.guild.roles.cache.find(role => role.name === 'Bot Tester');
    const isSelfChallenge = challenger.id === opponent.id;
    const isAllowedTester = testerRole && challengerMember.roles.cache.has(testerRole.id);

    if (isSelfChallenge && !isAllowedTester) {
      return interaction.reply({
        content: '❌ You can’t flip a coin against yourself, love.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (pendingFlips.has(opponent.id)) {
      return interaction.reply({
        content: '❌ That user already has a pending coin flip challenge.',
        flags: MessageFlags.Ephemeral
      });
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const image = result === 'heads' ? HEADS_IMG : TAILS_IMG;

    const timeout = setTimeout(() => {
      pendingFlips.delete(opponent.id);
    }, 2 * 60 * 1000);

    pendingFlips.set(opponent.id, { challengerId: challenger.id, result, timeout });

    if (call) {
      // If call is provided immediately
      const outcome = call.toLowerCase() === result ? `${challengerMember.displayName} wins!` : `${challengerMember.displayName} loses!`;
      pendingFlips.delete(opponent.id);
      clearTimeout(timeout);

      const embed = new EmbedBuilder()
        .setTitle('🪙 Coin Flip Result')
        .setDescription(`The coin landed on **${result.toUpperCase()}**!\n**${outcome}**`)
        .setImage(image)
        .setColor(0xC0C0C0);

      return interaction.reply({ embeds: [embed] });
    }

    // Otherwise, wait for opponent to call heads/tails
    await interaction.reply({
      content: `🪙 **${challengerMember.displayName}** has challenged **${opponentMember.displayName}** to a coin flip!\n` +
               `${opponent}, reply with \`heads\` or \`tails\` within 2 minutes to make your call!`
    });

    const filter = msg => msg.author.id === opponent.id && ['heads', 'tails'].includes(msg.content.toLowerCase());

    const collector = interaction.channel.createMessageCollector({ filter, time: 120000 });

    collector.on('collect', async msg => {
      const choice = msg.content.toLowerCase();
      const challenge = pendingFlips.get(opponent.id);

      if (!challenge) return;

      clearTimeout(challenge.timeout);
      pendingFlips.delete(opponent.id);

      const outcome = choice === challenge.result ? `${opponentMember.displayName} wins!` : `${opponentMember.displayName} loses!`;

      const embed = new EmbedBuilder()
        .setTitle('🪙 Coin Flip Result')
        .setDescription(`The coin landed on **${challenge.result.toUpperCase()}**!\n**${outcome}**`)
        .setImage(image)
        .setColor(0xC0C0C0);

      await interaction.followUp({ embeds: [embed] });
      collector.stop();
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time' && pendingFlips.has(opponent.id)) {
        pendingFlips.delete(opponent.id);
        interaction.followUp(`⌛ **${opponentMember.displayName}** didn’t respond in time. The coin flip was cancelled.`);
      }
    });
  }
};
