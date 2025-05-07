// handlers/commandHandler.js
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = async (client) => {
  const commandFiles = fs.readdirSync(path.join(__dirname, '../commands'))
    .filter(file => file.endsWith('.js'));

  const commands = [];

  for (const file of commandFiles) {
    try {
      const command = require(`../commands/${file}`);
      if (!command.data || !command.execute) {
        console.warn(`⚠️ Skipped ${file}: Missing "data" or "execute"`);
        continue;
      }
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded command: ${command.data.name}`);
    } catch (err) {
      console.error(`❌ Error loading ${file}:`, err);
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const guildId = process.env.GUILD_ID;

  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commands }
    );
    console.log('✅ Slash commands registered successfully');
  } catch (err) {
    console.error('❌ Failed to register slash commands:', err);
  }
};
