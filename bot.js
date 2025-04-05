// bot.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
} = require('discord.js');

// Create the client with all the juicy intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,                  // Required for slash commands & guild data
    GatewayIntentBits.GuildMessages,           // To read messages sent in text channels
    GatewayIntentBits.MessageContent,          // To read the actual content of messages (like "!ping")
    GatewayIntentBits.GuildMembers,            // To track member joins, roles, and user info
    GatewayIntentBits.GuildMessageReactions,   // If you want to react to or track reactions
    GatewayIntentBits.GuildPresences,          // If you care who's online or playing what
    GatewayIntentBits.DirectMessages,          // For responding in DMs
    GatewayIntentBits.GuildMessageTyping,      // (Optional) to track who's typing in channels
  ],
});

client.commands = new Collection();

// Load slash commands
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

// Register slash commands
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ There was an error executing that command.', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
