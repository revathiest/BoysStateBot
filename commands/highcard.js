const { SlashCommandBuilder } = require('discord.js');

const suits = ['♠ Spades', '♥ Hearts', '♦ Diamonds', '♣ Clubs'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];

let pendingChallenges = new Map(); // key: opponentId, value: { challengerId, timeoutId }

function getDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ value, suit });
    }
  }
  return deck;
}

function cardToString(card) {
  return `${card.value} of ${card.suit}`;
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
      console.log(challenger);
      console.log(opponent);

      if (challenger.id === opponent.id) {
        return interaction.reply({ content: '❌ You can’t challenge yourself, mate.', ephemeral: true });
      }

      // Check if opponent already has a pending challenge
      if (pendingChallenges.has(opponent.id)) {
        return interaction.reply({ content: '❌ That user already has a pending challenge.', ephemeral: true });
      }

      // Set timeout to auto-remove the challenge after 2 minutes
      const timeoutId = setTimeout(() => {
        pendingChallenges.delete(opponent.id);
        console.log(`⚠️ Challenge to ${opponent.username} from ${challenger.username} timed out.`);
      }, 2 * 60 * 1000); // 2 minutes

      pendingChallenges.set(opponent.id, { challengerId: challenger.id, timeoutId });

      return interaction.reply(`🎴 **${challenger.username}** has challenged **${opponent.username}** to a high-card duel!\n` +
        `${opponent}, type \`/highcard accept\` within 2 minutes to draw your card!`);
    }

    if (subcommand === 'accept') {
      const user = interaction.user;
      const challengeData = pendingChallenges.get(user.id);

      if (!challengeData) {
        return interaction.reply({ content: '❌ You have no pending challenges.', ephemeral: true });
      }

      const challengerId = challengeData.challengerId;
      const challenger = await interaction.client.users.fetch(challengerId);

      clearTimeout(challengeData.timeoutId);
      pendingChallenges.delete(user.id);

      const deck = getDeck();
      const card1 = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
      const card2 = deck[Math.floor(Math.random() * deck.length)];

      const value1 = getCardValue(card1);
      const value2 = getCardValue(card2);

      let result = '';
      if (value1 > value2) {
        result = `🏆 **${challenger.username}** wins with the ${cardToString(card1)}!`;
      } else if (value2 > value1) {
        result = `🏆 **${user.username}** wins with the ${cardToString(card2)}!`;
      } else {
        result = `🤯 It's a tie! You both drew ${cardToString(card1)}. That's mad!`;
      }

      await interaction.reply({
        content: `🃏 **High Card Duel Result!**\n\n` +
          `**${challenger.username}** drew the **${cardToString(card1)}**\n` +
          `**${user.username}** drew the **${cardToString(card2)}**\n\n` +
          result
      });
    }
  }
};
