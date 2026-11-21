// utils/transcription/audio.js
// PCM helpers: Discord voice gives 48kHz 16-bit stereo; Whisper needs far less.

const INPUT_RATE = 48000;
const INPUT_CHANNELS = 2;
const OUTPUT_RATE = 16000;
const DECIMATION = INPUT_RATE / OUTPUT_RATE; // 3

/**
 * Convert 48kHz 16-bit stereo PCM to 16kHz 16-bit mono PCM.
 * Averages both channels and each group of 3 frames (a cheap low-pass).
 * @param {Buffer} pcm - Little-endian 16-bit interleaved stereo PCM at 48kHz.
 * @returns {Buffer} 16kHz mono PCM.
 */
function downmixTo16kMono(pcm) {
  const frameBytes = 2 * INPUT_CHANNELS;
  const groupBytes = frameBytes * DECIMATION;
  const groups = Math.floor(pcm.length / groupBytes);
  const out = Buffer.alloc(groups * 2);
  for (let g = 0; g < groups; g += 1) {
    let sum = 0;
    for (let i = 0; i < DECIMATION * INPUT_CHANNELS; i += 1) {
      sum += pcm.readInt16LE(g * groupBytes + i * 2);
    }
    out.writeInt16LE(Math.round(sum / (DECIMATION * INPUT_CHANNELS)), g * 2);
  }
  return out;
}

/**
 * Wrap raw 16-bit PCM in a WAV container.
 * @param {Buffer} pcm - Raw PCM samples.
 * @param {number} [sampleRate=16000]
 * @param {number} [channels=1]
 * @returns {Buffer} WAV file contents.
 */
function pcmToWav(pcm, sampleRate = OUTPUT_RATE, channels = 1) {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * 2;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(channels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Duration in seconds of 48kHz 16-bit stereo PCM.
 * @param {number} byteLength
 * @returns {number}
 */
function inputDurationSeconds(byteLength) {
  return byteLength / (INPUT_RATE * INPUT_CHANNELS * 2);
}

module.exports = {
  INPUT_RATE,
  INPUT_CHANNELS,
  OUTPUT_RATE,
  downmixTo16kMono,
  pcmToWav,
  inputDurationSeconds,
};
