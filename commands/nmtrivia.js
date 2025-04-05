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
    const { EmbedBuilder } = require('discord.js');

    const questionEmbed = new EmbedBuilder()
      .setColor(0x3498DB) // Nice blue tone
      .setTitle('🧠 New Mexico Trivia')
      .setDescription(`**${q.question}**\n\n${choiceLines}`)
      .setFooter({ text: `Type your answer (${choiceLetters.join('/')}) below. You’ve got 30 seconds!` });
    
    await interaction.reply({ embeds: [questionEmbed] });
    

    // Adjusted filter:
    const filter = m =>
    m.author.id === interaction.user.id &&
    choiceLetters.map(letter => letter.toLowerCase()).includes(m.content.toLowerCase());

    const correctIndex = shuffledChoices.indexOf(q.answer);
    const correctLetter = choiceLetters[correctIndex];
    let winnerDeclared = false;
    

    const totalTime = 30000; // 30s
    const warningTime = 10000; // last 10s

    //Set the amount of time to wait for an answer
    const collector = interaction.channel.createMessageCollector({
      filter,
      time: totalTime, //30 seconds
    });

setTimeout(() => {
  if (!winnerDeclared) {
    interaction.followUp(`⏳ ${warningTime / 1000} seconds left!`);
  }
}, totalTime - warningTime);

    
    collector.on('collect', async msg => {
      const reply = msg.content.toUpperCase();
      const member = await interaction.guild.members.fetch(msg.author.id);
      const displayName = member.displayName;
    
      if (reply === correctLetter) {
        winnerDeclared = true;
        collector.stop('answered'); // stop collection once someone gets it right
    
        await interaction.followUp(`✅ **${displayName}** got it right! The answer is **${correctLetter}. ${q.answer}**`);
      }
    });
    
    collector.on('end', async (_, reason) => {
      if (!winnerDeclared && reason !== 'answered') {
        await interaction.followUp(`⌛ Time’s up! Nobody got the correct answer.\nThe answer was **${correctLetter}. ${q.answer}**`);
      }
    });
    
  }
};
