// Tiny synthesised sound effects, no audio files to download.
let ctx = null;
let enabled = true;

export function setSound(on) {
  enabled = on;
}

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, type = 'sine', gain = 0.2, slideTo = null) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

function noise(dur, gain, freq) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(t);
}

export function playEvent(e) {
  switch (e.type) {
    case 'kick':
      tone(160 + e.power * 80, 0.08, 'triangle', 0.25 + e.power * 0.2, 60);
      break;
    case 'whistle':
      tone(2600, 0.25, 'sine', 0.08);
      break;
    case 'end':
      tone(2600, 0.2, 'sine', 0.08);
      setTimeout(() => tone(2600, 0.2, 'sine', 0.08), 260);
      setTimeout(() => tone(2600, 0.6, 'sine', 0.08), 520);
      break;
    case 'goal':
      noise(1.8, 0.35, 900);
      break;
    case 'save':
    case 'post':
      tone(120, 0.12, 'square', 0.12, 70);
      noise(0.6, 0.12, 700);
      break;
    case 'tackle':
      tone(90, 0.06, 'square', 0.1);
      break;
    default:
      break;
  }
}
