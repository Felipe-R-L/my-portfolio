// Screenshots every scene position in scenes.json, desktop (d-), phone (m-)
// and reduced motion (r-). Usage: node scripts/loop/shoot.mjs <outDir> [url]
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "/home/felipe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs";

const out = process.argv[2];
const url = process.argv[3] ?? "http://localhost:5199/";
if (!out) throw new Error("usage: shoot.mjs <outDir> [url]");
mkdirSync(out, { recursive: true });
const scenes = JSON.parse(readFileSync(new URL("./scenes.json", import.meta.url)));

const runs = [
  { prefix: "d", viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" },
  { prefix: "m", viewport: { width: 390, height: 844 }, reducedMotion: "no-preference", isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { prefix: "r", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" },
];

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (const run of runs) {
  const ctx = await browser.newContext({ viewport: run.viewport, reducedMotion: run.reducedMotion, isMobile: run.isMobile, hasTouch: run.hasTouch, deviceScaleFactor: run.deviceScaleFactor ?? 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error(`[${run.prefix}] pageerror:`, e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  // the nav arrives 1.5 s after load (0.8 s entrance); shoot once it has
  await page.waitForTimeout(2800);
  for (const s of scenes) {
    const y = await page.evaluate(({ sel, p, hero, story }) => {
      const vh = window.innerHeight;
      const phone = window.matchMedia("(max-width: 767px)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const city = document.querySelector(".city");
      const cityTop = city ? city.getBoundingClientRect().top + window.scrollY : 0;
      // Mirrors HeroCity: TRACK_DESKTOP 3.4 / TRACK_PHONE 3.15, STORY_TRACK 2.8.
      const heroLen = (phone ? 3.15 : 3.4) * vh;
      if (hero !== undefined) return Math.round(cityTop + hero * heroLen);
      if (story !== undefined) {
        if (!phone && !reduced) return Math.round(cityTop + heroLen + story * 2.8 * vh);
        const list = document.querySelector(".story-list");
        if (!list) return null;
        const r = list.getBoundingClientRect();
        return Math.round(r.top + window.scrollY + story * Math.max(0, r.height - vh));
      }
      if (sel === "body") {
        const max = document.scrollingElement.scrollHeight - window.innerHeight;
        return Math.round(p * max);
      }
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const travel = Math.max(0, r.height - window.innerHeight);
      return Math.round(top + p * travel);
    }, s);
    if (y === null) { console.error(`[${run.prefix}] missing target for ${s.name}`); continue; }
    await page.evaluate((y) => window.scrollTo(0, y), y);
    // Lenis smooths wheel input only; a programmatic jump lands at once. Give
    // ScrollTrigger and the scrubs time to settle.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${run.prefix}-${s.name}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log(`shots in ${out}`);
