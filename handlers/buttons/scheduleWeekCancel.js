const { MessageFlags } = require('discord-api-types/v10');

module.exports = async (interaction) => {
  await interaction.update({
    content: '❌ Cancelled.',
    components: [],
    flags: MessageFlags.Ephemeral,
  });
};
