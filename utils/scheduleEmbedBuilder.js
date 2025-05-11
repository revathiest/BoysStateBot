const { EmbedBuilder } = require('discord.js');

module.exports = function buildScheduleEmbed(title, description, color = 0x2ECC71) {
  return new EmbedBuilder()
    .setTitle(`<:newmexicoflag:1371167532697784410> ${title}`)
    .setDescription(description)
    .setColor(color)
    .setFooter({ text: 'New Mexico Boys & Girls State' });
};
