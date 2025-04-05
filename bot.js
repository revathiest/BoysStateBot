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
  MessageFlags,
} = require('discord.js');

// Load and validate environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ No DISCORD_TOKEN found in .env!');
  process.exit(1);
}

if (!process.env.GUILD_ID) {
  console.error('❌ No GUILD_ID found in .env!');
  process.exit(1);
}

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

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ Something went wrong while running that command.',
          flags: MessageFlags.Ephemeral
        });
      } else {
        await interaction.reply({
          content: '❌ Something went wrong while running that command.',
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (err) {
      console.warn('⚠️ Failed to send error message to user:', err);
    }
  }
});

// Global error handling
process.on('unhandledRejection', reason => {
  console.error('🛑 Unhandled promise rejection:', reason);
});

process.on('uncaughtException', err => {
  console.error('💥 Uncaught exception:', err);
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('🚀 Bot login successful'))
  .catch(err => {
    console.error('❌ Bot login failed:', err);
    process.exit(1);
  });
