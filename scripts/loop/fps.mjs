// Frame-rate along the whole homepage scroll, per section, on the real GPU.
// Usage: node scripts/loop/fps.mjs [url] [--out file.json]
//
// It wheels the page from top to bottom at a steady, human-ish rate (Lenis
// turns the wheel into smooth scroll, as for a visitor), records every
// requestAnimationFrame interval in the page, and buckets the intervals by the
// section under the middle of the viewport. Reported per section: mean fps,
// the 5th-percentile fps (the stutter a person notices) and the share of
// frames slower than 1/50 s.
import { writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--")) ?? "http://localhost:4173/";
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const out = opt("--out", null);
// CPU slowdown vs this machine. The default 4 stands in for an ordinary
// laptop: the GPU here is a desktop card, so the CPU side is what can be
// brought down to a common notebook's level.
const cpu = Number(opt("--cpu", "4"));

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  // Hardware GL: a software rasteriser would measure the CPU, not the page.
  args: ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--use-angle=gl"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
await page.waitForTimeout(2500);

const gpu = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl");
  const ext = gl?.getExtension("WEBGL_debug_renderer_info");
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown";
});

await page.evaluate(() => {
  const w = window;
  w.__frames = [];
  const sections = () =>
    [...document.querySelectorAll("main section, [data-chapter]")].filter((el) => !el.parentElement.closest("main section")).map((el) => {
      // a pinned section's scroll range is its pin spacer's
      const r = (el.closest(".pin-spacer") ?? el).getBoundingClientRect();
      return { name: el.dataset.chapter || el.id || el.className.split(" ")[0] || el.tagName, top: r.top + scrollY, bottom: r.bottom + scrollY };
    });
  w.__sections = sections();
  let last = performance.now();
  const tick = (t) => {
    const mid = scrollY + innerHeight / 2;
    const s = w.__sections.find((x) => mid >= x.top && mid < x.bottom);
    w.__frames.push([t - last, s ? s.name : "?"]);
    last = t;
    if (!w.__stop) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
let y = 0;
while (y < total) {
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(80); // ~1500 px/s of wheel input, a brisk read
  y = await page.evaluate(() => scrollY);
  if (y >= total - 2) break;
}
await page.waitForTimeout(800);
const frames = await page.evaluate(() => {
  window.__stop = true;
  return window.__frames;
});
await browser.close();

const by = new Map();
for (const [dt, name] of frames.slice(1)) {
  if (!by.has(name)) by.set(name, []);
  by.get(name).push(dt);
}
const report = { url, gpu, cpu_throttle: cpu, sections: {} };
for (const [name, dts] of by) {
  const sorted = [...dts].sort((a, b) => a - b);
  const mean = dts.reduce((a, b) => a + b, 0) / dts.length;
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  report.sections[name] = {
    frames: dts.length,
    fps_mean: +(1000 / mean).toFixed(1),
    fps_p5: +(1000 / p95).toFixed(1),
    slow_share: +(dts.filter((d) => d > 20).length / dts.length).toFixed(3),
  };
}
console.log(JSON.stringify(report, null, 2));
if (out) writeFileSync(out, JSON.stringify(report, null, 2));
