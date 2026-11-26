// Hoje's card: the three systems he looks after outside OMD, as they really
// are (the stills of the recorded takes), set side by side in perspective.
// No invented screen: each one is a poster of public/assets/projects/video.
//
//   node scripts/assets/today.mjs  →  public/assets/story/hoje-{720,1440}.webp
import { readFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";

const ROOT = new URL("../../public/assets/", import.meta.url).pathname;
const shot = (name) => `data:image/webp;base64,${readFileSync(`${ROOT}projects/video/${name}-poster.webp`).toString("base64")}`;
const W = 1110;
const H = 740;

const html = `<html><body style="margin:0;background:#07090c">
<div style="position:relative;width:${W}px;height:${H}px;overflow:hidden;perspective:1800px;
  background:radial-gradient(ellipse at 50% 45%, rgb(159 195 214 / 0.16), transparent 65%), #07090c">
  ${[
    ["secret-detail", -330, 20, 0.44, 20, 1],
    ["dallas-motel-detail", 330, 20, 0.44, -20, 1],
    ["dallas-sync-card", 0, 10, 0.58, 0, 2],
  ]
    .map(
      ([n, x, y, s, ry, z]) => `<img src="${shot(n)}" style="position:absolute;left:50%;top:50%;width:1440px;height:900px;
      transform:translate(-50%,-50%) translate(${x}px,${y}px) rotateY(${ry}deg) scale(${s});z-index:${z};
      border-radius:14px;box-shadow:0 30px 80px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(159 195 214 / 0.25)">`,
    )
    .join("")}
</div></body></html>`;

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(html, { waitUntil: "load" });
const png = `${ROOT}story/hoje.png`;
await page.screenshot({ path: png });
await browser.close();
for (const w of [1440, 720]) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", `scale=${w}:-2:flags=lanczos`, "-quality", "80", `${ROOT}story/hoje-${w}.webp`]);
unlinkSync(png);
console.log("hoje written");
