const { Op } = require('sequelize');
const { ScheduleChannel, CalendarEvent } = require('../db/models');
const formatScheduleList = require('./scheduleFormatter');
const buildScheduleEmbed = require('./scheduleEmbedBuilder');

function getMountainOffset(date) {
  const year = date.getUTCFullYear();
  const dstStart = new Date(Date.UTC(year, 2, 8, 9)); // 2am MST -> 09:00 UTC
  while (dstStart.getUTCDay() !== 0) dstStart.setUTCDate(dstStart.getUTCDate() + 1);
  const dstEnd = new Date(Date.UTC(year, 10, 1, 8)); // 2am MDT -> 08:00 UTC
  while (dstEnd.getUTCDay() !== 0) dstEnd.setUTCDate(dstEnd.getUTCDate() + 1);
  const inDst = date >= dstStart && date < dstEnd;
  return (inDst ? -6 : -7) * 60 * 60 * 1000;
}

function getTimezoneOffset(zone, date = new Date()) {
  if (zone === 'America/Denver') {
    return -getMountainOffset(date);
  }
  const local = new Date(date.toLocaleString('en-US', { timeZone: zone }));
  return date.getTime() - local.getTime();
}

function parseDateInZone(dateStr, zone) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const offset = getTimezoneOffset(zone, utc);
  return new Date(utc.getTime() + offset);
}

function getMountainDayBounds(date = new Date()) {
  const offset = getTimezoneOffset('America/Denver', date);
  const local = new Date(date.getTime() - offset);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const startUtc = new Date(Date.UTC(y, m, d, 0, 0, 0) + offset);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startUtc, endUtc };
}

function isTodayMountain(date) {
  const offsetNow = getTimezoneOffset('America/Denver', new Date());
  const offsetDate = getTimezoneOffset('America/Denver', date);
  const localNow = new Date(Date.now() + offsetNow).toISOString().slice(0, 10);
  const localDate = new Date(date.getTime() + offsetDate).toISOString().slice(0, 10);
  return localNow === localDate;
}

async function postScheduleForToday(client, guildId) {
  const config = await ScheduleChannel.findOne({ where: { guildId } });
  if (!config) return;
  const channel = await client.channels.fetch(config.channelId).catch(() => null);
  if (!channel) return;

  const { startUtc, endUtc } = getMountainDayBounds();

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
    const { startUtc } = getMountainDayBounds(now);
    const fourAm = new Date(startUtc.getTime() + 4 * 60 * 60 * 1000);
    let nextUtc = fourAm;
    if (now >= fourAm) {
      nextUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000);
    }
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
