const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const searchHandler = require('./drive/search');
const grepHandler = require('./drive/grep');

const ALLOWED_ROLES = ['Director', 'Office Staff', 'Senior Counselor', 'Junior Counselor'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('drive')
    .setDescription('Google Drive utilities.')
    .setDefaultMemberPermissions(null)
    .setDMPermission(false)
    .addSubcommand(sub =>
      sub.setName('search')
        .setDescription('Search for a file by name.')
        .addStringOption(opt =>
          opt.setName('name').setDescription('File name to search for').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('grep')
        .setDescription('Search for text within files.')
        .addStringOption(opt =>
          opt.setName('query').setDescription('Text to search for').setRequired(true)
        )
    ),
  async execute(interaction) {
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const hasAllowedRole = interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.name));
    if (!isAdmin && !hasAllowedRole) {
      return interaction.reply({
        content: '🚫 Permission Denied',
        ephemeral: true,
      });
    }
    const sub = interaction.options.getSubcommand();
    if (sub === 'search') {
      return searchHandler(interaction);
    }
    if (sub === 'grep') {
      return grepHandler(interaction);
    }
  },
};
