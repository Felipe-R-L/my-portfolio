// Generated textures for the story's backgrounds, in the family of the
// topographic map (scripts/assets/topo.mjs): drawn here, no photo, no image
// bank. Each is an SVG rendered by Chrome and saved as webp at two widths.
//
//   node scripts/assets/textures.mjs   →  public/assets/story/bg-<name>-{2400,1200}.webp
//
// (IFSP's background is his own notebook sketch, not generated: the gears
// that stood there were replaced on 2026-11-26.)
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
for (const [name, draw] of [["pivots", pivots]]) {
  await page.setContent(`<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${draw()}</svg></body></html>`);
  const png = `${OUT}bg-${name}.png`;
  await page.screenshot({ path: png });
  for (const w of [2400, 1200]) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", `scale=${w}:-2:flags=lanczos`, "-quality", "78", `${OUT}bg-${name}-${w}.webp`]);
  execFileSync("rm", [png]);
  console.log(name);
}
await browser.close();
