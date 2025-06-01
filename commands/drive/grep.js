const { google } = require('googleapis');
const driveAuth = require('../../utils/googleDrive');

module.exports = async function grep(interaction) {
  const query = interaction.options.getString('query');
  await interaction.deferReply({ ephemeral: true });
  try {
    const auth = await driveAuth.getClient();
    const drive = google.drive({ version: 'v3', auth });

    const files = [];
    let pageToken;
    do {
      const listRes = await drive.files.list({
        q: `fullText contains '${query.replace(/'/g, "\\'")}' and trashed=false`,
        fields: 'nextPageToken, files(id, name)',
        pageSize: 10,
        pageToken,
      });
      files.push(...(listRes.data.files || []));
      pageToken = listRes.data.nextPageToken;
    } while (pageToken && files.length < 20);
    if (!files.length) {
      return interaction.editReply({ content: `❌ No files contain **${query}**.` });
    }
    const list = files
      .map(f => `• [${f.name}](https://drive.google.com/uc?id=${f.id}&export=download)`) 
      .join('\n');
    return interaction.editReply({ content: `📄 Files containing **${query}**:\n${list}` });
  } catch (err) {
    console.error('[drive:grep] Error searching contents:', err);
    return interaction.editReply({ content: '❌ Error searching Google Drive.' });
  }
};
