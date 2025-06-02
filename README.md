# Boys State Bot

A multifunctional Discord bot for the **New Mexico Boys State** program 🇺🇸, blending entertainment and utilities to foster engagement, education, and operational ease.

## 🚀 Features

- 🎮 **Games:** Coin Flip, High Card, New Mexico-themed Trivia
- 🗃️ **Database-backed Trivia:** Stores and manages questions using Sequelize ORM
- 📅 **Google Calendar Integration:** Sync calendar configs & events
- 🛠️ **Admin Utilities:** Test database & calendar connectivity; sync models
- ✨ Slash command support via `discord.js` v14
- 🔌 Modular command and interaction handlers for easy extension
- 📂 **Google Drive Search:** Authorized staff (Director, Office Staff, Senior Counselor, Junior Counselor) can find files by name or text, pick a result from a dropdown, and the bot will download the private file for you
- 🔕 **Toggle Schedule Notifications**: Pause and resume calendar update posts

## 🏗️ Project Structure

```
├── bot.js                 # Main bot entry point
├── commands/              # Slash command modules
│   ├── coinflip.js
│   ├── highcard.js
│   ├── nmtrivia.js
│   ├── db_sync.js
│   ├── db_test.js
│   ├── gcal_test.js
│   └── set_calendar.js
├── handlers/              # Command & interaction handlers
├── db/                    # Sequelize DB setup & models
│   ├── models/
│   ├── index.js
│   └── sync.js
├── utils/                 # Helper functions (if any)
├── logs/                  # Log outputs (if implemented)
├── package.json           # Project metadata
```

## 🛠️ Setup

1. **Clone the repo:**

```bash
git clone https://github.com/your-username/BoysStateBot.git
cd BoysStateBot
```

2. **Install dependencies:**

```bash
npm install
```

3. **Setup environment variables:**

Create a `.env` file:

```
DISCORD_TOKEN=your-discord-bot-token
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

4. **Run the bot:**

```bash
node bot.js
```

## 🧩 Adding Commands

Add a new `.js` file in `/commands/` exporting a `data` object (using `SlashCommandBuilder`) and an `execute` method:

```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('An example command.'),
  async execute(interaction) {
    await interaction.reply('Hello, world!');
  },
};
```

The `commandHandler` auto-loads commands on bot startup.

## 📝 Requirements

- Node.js v18+
- Discord.js v14
- Sequelize
- Google APIs Node.js Client (for calendar)

## ❤️ License

MIT

---

Crafted with passion for **New Mexico Boys State**, to entertain and empower.
