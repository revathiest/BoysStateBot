// bot.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {  Client, Collection, GatewayIntentBits, REST, Routes,} = require('discord.js');
const importTriviaFromJSON = require('./utils/importTrivia');

// Load token from .env
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ No DISCORD_TOKEN found in .env!');
  process.exit(1);
}

if (!process.env.GUILD_ID) {
  console.error('❌ No GUILD_ID found in .env!');
  process.exit(1);
}

// Initialise client with full intents
console.log('🛠️ Initialising bot with intents...');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageTyping,
  ],
});

client.commands = new Collection();
const commands = [];

console.log('📁 Loading command files...');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    if (!command.data || !command.execute) {
      console.warn(`⚠️ Skipped ${file}: Missing "data" or "execute"`);
      continue;
    }
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✅ Loaded command: ${command.data.name}`);
  } catch (error) {
    console.error(`❌ Error loading ${file}:`, error);
  }
}

client.once('ready', async () => {
  console.log(`🎉 Bot logged in as ${client.user.tag}`);

  // Inside your async startup block
  await sequelize.sync();
  await importTriviaFromJSON();

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const guildId = process.env.GUILD_ID;

  try {
    console.log('🌐 Registering slash commands with Discord API...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commands }
    );
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  console.log(`🔔 Received command: /${interaction.commandName} from ${interaction.user.tag}`);

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`⚠️ No matching command found for /${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
    console.log(`✅ Executed /${interaction.commandName} successfully`);
  } catch (error) {
    console.error(`❌ Error executing /${interaction.commandName}:`, error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ There was an error executing that command.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('🚀 Bot login successful'))
  .catch(err => {
    console.error('❌ Bot login failed:', err);
    process.exit(1);
  });
