const { google } = require('googleapis');
const driveAuth = require('../../utils/googleDrive');

module.exports = async function search(interaction) {
  const name = interaction.options.getString('name');
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
      return interaction.reply({ content: `❌ No file named **${name}** found.`, ephemeral: true });
    }
    const fileRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
    return interaction.reply({
      content: `📂 Found **${file.name}**`,
      files: [{ attachment: Buffer.from(fileRes.data), name: file.name }],
      ephemeral: true,
    });
  } catch (err) {
    console.error('[drive:search] Error searching file:', err);
    return interaction.reply({ content: '❌ Error searching Google Drive.', ephemeral: true });
  }
};
