// utils/transcription/formatter.js

function pad(n) {
  return String(n).padStart(2, '0');
}

function clock(date) {
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

/**
 * Render a transcript as plain text (timestamps in UTC).
 * @param {Array<{spokeAt: Date, speaker: string, text: string}>} entries
 * @param {object} meta
 * @param {string} meta.channelName
 * @param {Date} meta.startedAt
 * @param {Date} meta.endedAt
 * @returns {string}
 */
function formatTranscript(entries, meta) {
  const sorted = [...entries].sort((a, b) => a.spokeAt - b.spokeAt);
  const lines = [
    `Transcript of #${meta.channelName}`,
    `Started: ${meta.startedAt.toISOString()}`,
    `Ended:   ${meta.endedAt.toISOString()}`,
    `Entries: ${sorted.length}`,
    '',
  ];
  if (sorted.length === 0) {
    lines.push('(No speech was transcribed.)');
  } else {
    sorted.forEach(e => lines.push(`[${clock(e.spokeAt)}] ${e.speaker}: ${e.text}`));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Build a filesystem-safe transcript file name.
 * @param {string} channelName
 * @param {Date} startedAt
 * @returns {string}
 */
function transcriptFileName(channelName, startedAt) {
  const safe = String(channelName).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'voice';
  const stamp = startedAt.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `transcript-${safe}-${stamp}.txt`;
}

module.exports = { formatTranscript, transcriptFileName };
