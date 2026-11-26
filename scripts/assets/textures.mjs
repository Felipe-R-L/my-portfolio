// Generated textures for the story's backgrounds, in the family of the
// topographic map (scripts/assets/topo.mjs): drawn here, no photo, no image
// bank. Each is an SVG rendered by Chrome and saved as webp at two widths.
//
//   node scripts/assets/textures.mjs   →  public/assets/story/bg-<name>-{2400,1200}.webp
//
// gears   IFSP, mechanical engineering: a technical drawing of meshed gears,
//         centre marks and dimension lines over a faint grid.
// pivots  OMD do Brasil, agriculture seen from above: centre-pivot circles and
//         fields of crop rows, like a satellite view, drawn in lines.
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";

const W = 2400;
const H = 1500;
const OUT = new URL("../../public/assets/story/", import.meta.url).pathname;
const LINE = "rgb(159 195 214 / %a)";
const line = (a) => LINE.replace("%a", a);

let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function gear(cx, cy, r, teeth, rot = 0) {
  // a gear outline: teeth as trapezoids on the pitch circle
  const pts = [];
  const add = 0.09 * r;
  for (let i = 0; i < teeth; i++) {
    const a = rot + (i / teeth) * Math.PI * 2;
    const w = (Math.PI * 2) / teeth;
    const p = (ang, rad) => pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
    p(a - w * 0.5, r - add);
    p(a - w * 0.28, r - add);
    p(a - w * 0.18, r + add);
    p(a + w * 0.18, r + add);
    p(a + w * 0.28, r - add);
  }
  const d = `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
  let s = `<path d="${d}" fill="none" stroke="${line(0.55)}" stroke-width="2"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.62).toFixed(1)}" fill="none" stroke="${line(0.28)}" stroke-width="1.2"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.16).toFixed(1)}" fill="none" stroke="${line(0.55)}" stroke-width="1.6"/>`;
  // pitch circle, dashed, and centre marks
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${line(0.22)}" stroke-width="1" stroke-dasharray="14 8 3 8"/>`;
  s += `<path d="M${cx - r * 1.25} ${cy}H${cx + r * 1.25}M${cx} ${cy - r * 1.25}V${cy + r * 1.25}" stroke="${line(0.22)}" stroke-width="1" stroke-dasharray="20 6 4 6"/>`;
  return s;
}

function gears() {
  let s = `<rect width="100%" height="100%" fill="#060a10"/>`;
  // a draughtsman's grid
  for (let x = 0; x <= W; x += 40) s += `<path d="M${x} 0V${H}" stroke="${line(x % 200 === 0 ? 0.08 : 0.035)}" stroke-width="1"/>`;
  for (let y = 0; y <= H; y += 40) s += `<path d="M0 ${y}H${W}" stroke="${line(y % 200 === 0 ? 0.08 : 0.035)}" stroke-width="1"/>`;
  // a train of meshed gears across the sheet
  const train = [
    [520, 620, 300, 24],
    [520 + 300 + 190, 620 + 120, 190, 15],
    [1010 + 190 + 120, 740 - 60, 120, 10],
    [1320 + 120 + 260, 680 + 230, 260, 21],
    [1960 + 0, 910 - 470, 190, 15],
  ];
  train.forEach(([cx, cy, r, t], i) => (s += gear(cx, cy, r, t, i * 0.13)));
  // dimension lines with ticks, like a drawing's annotations
  const dim = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}M${x1} ${y1 - 12}V${y1 + 12}M${x2} ${y2 - 12}V${y2 + 12}" stroke="${line(0.35)}" stroke-width="1.2"/>`;
  s += dim(220, 1080, 820, 1080) + dim(1440, 1260, 1960, 1260) + dim(1770, 200, 2150, 200);
  // a title block, bottom right
  s += `<rect x="1880" y="1330" width="460" height="120" fill="none" stroke="${line(0.35)}" stroke-width="1.4"/><path d="M1880 1370H2340M2110 1330V1450" stroke="${line(0.25)}" stroke-width="1"/>`;
  return s;
}

function pivots() {
  let s = `<rect width="100%" height="100%" fill="#060a09"/>`;
  const green = (a) => `rgb(150 196 160 / ${a})`;
  // fields of crop rows, each a rotated rectangle of parallel lines
  for (let k = 0; k < 14; k++) {
    const x = rand() * W, y = rand() * H, w = 260 + rand() * 420, h = 200 + rand() * 320, ang = (rand() - 0.5) * 50;
    let rows = "";
    for (let yy = 0; yy < h; yy += 9) rows += `M0 ${yy}H${w}`;
    s += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${ang.toFixed(1)})"><rect width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="none" stroke="${green(0.25)}" stroke-width="1.2"/><path d="${rows}" stroke="${green(0.1)}" stroke-width="1"/></g>`;
  }
  // centre-pivot circles: concentric rings, a radius arm, a dot at the centre
  const placed = [];
  for (let tries = 0; tries < 400 && placed.length < 16; tries++) {
    const r = 110 + rand() * 170, cx = r + rand() * (W - 2 * r), cy = r + rand() * (H - 2 * r);
    if (placed.some(([x, y, rr]) => Math.hypot(x - cx, y - cy) < r + rr + 24)) continue;
    placed.push([cx, cy, r]);
    s += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="rgb(150 196 160 / 0.04)" stroke="${green(0.45)}" stroke-width="1.6"/>`;
    for (let rr = r - 22; rr > 12; rr -= 22) s += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rr.toFixed(0)}" fill="none" stroke="${green(0.14)}" stroke-width="1"/>`;
    const a = rand() * Math.PI * 2;
    s += `<path d="M${cx.toFixed(0)} ${cy.toFixed(0)}L${(cx + Math.cos(a) * r).toFixed(0)} ${(cy + Math.sin(a) * r).toFixed(0)}" stroke="${line(0.55)}" stroke-width="1.6"/><circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="4" fill="${line(0.7)}"/>`;
  }
  // a couple of dirt roads
  s += `<path d="M0 ${H * 0.62} C ${W * 0.3} ${H * 0.55}, ${W * 0.55} ${H * 0.75}, ${W} ${H * 0.66}" fill="none" stroke="${line(0.22)}" stroke-width="3"/>`;
  s += `<path d="M${W * 0.42} 0 C ${W * 0.46} ${H * 0.4}, ${W * 0.38} ${H * 0.7}, ${W * 0.45} ${H}" fill="none" stroke="${line(0.18)}" stroke-width="2.5"/>`;
  return s;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: W, height: H } });
for (const [name, draw] of [["gears", gears], ["pivots", pivots]]) {
  await page.setContent(`<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${draw()}</svg></body></html>`);
  const png = `${OUT}bg-${name}.png`;
  await page.screenshot({ path: png });
  for (const w of [2400, 1200]) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", `scale=${w}:-2:flags=lanczos`, "-quality", "78", `${OUT}bg-${name}-${w}.webp`]);
  execFileSync("rm", [png]);
  console.log(name);
}
await browser.close();
