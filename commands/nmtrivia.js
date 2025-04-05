const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nmtrivia')
    .setDescription('Answer a New Mexico government trivia question'),

  async execute(interaction) {
    const triviaPath = path.join(__dirname, '../data/nmtrivia.json');
    let questions = [];

    try {
      const data = fs.readFileSync(triviaPath, 'utf-8');
      questions = JSON.parse(data);
    } catch (err) {
      console.error('❌ Failed to load trivia file:', err);
      return interaction.reply({ content: '❌ Trivia is currently unavailable. Please try again later.', ephemeral: true });
    }

    if (!questions.length) {
      return interaction.reply({ content: 'ℹ️ No trivia questions loaded yet!', ephemeral: true });
    }

    // Pick a random question
    const q = questions[Math.floor(Math.random() * questions.length)];
    const shuffledChoices = q.choices
      .map(choice => ({ choice, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(c => c.choice);

    // Generate choice letters based on available options
    const choiceLetters = shuffledChoices.map((_, i) => String.fromCharCode(65 + i)); // ['A', 'B', ...]

    const choiceLines = shuffledChoices.map((c, i) => `**${choiceLetters[i]}.** ${c}`).join('\n');

    // In reply:
    await interaction.reply({
    content: `🧠 **New Mexico Trivia!**\n\n${q.question}\n\n${choiceLines}\n\nType your answer (${choiceLetters.join('/')}) below.`
    });

    // Adjusted filter:
    const filter = m =>
    m.author.id === interaction.user.id &&
    choiceLetters.map(letter => letter.toLowerCase()).includes(m.content.toLowerCase());


    try {
      const collected = await interaction.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000,
        errors: ['time']
      });

      const reply = collected.first().content.toUpperCase();

      const responder = collected.first().author;
      const member = await interaction.guild.members.fetch(responder.id);
      const displayName = member.displayName;
      
      if (reply === correctLetter) {
        await interaction.followUp(`✅ **${displayName}** got it right! The answer is **${correctLetter}. ${q.answer}**`);
      } else {
        await interaction.followUp(`❌ **${displayName}** guessed **${reply}**, but the correct answer was **${correctLetter}. ${q.answer}**`);
      }
      
    } catch (err) {
      await interaction.followUp('⌛ Time’s up! No answer received.');
    }
  }
};
