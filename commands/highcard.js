const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const suits = ['♠ Spades', '♥ Hearts', '♦ Diamonds', '♣ Clubs'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
const cardImageBase = 'https://deckofcardsapi.com/static/img';

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

function getCardImageURL(card) {
  const valueCode = card.value === '10' ? '0' : card.value[0].toUpperCase();
  const suitCode = card.suit[0].toUpperCase();
  return `${cardImageBase}/${valueCode}${suitCode}.png`;
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
    console.log(`🔔 /highcard ${subcommand} called by ${interaction.user.tag}`);

    if (subcommand === 'challenge') {
      const challenger = interaction.user;
      const opponent = interaction.options.getUser('opponent');
      const challengerMember = await interaction.guild.members.fetch(challenger.id);
      const opponentMember = await interaction.guild.members.fetch(opponent.id);

      console.log(`🤝 Challenger: ${challengerMember.displayName}, Opponent: ${opponentMember.displayName}`);

      if (challenger.id === opponent.id) {
        const testerRole = interaction.guild.roles.cache.find(r => r.name === 'Bot Tester');
        const hasTesterRole = testerRole && challengerMember.roles.cache.has(testerRole.id);
        console.log(`🧪 Self-challenge attempt. Tester role? ${hasTesterRole}`);
        if (!hasTesterRole) {
          return interaction.reply({
            content: '❌ You can’t challenge yourself, mate.',
            flags: MessageFlags.Ephemeral
          });
        }
      }

      if (pendingChallenges.has(opponent.id)) {
        console.log(`⚠️ Opponent already has a pending challenge.`);
        return interaction.reply({
          content: '❌ That user already has a pending challenge.',
          flags: MessageFlags.Ephemeral
        });
      }

      const timeoutId = setTimeout(() => {
        pendingChallenges.delete(opponent.id);
        console.log(`⌛ Challenge to ${opponentMember.displayName} timed out.`);
      }, 2 * 60 * 1000); // 2 minutes

      pendingChallenges.set(opponent.id, { challengerId: challenger.id, timeoutId });

      console.log(`🎴 Challenge set. Awaiting response from ${opponentMember.displayName}`);

      return interaction.reply(
        `🎴 **${challengerMember.displayName}** has challenged **${opponentMember.displayName}** to a high-card duel!\n` +
        `${opponent}, type \`/highcard accept\` within 2 minutes to draw your card!`
      );
    }

    if (subcommand === 'accept') {
      const opponent = interaction.user;
      const challengeData = pendingChallenges.get(opponent.id);

      if (!challengeData) {
        console.log(`❌ No challenge found for ${opponent.tag}`);
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

      console.log(`🃏 ${challengerMember.displayName} drew: ${cardToString(card1)}`);
      console.log(`🃏 ${opponentMember.displayName} drew: ${cardToString(card2)}`);

      const value1 = getCardValue(card1);
      const value2 = getCardValue(card2);

      let result;
      if (value1 > value2) {
        result = `🏆 **${challengerMember.displayName}** wins with the ${cardToString(card1)}!`;
      } else if (value2 > value1) {
        result = `🏆 **${opponentMember.displayName}** wins with the ${cardToString(card2)}!`;
      } else {
        result = `🤯 It's a tie! You both drew ${cardToString(card1)}.`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎴 High Card Duel Result')
        .addFields(
          { name: challengerMember.displayName, value: `**${cardToString(card1)}**`, inline: true },
          { name: opponentMember.displayName, value: `**${cardToString(card2)}**`, inline: true }
        )
        .setImage(getCardImageURL(card1)) // Shows challenger’s card
        .setThumbnail(getCardImageURL(card2)) // Shows opponent’s card
        .setColor(0x9b59b6)
        .setFooter({ text: result });

      console.log(`✅ Duel complete. ${result}`);

      return interaction.reply({ embeds: [embed] });
    }
  }
};
