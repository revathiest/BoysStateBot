// --- __tests__/utils/scheduleEmbedBuilder.test.js ---
const buildScheduleEmbed = require('../../utils/scheduleEmbedBuilder');

describe('buildScheduleEmbed', () => {
  it('builds an embed with title and description', () => {
    const embed = buildScheduleEmbed('Test Title', 'Test Body', 0x123456);
    expect(embed.data.title).toBe('<:newmexicoflag:1371167532697784410> Test Title');
    expect(embed.data.description).toBe('Test Body');
    expect(embed.data.color).toBe(0x123456);
  });
});
