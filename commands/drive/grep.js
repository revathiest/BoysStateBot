const { google } = require('googleapis');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
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

    const unique = [];
    const seen = new Set();
    for (const file of files) {
      if (!seen.has(file.id)) {
        unique.push(file);
        seen.add(file.id);
      }
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`drive_grep_select_${interaction.user.id}`)
      .setPlaceholder('Select a file to download')
      .addOptions(unique.map(f => ({ label: f.name, value: f.id })));

    const row = new ActionRowBuilder().addComponents(menu);

    return interaction.editReply({
      content: `📄 Select a file containing **${query}**:`,
      components: [row],
    });
  } catch (err) {
    console.error('[drive:grep] Error searching contents:', err);
    return interaction.editReply({ content: '❌ Error searching Google Drive.' });
  }
};
