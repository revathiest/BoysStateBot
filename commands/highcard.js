const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
const suitCodes = { Spades: 'S', Hearts: 'H', Diamonds: 'D', Clubs: 'C' };

let pendingChallenges = new Map();

function getDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ value, suit });
    }
  }
  return deck;
}

function getCardCode(card) {
  const valueCode = card.value === '10' ? '0' : card.value[0].toUpperCase();
  return `${valueCode}${suitCodes[card.suit]}`;
}

function getCardValue(card) {
  return values.indexOf(card.value);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('highcard')
    .setDescription('Challenge someone to a high-card duel')
    .addSubcommand(sub =>
      sub.setName('challenge')
        .setDescription('Challenge a user to a card draw')
        .addUserOption(option =>
          option.setName('opponent')
            .setDescription('The user to challenge')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('accept')
        .setDescription('Accept a pending challenge')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'challenge') {
      const challenger = interaction.user;
      const opponent = interaction.options.getUser('opponent');
      const challengerMember = await interaction.guild.members.fetch(challenger.id);
      const opponentMember = await interaction.guild.members.fetch(opponent.id);

      if (challenger.id === opponent.id) {
        const testerRole = interaction.guild.roles.cache.find(role => role.name === 'Bot Tester');
        console.log('🔍 Found tester role:', testerRole?.name || 'Not found');
        console.log('🎭 Challenger roles:', challengerMember.roles.cache.map(r => r.name));

        const hasTesterRole = testerRole && challengerMember.roles.cache.has(testerRole.id);
        console.log('✅ Has tester role:', hasTesterRole);

        if (!hasTesterRole) {
          return interaction.reply({
            content: '❌ You can’t challenge yourself, mate.',
            flags: MessageFlags.Ephemeral
          });
        }
      }

      if (pendingChallenges.has(opponent.id)) {
        return interaction.reply({
          content: '❌ That user already has a pending challenge.',
          flags: MessageFlags.Ephemeral
        });
      }

      const timeoutId = setTimeout(() => {
        pendingChallenges.delete(opponent.id);
        interaction.followUp({
          content: `⌛ Challenge from **${challengerMember.displayName}** to **${opponentMember.displayName}** timed out.`
        }).catch(() => {});
      }, 2 * 60 * 1000); // 2 min

      pendingChallenges.set(opponent.id, { challengerId: challenger.id, timeoutId });

      const embed = new EmbedBuilder()
        .setTitle('🎴 High Card Challenge!')
        .setDescription(`**${challengerMember.displayName}** has challenged **${opponentMember.displayName}** to a duel!`)
        .setColor(0x9B59B6)
        .setFooter({ text: `${opponentMember.displayName}, type /highcard accept within 2 minutes!` });

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'accept') {
      const opponent = interaction.user;
      const challengeData = pendingChallenges.get(opponent.id);

      if (!challengeData) {
        return interaction.reply({
          content: '❌ You have no pending challenges.',
          flags: MessageFlags.Ephemeral
        });
      }

      const challenger = await interaction.client.users.fetch(challengeData.challengerId);
      const challengerMember = await interaction.guild.members.fetch(challenger.id);
      const opponentMember = await interaction.guild.members.fetch(opponent.id);

      clearTimeout(challengeData.timeoutId);
      pendingChallenges.delete(opponent.id);

      const deck = getDeck();
      const card1 = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
      const card2 = deck[Math.floor(Math.random() * deck.length)];

      const card1Code = getCardCode(card1);
      const card2Code = getCardCode(card2);

      const value1 = getCardValue(card1);
      const value2 = getCardValue(card2);

      let result = '';
      if (value1 > value2) {
        result = `🏆 **${challengerMember.displayName}** wins with the **${card1.value} of ${card1.suit}**!`;
      } else if (value2 > value1) {
        result = `🏆 **${opponentMember.displayName}** wins with the **${card2.value} of ${card2.suit}**!`;
      } else {
        result = `🤯 It's a tie! You both drew **${card1.value} of ${card1.suit}**. Madness.`;
      }

      const resultEmbed = new EmbedBuilder()
        .setTitle('🃏 High Card Duel Result')
        .setColor(0x1ABC9C)
        .setDescription(result)
        .setImage('attachment://cards.png')
        .addFields(
          {
            name: challengerMember.displayName,
            value: `[🂠 View Card](https://deckofcardsapi.com/static/img/${card1Code}.png)`,
            inline: true,
          },
          {
            name: opponentMember.displayName,
            value: `[🂠 View Card](https://deckofcardsapi.com/static/img/${card2Code}.png)`,
            inline: true,
          }
        );

      await interaction.reply({ embeds: [resultEmbed] });
    }
  }
};
