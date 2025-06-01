const { google } = require('googleapis');
const driveAuth = require('../../utils/googleDrive');

module.exports = async function search(interaction) {
  const name = interaction.options.getString('name');
  await interaction.deferReply({ ephemeral: true });
  try {
    const auth = await driveAuth.getClient();
    const drive = google.drive({ version: 'v3', auth });
    const listRes = await drive.files.list({
      q: `name='${name.replace(/'/g, "\\'")}' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
    });
    const file = (listRes.data.files || [])[0];
    if (!file) {
      return interaction.editReply({ content: `❌ No file named **${name}** found.` });
    }
    const fileRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
    return interaction.editReply({
      content: `📂 Found **${file.name}**`,
      files: [{ attachment: Buffer.from(fileRes.data), name: file.name }],
    });
  } catch (err) {
    console.error('[drive:search] Error searching file:', err);
    return interaction.editReply({ content: '❌ Error searching Google Drive.' });
  }
};
