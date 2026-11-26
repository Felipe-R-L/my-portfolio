// The recording studio for the project videos (Work, Em uso, the cases).
//
// A take is a real browser session driven like a person: the mouse travels
// on a curve and eases into its target, typing has a human rhythm, scrolling
// comes in wheel bursts. Every random choice comes from a seeded generator,
// so a take is the same every time it is recorded. The frames come from the
// DevTools screencast with their own timestamps, and ffmpeg lays them on the
// timeline at those times, so the video plays at the speed the page ran.
//
// No data of a real customer goes into a take: Dallas Sync is recorded in
// its demonstration organization (fictitious, the platform's training org),
// and the shop only up to the payment step.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";

/** 16:10, the frame of the journey. */
export const VIEWPORT = { width: 1440, height: 900 };

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A cursor drawn in the page: the screencast does not show the system one.
const CURSOR = `(() => {
  const draw = () => {
    if (document.getElementById("__cap-cursor")) return;
    const c = document.createElement("div");
    c.id = "__cap-cursor";
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l15 8.2-6.6 1.6L8 18.5z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none",
      transform: "translate(-100px,-100px)", transition: "scale .12s", filter: "drop-shadow(0 1px 2px rgb(0 0 0 / .35))" });
    document.documentElement.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.transform = "translate(" + (e.clientX - 3) + "px," + (e.clientY - 2) + "px)"; }, true);
    addEventListener("mousedown", () => { c.style.scale = ".82"; }, true);
    addEventListener("mouseup", () => { c.style.scale = "1"; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", draw); else draw();
})();`;

export async function open({ seed = 1, viewport = VIEWPORT, scale = 2, cursor = true, storageState } = {}) {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--use-angle=gl", "--hide-scrollbars"],
  });
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale, locale: "pt-BR", timezoneId: "America/Sao_Paulo", storageState });
  if (cursor) await context.addInitScript(CURSOR);
  const page = await context.newPage();
  const random = rng(seed);
  const at = { x: viewport.width * 0.62, y: viewport.height * 0.7 };

  const human = {
    random,
    wait: (ms, spread = 0.25) => page.waitForTimeout(Math.round(ms * (1 - spread + 2 * spread * random()))),
    /** Travel to (x, y) on a curve, easing in and out, with a small overshoot-free wobble. */
    async move(x, y) {
      const dx = x - at.x;
      const dy = y - at.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(12, Math.round(dist / 14));
      // control points off the straight line, to one side
      const side = (random() - 0.5) * 0.35 * dist;
      const nx = -dy / (dist || 1);
      const ny = dx / (dist || 1);
      const c1 = { x: at.x + dx * 0.3 + nx * side, y: at.y + dy * 0.3 + ny * side };
      const c2 = { x: at.x + dx * 0.75 + nx * side * 0.4, y: at.y + dy * 0.75 + ny * side * 0.4 };
      const from = { ...at };
      for (let i = 1; i <= steps; i++) {
        const u = i / steps;
        const t = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
        const m = 1 - t;
        const px = m * m * m * from.x + 3 * m * m * t * c1.x + 3 * m * t * t * c2.x + t * t * t * x;
        const py = m * m * m * from.y + 3 * m * m * t * c1.y + 3 * m * t * t * c2.y + t * t * t * y;
        await page.mouse.move(px, py);
        await page.waitForTimeout(9 + Math.round(random() * 6));
      }
      at.x = x;
      at.y = y;
    },
    /** Move to an element (somewhere near its middle), rest a beat, click. */
    async click(locator, { rest = 260 } = {}) {
      await locator.scrollIntoViewIfNeeded();
      const b = await locator.boundingBox();
      if (!b) throw new Error(`no box for ${locator}`);
      await human.move(b.x + b.width * (0.42 + random() * 0.16), b.y + b.height * (0.4 + random() * 0.2));
      await human.wait(rest);
      await page.mouse.down();
      await page.waitForTimeout(70 + Math.round(random() * 40));
      await page.mouse.up();
    },
    async type(text, { cps = 9 } = {}) {
      for (const ch of text) {
        await page.keyboard.type(ch);
        await page.waitForTimeout(Math.round((1000 / cps) * (0.6 + random() * 0.9)));
      }
    },
    /** A slow, eased glide of the page by `dy` pixels over `seconds` (a card's loop). */
    async glide(dy, seconds) {
      await page.evaluate(
        ([dy, ms]) =>
          new Promise((done) => {
            const from = scrollY;
            const t0 = performance.now();
            const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
            const step = (now) => {
              const u = Math.min(1, (now - t0) / ms);
              scrollTo(0, from + dy * ease(u));
              if (u < 1) requestAnimationFrame(step);
              else done();
            };
            requestAnimationFrame(step);
          }),
        [dy, seconds * 1000],
      );
    },
    /** Scroll by `dy` pixels in wheel bursts that ease off, like a hand on a wheel. */
    async scroll(dy, { burst = 6 } = {}) {
      const sign = Math.sign(dy);
      let left = Math.abs(dy);
      while (left > 0) {
        for (let i = 0; i < burst && left > 0; i++) {
          const step = Math.min(left, 60 + Math.round(random() * 50));
          await page.mouse.wheel(0, sign * step);
          left -= step;
          await page.waitForTimeout(28 + Math.round(random() * 14));
        }
        await human.wait(320);
      }
    },
  };

  /** Start a take; `stop()` returns the frames with their times. */
  async function record() {
    const dir = mkdtempSync(join(tmpdir(), "take-"));
    const frames = [];
    let stopped = false;
    const cdp = await context.newCDPSession(page);
    cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
      if (stopped) return;
      const file = join(dir, `${String(frames.length).padStart(6, "0")}.jpg`);
      writeFileSync(file, Buffer.from(data, "base64"));
      frames.push({ file, t: metadata.timestamp });
      await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    });
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: viewport.width * scale, maxHeight: viewport.height * scale });
    const marks = {};
    return {
      /** Name the current moment, to cut the take there later. */
      mark: (name) => (marks[name] = Date.now() / 1000),
      async stop() {
        stopped = true;
        await cdp.send("Page.stopScreencast").catch(() => {});
        return { dir, frames, marks };
      },
    };
  }

  return { browser, context, page, human, record };
}

