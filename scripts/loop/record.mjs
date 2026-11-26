// Records the whole homepage scroll, top to bottom, as an mp4.
// Usage: node scripts/loop/record.mjs <out.mp4> [--phone] [--reduced] [url]
//
// Frames come from the DevTools screencast (Page.startScreencast), each with
// its own timestamp, and ffmpeg places them on the timeline at those times, so
// the video plays at the speed the page actually ran. The scroll is a steady
// wheel on desktop (Lenis smooths it, as for a visitor) and a steady native
// scroll on the phone.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const out = args[0];
if (!out || out.startsWith("--")) throw new Error("usage: record.mjs <out.mp4> [--phone] [--reduced] [url]");
const phone = args.includes("--phone");
const reduced = args.includes("--reduced");
const url = args.slice(1).find((a) => !a.startsWith("--")) ?? "http://localhost:5199/";

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--use-angle=gl"],
});
const viewport = phone ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const ctx = await browser.newContext({
  viewport,
  reducedMotion: reduced ? "reduce" : "no-preference",
  ...(phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2800); // the nav arrives 1.5 s after load

const dir = mkdtempSync(join(tmpdir(), "rec-"));
const frames = [];
const cdp = await ctx.newCDPSession(page);
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const file = join(dir, `${String(frames.length).padStart(6, "0")}.jpg`);
  writeFileSync(file, Buffer.from(data, "base64"));
  frames.push({ file, t: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", {
  format: "jpeg",
  quality: 70,
  maxWidth: viewport.width,
  maxHeight: viewport.height,
});

const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
let y = 0;
const t0 = Date.now();
while (y < total - 2 && Date.now() - t0 < 240_000) {
  if (phone) await page.evaluate(() => window.scrollBy(0, 28));
  else await page.mouse.wheel(0, 100);
  await page.waitForTimeout(phone ? 33 : 60);
  y = await page.evaluate(() => scrollY);
}
await page.waitForTimeout(1500);
await cdp.send("Page.stopScreencast");
await browser.close();

// ffmpeg concat list: each frame lasts until the next one arrived.
const list = frames
  .map((f, i) => {
    const next = frames[i + 1]?.t ?? f.t + 1 / 30;
    return `file '${f.file}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}`;
  })
  .join("\n");
writeFileSync(join(dir, "list.txt"), `${list}\nfile '${frames.at(-1).file}'\n`);
execFileSync("ffmpeg", [
  "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"),
  "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "26", out,
]);
rmSync(dir, { recursive: true, force: true });
const secs = frames.length ? (frames.at(-1).t - frames[0].t).toFixed(1) : 0;
console.log(`${out}: ${frames.length} frames over ${secs}s`);
