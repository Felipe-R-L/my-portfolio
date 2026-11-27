/**
 * The small sounds of the page, made here instead of shipped as files: a
 * sheet of paper swiped, a card slid off a table, a camera's shutter, a
 * tick. Each is filtered noise and a few clicks under an envelope, rendered
 * once into a buffer when sound is turned on (a few milliseconds of work,
 * nothing to download, nothing to license).
 *
 * Pure: (sampleRate) -> samples, the same every time (seeded noise).
 */

export type Synth = "card" | "slide" | "frame" | "tick";

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

/** Paper swiped across paper: bright, breathy, a little grain. ~0.22 s */
function card(rate: number) {
  const n = Math.round(rate * 0.22);
  const out = new Float32Array(n);
  const r = noise(7), grain = noise(19);
  const bp = bandpass(rate);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = smooth(Math.min(1, t / 0.18)) * Math.pow(1 - t, 1.6);
    // the fibres catch now and then
    const g = 1 + (grain() > 0.92 ? 0.8 : 0);
    out[i] = bp(r(), 2600 + 2400 * t, 0.9) * env * g * 1.4;
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

/** A tick: a short, dull knock. ~0.03 s */
function tick(rate: number) {
  const n = Math.round(rate * 0.03);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.sin((2 * Math.PI * 1800 * i) / rate) * Math.exp(-i / (rate * 0.004)) * 0.6;
  return out;
}

const MAKERS: Record<Synth, (rate: number) => Float32Array> = { card, slide, frame, tick };

/** The samples of `name` at `rate`, peak-normalised to 0.9. */
export function render(name: Synth, rate: number): Float32Array {
  const out = MAKERS[name](rate);
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < out.length; i++) out[i] *= 0.9 / peak;
  return out;
}

export const SYNTHS = Object.keys(MAKERS) as Synth[];