/**
 * Encode a take: H.264 mp4 and VP9 webm at 1440 and 720 wide, and a webp
 * poster from its first frame. `from`/`to` are epoch seconds (marks).
 * Returns the sizes, to keep every file under its budget.
 */
export function encode(take, outBase, { from, to, fps = 30, crf = { mp4: 27, webm: 38 } } = {}) {
  const frames = take.frames.filter((f) => (from === undefined || f.t >= from) && (to === undefined || f.t <= to));
  if (frames.length < 2) throw new Error(`${outBase}: no frames in the cut`);
  // the concat list: each frame held until the next one arrived
  const list = join(take.dir, "list.txt");
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const next = frames[i + 1]?.t ?? frames[i].t + 1 / fps;
    lines.push(`file '${frames[i].file}'`, `duration ${Math.max(0.001, next - frames[i].t).toFixed(4)}`);
  }
  lines.push(`file '${frames[frames.length - 1].file}'`);
  writeFileSync(list, lines.join("\n"));
  mkdirSync(dirname(outBase), { recursive: true });
  const out = {};
  for (const w of [1440, 720]) {
    const vf = `fps=${fps},scale=${w}:-2:flags=lanczos,format=yuv420p`;
    const mp4 = `${outBase}-${w}.mp4`;
    const webm = `${outBase}-${w}.webm`;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-vf", vf, "-an",
      "-c:v", "libx264", "-preset", "slow", "-crf", String(crf.mp4 + (w === 720 ? 1 : 0)), "-movflags", "+faststart", mp4]);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-vf", vf, "-an",
      "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf.webm + (w === 720 ? 2 : 0)), "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", webm]);
    out[w] = { mp4: statSync(mp4).size, webm: statSync(webm).size };
  }
  const poster = `${outBase}-poster.webp`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", frames[0].file, "-vf", "scale=1440:-2:flags=lanczos", "-quality", "82", poster]);
  out.poster = statSync(poster).size;
  out.seconds = +(frames[frames.length - 1].t - frames[0].t).toFixed(1);
  return out;
}

export function discard(take) {
  rmSync(take.dir, { recursive: true, force: true });
}
