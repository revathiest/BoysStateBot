const { downmixTo16kMono, pcmToWav, inputDurationSeconds } = require('../../../utils/transcription/audio');

function stereoFrames(samples) {
  const buf = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => buf.writeInt16LE(s, i * 2));
  return buf;
}

describe('audio helpers', () => {
  test('downmix averages channels and groups of 3 frames', () => {
    // 3 frames (L,R pairs) -> one mono sample: average of all six values
    const pcm = stereoFrames([100, 200, 300, 400, 500, 600]);
    const out = downmixTo16kMono(pcm);
    expect(out.length).toBe(2);
    expect(out.readInt16LE(0)).toBe(350);
  });

  test('downmix drops incomplete trailing group', () => {
    const pcm = stereoFrames([1, 1, 1, 1, 1, 1, 9, 9]);
    expect(downmixTo16kMono(pcm).length).toBe(2);
  });

  test('downmix of empty buffer is empty', () => {
    expect(downmixTo16kMono(Buffer.alloc(0)).length).toBe(0);
  });

  test('pcmToWav writes a valid header', () => {
    const pcm = Buffer.alloc(100);
    const wav = pcmToWav(pcm);
    expect(wav.length).toBe(144);
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt32LE(4)).toBe(136);
    expect(wav.readUInt32LE(24)).toBe(16000);
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.readUInt32LE(40)).toBe(100);
  });

  test('pcmToWav honours custom rate and channels', () => {
    const wav = pcmToWav(Buffer.alloc(4), 48000, 2);
    expect(wav.readUInt32LE(24)).toBe(48000);
    expect(wav.readUInt16LE(22)).toBe(2);
    expect(wav.readUInt32LE(28)).toBe(192000);
  });

  test('inputDurationSeconds', () => {
    expect(inputDurationSeconds(192000)).toBe(1);
    expect(inputDurationSeconds(0)).toBe(0);
  });
});
