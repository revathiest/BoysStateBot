const { Op } = require('sequelize');
const { ScheduleChannel, CalendarEvent } = require('../db/models');
const formatScheduleList = require('./scheduleFormatter');
const buildScheduleEmbed = require('./scheduleEmbedBuilder');

function getTimezoneOffset(zone, date = new Date()) {
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
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dayStr = formatter.format(date);
  const startUtc = parseDateInZone(dayStr, 'America/Denver');
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startUtc, endUtc };
}

function isTodayMountain(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  return fmt.format(date) === fmt.format(new Date());
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
