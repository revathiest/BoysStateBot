const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const sequelize = require('../db'); // adjust path if needed
require('../db/models'); // loads and registers all models

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_sync')
    .setDescription('Admin-only: Synchronizes database schema')
    .addBooleanOption(option =>
      option.setName('alter')
        .setDescription('Use ALTER mode (adds/changes columns without dropping)')
    )
    .addBooleanOption(option =>
      option.setName('force')
        .setDescription('Use FORCE mode (DROPS and recreates tables!)')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    const alter = interaction.options.getBoolean('alter');
    const force = interaction.options.getBoolean('force');

    const options = {};
    if (alter) options.alter = true;
    if (force) options.force = true;

    try {
      await sequelize.authenticate();
      await sequelize.sync(options);
      await interaction.reply({
        content: `✅ Database synchronized successfully.\nOptions: \`${JSON.stringify(options)}\``,
        ephemeral: true,
      });
    } catch (error) {
      console.error('❌ DB sync failed:', error);
      await interaction.reply({
        content: `❌ Failed to synchronize DB:\n\`\`\`${error.message}\`\`\``,
        ephemeral: true,
      });
    }
  },
};
