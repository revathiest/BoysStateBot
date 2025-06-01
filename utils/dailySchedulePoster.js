const { Op } = require('sequelize');
const { ScheduleChannel, CalendarEvent } = require('../db/models');
const formatScheduleList = require('./scheduleFormatter');
const buildScheduleEmbed = require('./scheduleEmbedBuilder');

function getTimezoneOffset(zone, date = new Date()) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: zone }));
  return date.getTime() - local.getTime();
}

function isTodayMountain(date) {
  const offset = getTimezoneOffset('America/Denver');
  const nowMt = new Date(Date.now() - offset);
  const dateMt = new Date(date.getTime() - offset);
  return nowMt.getFullYear() === dateMt.getFullYear() &&
    nowMt.getMonth() === dateMt.getMonth() &&
    nowMt.getDate() === dateMt.getDate();
}

async function postScheduleForToday(client, guildId) {
  const config = await ScheduleChannel.findOne({ where: { guildId } });
  if (!config) return;
  const channel = await client.channels.fetch(config.channelId).catch(() => null);
  if (!channel) return;

  const offset = getTimezoneOffset('America/Denver');
  const nowMt = new Date(Date.now() - offset);
  const startUtc = new Date(Date.UTC(nowMt.getFullYear(), nowMt.getMonth(), nowMt.getDate(), 0, 0, 0));
  const endUtc = new Date(Date.UTC(nowMt.getFullYear(), nowMt.getMonth(), nowMt.getDate(), 23, 59, 59, 999));

  const events = await CalendarEvent.findAll({
    where: { guildId, startTime: { [Op.between]: [startUtc, endUtc] } },
    order: [['startTime', 'ASC']],
  });

  const description = events.length ? formatScheduleList(events) : 'No events scheduled for today.';
  const embed = buildScheduleEmbed("Today's Schedule", description, events.length ? 0x2ECC71 : 0xCCCCCC);

  if (config.messageId) {
    const message = await channel.messages.fetch(config.messageId).catch(() => null);
    if (message) {
      await message.edit({ embeds: [embed] });
      return;
    }
  }
  const sent = await channel.send({ embeds: [embed] });
  config.messageId = sent.id;
  await config.save();
}

function scheduleDailyTask(client) {
  async function scheduleNext() {
    const now = new Date();
    const offset = getTimezoneOffset('America/Denver', now);
    const mtNow = new Date(now.getTime() - offset);
    let mtNext = new Date(mtNow);
    mtNext.setHours(4, 0, 0, 0);
    if (mtNow >= mtNext) mtNext.setDate(mtNext.getDate() + 1);
    const nextUtc = new Date(mtNext.getTime() + offset);
    const delay = nextUtc.getTime() - now.getTime();
    setTimeout(async () => {
      const guilds = await ScheduleChannel.findAll();
      for (const cfg of guilds) {
        await postScheduleForToday(client, cfg.guildId);
      }
      scheduleNext();
    }, delay);
  }
  scheduleNext();
}

module.exports = { postScheduleForToday, scheduleDailyTask, isTodayMountain };
