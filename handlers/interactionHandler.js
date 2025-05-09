const { MessageFlags } = require('discord.js');

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

module.exports = async (client, interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`⚠️ No matching command for /${interaction.commandName}`);
      return;
    }
    try {
      await command.execute(interaction);
      console.log(`✅ Executed /${interaction.commandName}`);
    } catch (err) {
      console.error(`❌ Error executing /${interaction.commandName}:`, err);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: '⚠️ Something went wrong.', flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: '⚠️ Something went wrong.', flags: MessageFlags.Ephemeral });
        }
      } catch (sendErr) {
        console.warn(`⚠️ Failed to send error reply:`, sendErr);
      }
    }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    const baseId = interaction.customId.includes('_') ? interaction.customId.split('_').slice(0, -1).join('_') : interaction.customId;
    const handlerPath = `./selectMenus/${toCamelCase(baseId)}.js`;
    try {
      const handler = require(handlerPath);
      return await handler(interaction);
    } catch (err) {
      console.error(`❌ No handler for selectMenu ${interaction.customId} (${handlerPath}):`, err);
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    const baseId = interaction.customId.includes('_') ? interaction.customId.split('_').slice(0, -1).join('_') : interaction.customId;
    const handlerPath = `./modals/${toCamelCase(baseId)}.js`;
    try {
      const handler = require(handlerPath);
      return await handler(interaction);
    } catch (err) {
      console.error(`❌ No handler for modal ${interaction.customId} (${handlerPath}):`, err);
    }
    return;
  }
};
