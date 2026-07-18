import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = join(__dir, '..', 'public', 'audio');
mkdirSync(OUT, { recursive: true });

const SR = 44100;

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);   // PCM
  buf.writeUInt16LE(1, 22);   // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  return buf;
}

const sin = (f, t) => Math.sin(2 * Math.PI * f * t);

// ── move: soft wooden tap ──────────────────────────────────────────────────
function move() {
  const n = Math.round(SR * 0.14);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    s[i] = Math.exp(-t * 28) * (sin(900, t) * 0.5 + sin(1400, t) * 0.25);
  }
  return s;
}

// ── place: soft thud with pitch drop ──────────────────────────────────────
function place() {
  const n = Math.round(SR * 0.2);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 18);
    const freq = 520 * Math.exp(-t * 14);
    s[i] = env * sin(freq, t) * 0.75;
  }
  return s;
}

// ── capture: sharp pounce — impact burst + low thump ──────────────────────
function capture() {
  const n = Math.round(SR * 0.35);
  const s = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 18) * 0.35;
    const thump = sin(80, t)  * Math.exp(-t * 9)  * 0.55;
    const crack = sin(440, t) * Math.exp(-t * 30) * 0.45;
    s[i] = noise + thump + crack;
    phase++;
  }
  return s;
}

// ── win: ascending pentatonic fanfare ─────────────────────────────────────
function win() {
  const dur = 2.2;
  const n   = Math.round(SR * dur);
  const s   = new Float32Array(n);
  const notes = [262, 330, 392, 524, 660, 784, 1048]; // C E G C E G C
  notes.forEach((freq, idx) => {
    const t0  = idx * 0.2;
    const len = 0.55;
    for (let i = Math.round(t0 * SR); i < Math.min(n, Math.round((t0 + len) * SR)); i++) {
      const t   = i / SR - t0;
      const env = Math.exp(-t * 3.5);
      s[i] += (sin(freq, t) * 0.38 + sin(freq * 2, t) * 0.12) * env;
    }
  });
  return s;
}

// ── bgm: ambient drone + slow pentatonic melody, loops seamlessly ──────────
function bgm() {
  const dur = 10;
  const n   = Math.round(SR * dur);
  const s   = new Float32Array(n);

  // Drone: A2 E3 A3 with slow tremolo
  const drones = [110, 165, 220, 330];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const trem = 0.72 + 0.28 * sin(0.18, t);
    drones.forEach(f => { s[i] += sin(f, t) * 0.085 * trem; });
  }

  // Melody: slow pentatonic phrases (A minor pent)
  const melody = [
    [220, 0.0], [247, 0.7], [294, 1.4], [330, 2.1], [294, 2.8],
    [247, 3.5], [220, 4.2], [165, 4.9], [185, 5.6], [220, 6.3],
    [247, 7.0], [220, 7.7], [185, 8.4], [165, 9.1],
  ];
  melody.forEach(([freq, t0]) => {
    const notLen = 0.6;
    const end    = Math.min(n, Math.round((t0 + notLen) * SR));
    for (let i = Math.round(t0 * SR); i < end; i++) {
      const t   = i / SR - t0;
      // fade out last note to allow seamless loop
      const fadeOut = t0 + notLen > dur - 0.5 ? Math.max(0, 1 - (t0 + t - (dur - 0.5)) / 0.5) : 1;
      const env = Math.exp(-t * 2.5) * fadeOut;
      s[i] += sin(freq, t) * env * 0.14;
    }
  });

  return s;
}

const files = { move, place, capture, win, bgm };
for (const [name, fn] of Object.entries(files)) {
  const path = join(OUT, `${name}.wav`);
  writeFileSync(path, wav(fn()));
  console.log(`  wrote ${name}.wav`);
}
console.log('Done — files in public/audio/');
