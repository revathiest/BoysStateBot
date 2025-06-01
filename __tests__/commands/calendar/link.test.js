jest.mock('../../../db/models', () => {
  const findOne = jest.fn();
  return { CalendarConfig: { findOne }, __esModule: true, __mock: { findOne } };
});

jest.mock('discord.js', () => ({
  EmbedBuilder: class {
    constructor(){this.data={};}
    setTitle(t){this.data.title=t;return this;}
    setDescription(d){this.data.description=d;return this;}
    setColor(c){this.data.color=c;return this;}
    setFooter(){return this;}
    setTimestamp(){return this;}
  }
}));

const { CalendarConfig, __mock } = require('../../../db/models');
const findOne = CalendarConfig.findOne;
const link = require('../../../commands/calendar/link');

describe('calendar link', () => {
  beforeEach(() => jest.clearAllMocks());

  test('replies when config missing', async () => {
    findOne.mockResolvedValue(null);
    const reply = jest.fn();
    await link({ reply }, 'g');
    expect(reply).toHaveBeenCalled();
  });

  test('sends embed when config exists', async () => {
    findOne.mockResolvedValue({ calendarId: 'id', startDate: '2023-08-20' });
    const reply = jest.fn();
    await link({ reply }, 'g');
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({ embeds: [expect.any(Object)] }));
  });
});
