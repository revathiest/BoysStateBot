const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
const suitCodes = { Spades: 'S', Hearts: 'H', Diamonds: 'D', Clubs: 'C' };

let pendingChallenges = new Map();

function getDeck() {
  console.log('🃏 Building a new deck...');
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
    console.log(`🔔 Command received: /highcard ${subcommand} by ${interaction.user.tag}`);

    if (subcommand === 'challenge') {
      const challenger = interaction.user;
      const opponent = interaction.options.getUser('opponent');
      const challengerMember = await interaction.guild.members.fetch(challenger.id);
      const opponentMember = await interaction.guild.members.fetch(opponent.id);

      console.log(`👤 Challenger: ${challengerMember.displayName} (${challenger.id})`);
      console.log(`🎯 Opponent: ${opponentMember.displayName} (${opponent.id})`);

      if (challenger.id === opponent.id) {
        console.log('⚠️ Self-challenge detected. Checking for "Bot Tester" role...');
        const testerRole = interaction.guild.roles.cache.find(role => role.name === 'Bot Tester');
        const hasTesterRole = testerRole && challengerMember.roles.cache.has(testerRole.id);

        if (!hasTesterRole) {
          console.log('❌ Self-challenge blocked: No Bot Tester role');
          return interaction.reply({
            content: '❌ You can’t challenge yourself, mate.',
            flags: MessageFlags.Ephemeral
          });
        }

        console.log('✅ Self-challenge allowed via Bot Tester role');
      }

      if (pendingChallenges.has(opponent.id)) {
        console.log(`❌ ${opponentMember.displayName} already has a pending challenge.`);
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
        console.log(`⌛ Challenge timed out for ${opponentMember.displayName}`);
      }, 2 * 60 * 1000);

      pendingChallenges.set(opponent.id, { challengerId: challenger.id, timeoutId });
      console.log(`✅ Challenge stored for ${opponentMember.displayName}`);

      return interaction.reply({
        content: `🎴 **${challengerMember.displayName}** has challenged **${opponentMember.displayName}** to a high-card duel!\n` +
                 `${opponent}, type \`/highcard accept\` within 2 minutes to draw your card!`
      });
    }

    if (subcommand === 'accept') {
      const opponent = interaction.user;
      console.log(`📥 Accept command from ${opponent.tag}`);
      const challengeData = pendingChallenges.get(opponent.id);

      if (!challengeData) {
        console.log('❌ No pending challenge found');
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
      console.log(`🎮 Duel begins: ${challengerMember.displayName} vs ${opponentMember.displayName}`);

      const deck = getDeck();
      const card1 = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
      const card2 = deck[Math.floor(Math.random() * deck.length)];

      const card1Code = getCardCode(card1);
      const card2Code = getCardCode(card2);
      const card1Url = `https://deckofcardsapi.com/static/img/${card1Code}.png`;
      const card2Url = `https://deckofcardsapi.com/static/img/${card2Code}.png`;

      const value1 = getCardValue(card1);
      const value2 = getCardValue(card2);

      console.log(`🃏 ${challengerMember.displayName} drew ${card1.value} of ${card1.suit} [${value1}]`);
      console.log(`🃏 ${opponentMember.displayName} drew ${card2.value} of ${card2.suit} [${value2}]`);

      let resultText = '';
      if (value1 > value2) {
        resultText = `🏆 **${challengerMember.displayName}** wins with the **${card1.value} of ${card1.suit}**!`;
      } else if (value2 > value1) {
        resultText = `🏆 **${opponentMember.displayName}** wins with the **${card2.value} of ${card2.suit}**!`;
      } else {
        resultText = `🤯 It's a tie! You both drew **${card1.value} of ${card1.suit}**. That's mad!`;
      }

      const embed1 = new EmbedBuilder()
        .setTitle(`${challengerMember.displayName}'s Card`)
        .setThumbnail(card1Url)
        .setDescription(`**${card1.value} of ${card1.suit}**`);

      const embed2 = new EmbedBuilder()
        .setTitle(`${opponentMember.displayName}'s Card`)
        .setThumbnail(card2Url)
        .setDescription(`**${card2.value} of ${card2.suit}**`);

      console.log('📤 Sending final result...');
      await interaction.reply({
        content: `🃏 **High Card Duel Result**\n\n${resultText}`,
        embeds: [embed1, embed2]
      });
    }
  }
};
