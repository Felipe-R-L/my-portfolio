// Como funciona's scenery: a topographic map, generated (no photo, no image
// bank). Contour lines of a smooth noise field, traced with marching squares,
// drawn as an SVG and rendered by Chrome to a webp the ambient light pans.
//
//   node scripts/assets/topo.mjs   →  public/assets/plano/topo-2400.webp, topo-1200.webp
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";

const W = 2400;
const H = 1500;
const CELL = 6;
const OUT = new URL("../../public/assets/plano/", import.meta.url).pathname;

// seeded value noise, a few octaves
let seed = 20261126;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const G = 64;
const grid = Array.from({ length: (G + 1) * (G + 1) }, rand);
const lerp = (a, b, t) => a + (b - a) * t;
const fade = (t) => t * t * (3 - 2 * t);
function noise(x, y) {
  const xi = Math.floor(x) % G, yi = Math.floor(y) % G;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const g = (i, j) => grid[((yi + j) % G) * (G + 1) + ((xi + i) % G)];
  const u = fade(xf), v = fade(yf);
  return lerp(lerp(g(0, 0), g(1, 0), u), lerp(g(0, 1), g(1, 1), u), v);
}
const field = (x, y) => {
  let s = 0, a = 1, f = 1 / 520, n = 0;
  for (let o = 0; o < 4; o++) {
    s += a * noise(x * f + 11.3 * o, y * f + 7.1 * o);
    n += a;
    a *= 0.5;
    f *= 2.1;
  }
  return s / n;
};

const cols = Math.ceil(W / CELL) + 1;
const rows = Math.ceil(H / CELL) + 1;
const v = new Float32Array(cols * rows);
for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = field(i * CELL, j * CELL);

// marching squares → segments per level
function contour(level) {
  const segs = [];
  const at = (i, j) => v[j * cols + i];
  const interp = (x1, y1, a, x2, y2, b) => {
    const t = (level - a) / (b - a || 1e-9);
    return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  };
  for (let j = 0; j < rows - 1; j++)
    for (let i = 0; i < cols - 1; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      const x = i * CELL, y = j * CELL;
      const idx = (a > level) | ((b > level) << 1) | ((c > level) << 2) | ((d > level) << 3);
      if (idx === 0 || idx === 15) continue;
      const T = () => interp(x, y, a, x + CELL, y, b);
      const R = () => interp(x + CELL, y, b, x + CELL, y + CELL, c);
      const B = () => interp(x, y + CELL, d, x + CELL, y + CELL, c);
      const L = () => interp(x, y, a, x, y + CELL, d);
      const table = { 1: [[L, T]], 2: [[T, R]], 3: [[L, R]], 4: [[R, B]], 5: [[L, T], [R, B]], 6: [[T, B]], 7: [[L, B]],
        8: [[B, L]], 9: [[B, T]], 10: [[T, R], [B, L]], 11: [[B, R]], 12: [[R, L]], 13: [[R, T]], 14: [[T, L]] };
      for (const [p, q] of table[idx]) segs.push([p(), q()]);
    }
  return segs;
}

const levels = 26;
let paths = "";
for (let k = 1; k < levels; k++) {
  const level = 0.22 + (k / levels) * 0.56;
  const major = k % 5 === 0;
  const d = contour(level).map(([[x1, y1], [x2, y2]]) => `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`).join("");
  paths += `<path d="${d}" stroke="rgb(159 195 214 / ${major ? 0.5 : 0.22})" stroke-width="${major ? 1.6 : 1}" fill="none"/>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#06080b"/>${paths}</svg>`;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
const png = `${OUT}topo.png`;
await page.screenshot({ path: png });
await browser.close();
for (const w of [2400, 1200]) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", `scale=${w}:-2:flags=lanczos`, "-quality", "78", `${OUT}topo-${w}.webp`]);
execFileSync("rm", [png]);
console.log("topo written");
