const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke-channel')
    .setDescription('Deletes all messages in this channel (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.channel;
    await interaction.reply({ content: `🧨 Nuking all messages in #${channel.name}...`, ephemeral: true });

    try {
      let fetched;
      do {
        fetched = await channel.messages.fetch({ limit: 100 });
        const deletable = fetched.filter(msg => (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);

        if (deletable.size > 0) {
          await channel.bulkDelete(deletable, true);
          console.log(`[nuke-channel] Deleted ${deletable.size} messages.`);
        }

        // If some old messages remain, delete them one by one
        const nonBulk = fetched.filter(msg => !deletable.has(msg.id));
        for (const msg of nonBulk.values()) {
          await msg.delete().catch(() => {});
        }
      } while (fetched.size >= 2);

      console.log(`[nuke-channel] Channel #${channel.name} wiped.`);
      await interaction.editReply({ content: '✅ Channel nuked.' });
    } catch (err) {
      console.error(`[nuke-channel] Error:`, err);
      await interaction.editReply({ content: `❌ Error clearing messages: ${err.message}` });
    }
  },
};
