// handlers/interactionHandler.js
const { MessageFlags } = require('discord.js');

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  console.log(`📥 Received command: /${interaction.commandName} from ${interaction.user.tag}`);

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`⚠️ No matching command for /${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
    console.log(`✅ Executed /${interaction.commandName} successfully`);
  } catch (err) {
    console.error(`❌ Error executing /${interaction.commandName}:`, err);

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '⚠️ Something went wrong while running that command.',
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: '⚠️ Something went wrong while running that command.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (sendErr) {
      console.warn('⚠️ Failed to send error message to user:', sendErr);
    }
  }
};
