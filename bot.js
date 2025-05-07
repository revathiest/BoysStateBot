// bot.js
require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const commandHandler = require('./handlers/commandHandler');
const interactionHandler = require('./handlers/interactionHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Handle interactions
client.on('interactionCreate', interaction => interactionHandler(client, interaction));

// Log in
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('✅ Bot logged in successfully'))
  .catch(err => {
    console.error('❌ Bot login failed:', err);
    process.exit(1);
  });

// Load commands after ready
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await commandHandler(client);
});
