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
    const metaRes = await drive.files.get({ fileId, fields: 'name,mimeType' });
    let fileData;
    let fileName = metaRes.data.name;

    if (metaRes.data.mimeType.startsWith('application/vnd.google-apps')) {
      const exportRes = await drive.files.export(
        { fileId, mimeType: 'application/pdf' },
        { responseType: 'arraybuffer' },
      );
      fileData = exportRes.data;
      if (!fileName.endsWith('.pdf')) fileName += '.pdf';
    } else {
      const dataRes = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' },
      );
      fileData = dataRes.data;
    }

    await interaction.editReply({
      content: `📥 Downloading **${fileName}**`,
      files: [{ attachment: Buffer.from(fileData), name: fileName }],
    });
  } catch (err) {
    console.error('[drive:grep_select] Error downloading file:', err);
    await interaction.editReply({ content: '❌ Error downloading file.' });
  }
};
