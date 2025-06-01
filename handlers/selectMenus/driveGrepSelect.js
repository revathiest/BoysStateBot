const { google } = require('googleapis');
const driveAuth = require('../../utils/googleDrive');

module.exports = async function driveGrepSelect(interaction) {
  const parts = interaction.customId.split('_');
  const action = parts.slice(0, -1).join('_');
  const userId = parts.at(-1);

  if (action !== 'drive_grep_select') return;

  if (interaction.user.id !== userId) {
    return interaction.reply({ content: 'This select menu wasn\'t meant for you.', ephemeral: true });
  }

  const fileId = interaction.values[0];
  await interaction.deferReply({ ephemeral: true });

  try {
    const auth = await driveAuth.getClient();
    const drive = google.drive({ version: 'v3', auth });
    const metaRes = await drive.files.get({ fileId, fields: 'name' });
    const dataRes = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    await interaction.editReply({
      content: `📥 Downloading **${metaRes.data.name}**`,
      files: [{ attachment: Buffer.from(dataRes.data), name: metaRes.data.name }],
    });
  } catch (err) {
    console.error('[drive:grep_select] Error downloading file:', err);
    await interaction.editReply({ content: '❌ Error downloading file.' });
  }
};
