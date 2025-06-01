const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const TriviaQuestion = require('../db/models/TriviaQuestion');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nmtrivia')
    .setDescription('Answer a New Mexico government trivia question'),

  async execute(interaction) {
    let questions;
    try {
      questions = await TriviaQuestion.findAll();
      if (!questions.length) {
        return interaction.reply({ content: 'ℹ️ No trivia questions found in the database.', ephemeral: true });
      }
    } catch (err) {
      console.error('❌ Failed to fetch trivia questions from the DB:', err);
      return interaction.reply({ content: '❌ Database error fetching trivia questions.', ephemeral: true });
    }

    // Pick a random question
    const q = questions[Math.floor(Math.random() * questions.length)];
    const choices = [q.choice_a, q.choice_b, q.choice_c, q.choice_d];

    const shuffledChoices = choices
      .map(choice => ({ choice, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(c => c.choice);

    const choiceLetters = shuffledChoices.map((_, i) => String.fromCharCode(65 + i));
    const choiceLines = shuffledChoices.map((c, i) => `**${choiceLetters[i]}.** ${c}`).join('\n');

    const questionEmbed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('🧠 New Mexico Trivia')
      .setDescription(`**${q.question}**\n\n${choiceLines}`)
      .setFooter({ text: `Type your answer (${choiceLetters.join('/')}) below. You’ve got 30 seconds!` });

    const message = await interaction.reply({ embeds: [questionEmbed], fetchReply: true });

    const correctIndex = shuffledChoices.indexOf(q.correct_answer);
    const correctLetter = choiceLetters[correctIndex];
    let winnerDeclared = false;
    let secondsLeft = 30;

    const countdownInterval = setInterval(async () => {
      if (winnerDeclared) {
        clearInterval(countdownInterval);
        return;
      }

      secondsLeft -= 5;

      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
        const expiredEmbed = EmbedBuilder.from(questionEmbed).setFooter({
          text: `⏰ Time is up!`
        });

        try {
          await message.edit({ embeds: [expiredEmbed] });
        } catch (err) {
          console.warn('⚠️ Could not update embed at timeout:', err);
        }

        return;
      }

      const updatedEmbed = EmbedBuilder.from(questionEmbed).setFooter({
        text: `Type your answer (${choiceLetters.join('/')}) below. Time remaining: ${secondsLeft}s`
      });

      try {
        await message.edit({ embeds: [updatedEmbed] });
      } catch (err) {
        console.warn('⚠️ Failed to update embed timer:', err);
        clearInterval(countdownInterval);
      }
    }, 5000);

    if (typeof countdownInterval.unref === 'function') {
      countdownInterval.unref();
    }

    const filter = m => {
      if (m.author.bot) return false;
      const firstChar = m.content.trim().charAt(0).toLowerCase();
      return choiceLetters.map(letter => letter.toLowerCase()).includes(firstChar);
    };

    const collector = interaction.channel.createMessageCollector({
      filter,
      time: 30000,
    });

    collector.on('collect', async msg => {
      const reply = msg.content.trim().charAt(0).toUpperCase();
      const member = await interaction.guild.members.fetch(msg.author.id);
      const displayName = member.displayName;

      if (reply === correctLetter) {
        winnerDeclared = true;
        collector.stop('answered');

        await interaction.followUp(`✅ **${displayName}** got it right! The answer is **${correctLetter}. ${q.correct_answer}**`);
      }
    });

    collector.on('end', async (_, reason) => {
      if (!winnerDeclared && reason !== 'answered') {
        await interaction.followUp(`⌛ Time’s up! Nobody got the correct answer.\nThe answer was **${correctLetter}. ${q.correct_answer}**`);
      }
    });
  }
};
