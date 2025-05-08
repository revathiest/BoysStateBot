const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const sequelize = require('../db'); // adjust path if needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_test')
    .setDescription('Admin-only: Tests database connection')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    try {
      await sequelize.authenticate();
      await interaction.reply({
        content: '✅ Database connection has been established successfully.',
        ephemeral: true,
      });
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      await interaction.reply({
        content: `❌ Unable to connect to the database:\n\`\`\`${error.message}\`\`\``,
        ephemeral: true,
      });
    }
  },
};
