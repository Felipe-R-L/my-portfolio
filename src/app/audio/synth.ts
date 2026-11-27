/**
 * The small sounds of the page, made here instead of shipped as files: a
 * sheet of paper swiped, a card slid off a table, a camera's shutter, a
 * tick. Each is filtered noise and a few clicks under an envelope, rendered
 * once into a buffer when sound is turned on (a few milliseconds of work,
 * nothing to download, nothing to license).
 *
 * Pure: (sampleRate) -> samples, the same every time (seeded noise).
 */

export type Synth = "card" | "slide" | "frame" | "tick" | "woosh";

/** A repeatable noise source: the same sound on every visit. */
function noise(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s / 0xffffffff) * 2 - 1;
  };
}

/** RBJ band-pass (constant peak gain), its centre retuned per sample. */
function bandpass(rate: number) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x: number, freq: number, q: number) => {
    const w = (2 * Math.PI * Math.min(freq, rate * 0.45)) / rate;
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    const b0 = alpha / a0, b2 = -alpha / a0;
    const a1 = (-2 * Math.cos(w)) / a0, a2 = (1 - alpha) / a0;
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** A sheet moved past: a low, airy breath that swells and settles, no edge
    at all (the brighter takes read as scratchy). ~0.26 s */
function card(rate: number) {
  const n = Math.round(rate * 0.26);
  const out = new Float32Array(n);
  const r = noise(7);
  const bp = bandpass(rate);
  let a = 0, b = 0;
  // two one-pole low-passes (~900 Hz, then ~600 Hz): only the breath is left
  const ka = 1 - Math.exp((-2 * Math.PI * 900) / rate);
  const kb = 1 - Math.exp((-2 * Math.PI * 600) / rate);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * Math.pow(t, 0.7)) ** 2;
    const x = bp(r(), 700 + 400 * Math.sin(Math.PI * t), 0.5);
    a += (x - a) * ka;
    b += (a - b) * kb;
    out[i] = b * env;
  }
  return out;
}

/** A card slid across a table and picked up: lower, longer, a click at the end. ~0.34 s */
function slide(rate: number) {
  const n = Math.round(rate * 0.34);
  const out = new Float32Array(n);
  const r = noise(23);
  const bp = bandpass(rate);
  const click = Math.round(n * 0.84);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = smooth(Math.min(1, t / 0.35)) * smooth(Math.max(0, Math.min(1, (0.8 - t) / 0.3)));
    let v = bp(r(), 1900 - 700 * t, 1.3) * env * 1.5;
    const k = i - click;
    if (k >= 0 && k < rate * 0.006) v += r() * Math.exp(-k / (rate * 0.0012)) * 0.5;
    out[i] = v;
  }
  return out;
}

/** A shutter: the mirror up, a short whir, the curtain closing. ~0.15 s */
function frame(rate: number) {
  const n = Math.round(rate * 0.15);
  const out = new Float32Array(n);
  const r = noise(41);
  const ring = bandpass(rate), whir = bandpass(rate);
  const second = Math.round(rate * 0.085);
  for (let i = 0; i < n; i++) {
    const a = Math.exp(-i / (rate * 0.004));
    const b = i >= second ? Math.exp(-(i - second) / (rate * 0.005)) * 0.7 : 0;
    const mid = i > rate * 0.012 && i < second ? 0.12 * Math.sin((Math.PI * (i - rate * 0.012)) / (second - rate * 0.012)) : 0;
    const x = r();
    out[i] = ring(x * (a + b), 2300, 6) * 2.2 + x * (a + b) * 0.25 + whir(x, 3400, 2) * mid;
  }
  return out;
}

/** A tick: a soft wooden tap, the pitch falling as it dies. ~0.05 s */
function tick(rate: number) {
  const n = Math.round(rate * 0.05);
  const out = new Float32Array(n);
  const r = noise(53);
  const body = bandpass(rate);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    phase += (2 * Math.PI * (620 - 220 * Math.min(1, t / 0.03))) / rate;
    const tone = Math.sin(phase) * Math.exp(-t / 0.012);
    const knock = body(r(), 1100, 3) * Math.exp(-t / 0.003);
    out[i] = tone * 0.8 + knock * 0.6;
  }
  return out;
}

/** A woosh: air rushing past, its pitch rising and falling with the swell
    (the page flown through to a chapter). ~0.7 s */
function woosh(rate: number) {
  const n = Math.round(rate * 0.7);
  const out = new Float32Array(n);
  const r = noise(67);
  const bp = bandpass(rate);
  let a = 0;
  const k = 1 - Math.exp((-2 * Math.PI * 2400) / rate);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    // swells fast, dies slower, like something passing close by
    const env = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 2.2);
    const x = bp(r(), 260 + 1500 * Math.sin(Math.PI * Math.pow(t, 0.75)), 0.9);
    a += (x - a) * k;
    out[i] = a * env;
  }
  return out;
}

const MAKERS: Record<Synth, (rate: number) => Float32Array> = { card, slide, frame, tick, woosh };

/** The samples of `name` at `rate`, peak-normalised to 0.9. */
export function render(name: Synth, rate: number): Float32Array {
  const out = MAKERS[name](rate);
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < out.length; i++) out[i] *= 0.9 / peak;
  return out;
}

export const SYNTHS = Object.keys(MAKERS) as Synth[];
