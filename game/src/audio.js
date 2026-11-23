// Tiny synthesized sound effects via WebAudio — no audio files, no network.
// The context is created on the first user gesture, so autoplay rules never bite.
let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function blip(freq, dur, type = 'sine', gain = 0.08) {
  if (muted) return;
  const audio = ensureContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, audio.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  osc.connect(amp).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + dur);
}

export function playSound(kind) {
  if (kind === 'play') blip(520, 0.12, 'triangle', 0.09);
  else if (kind === 'resonance') { blip(660, 0.1, 'triangle', 0.09); window.setTimeout(() => blip(880, 0.16, 'triangle', 0.09), 90); }
  else if (kind === 'hurt') blip(160, 0.2, 'sawtooth', 0.06);
  else if (kind === 'win') { [523, 659, 784, 1046].forEach((f, i) => window.setTimeout(() => blip(f, 0.22, 'triangle', 0.09), i * 120)); }
  else if (kind === 'lose') { [392, 330, 262, 196].forEach((f, i) => window.setTimeout(() => blip(f, 0.25, 'sine', 0.08), i * 140)); }
  else if (kind === 'turn') blip(440, 0.08, 'sine', 0.05);
}
