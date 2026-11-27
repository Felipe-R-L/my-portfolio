/**
 * The hero's first frame as static HTML, written into index.html at build
 * time (see the `heroShell` plugin in vite.config.ts).
 *
 * Without it the page shows nothing until React has downloaded and run, and
 * on a phone that took 3.5 s (Lighthouse "render delay"). The shell is the
 * name exactly as `NameLayout` renders it, over Diamante, so when React mounts
 * and replaces it nothing moves. tests/ui/hero-shell.test.tsx holds the two
 * together.
 *
 * Pure strings, no React: the Vite config imports this file.
 */
import { NAME } from "./name";
import { STAMP_SVG } from "./stamp";
import { mediaBase } from "../../media";

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export type ShellCopy = { description: string; cta: string };

/** The name: each line a row of words, every letter numbered for the rise. */
export function nameFrontHtml(copy: ShellCopy): string {
  let offset = 0;
  const lines = NAME.lines
    .map((words, i) => {
      const row = words
        .map((w) => {
          const letters = [...w.text]
            .map((ch, k) => `<span class="hero-letter" style="--i:${offset + k}">${esc(ch)}</span>`)
            .join("");
          offset += w.text.length;
          return `<span class="hero-word${w.em ? " hero-word--em" : ""}">${letters}</span>`;
        })
        .join(" ");
      return `<span class="hero-line${i > 0 ? " hero-line--next" : ""}">${row}</span>`;
    })
    .join("");
  return (
    `<div class="hero-frame"><div class="hero-name" aria-hidden="true">${lines}</div>` +
    `<div class="hero-credits "><p class="hero-pitch" data-shell="description">${esc(copy.description)}</p>` +
    `<a href="#projects" class="hero-link" data-shell="cta">${esc(copy.cta)}</a></div></div>`
  );
}

/**
 * Diamante behind the name: a drone pulling back from the old town to the
 * whole coast at sunset (Francesco Rinaldi, Storyblocks, licensed 2026-11-27),
 * played once at 1.5x and held on the wide view. Its first frame is the
 * poster and the LCP image (one file per device); the video swaps in when it
 * can play. Reduced motion keeps the still. Then the film grain and the travel
 * stamp. Graded by CSS (HeroCity.css). React mounts this same markup.
 */
/** The place's markup (the media's address is read when it is built). The
    picture and the video are fetched in CORS mode: the sea reads their
    frames into WebGL, which a cross-origin image without it would refuse. */
export const placeHtml = () => {
  const SB = mediaBase();
  return (
  `<picture><source media="(max-width: 768px)" srcset="${SB}/diamante-aerial-first-tall-720.webp">` +
  `<img class="city-place-photo" src="${SB}/diamante-aerial-first-1920.webp" alt="" width="1920" height="1081" fetchpriority="high" decoding="async" crossorigin="anonymous"></picture>` +
  `<video class="city-place-video" muted playsinline autoplay preload="auto" aria-hidden="true" crossorigin="anonymous">` +
  `<source media="(max-width: 768px)" src="${SB}/diamante-aerial-tall-720.webm" type="video/webm">` +
  `<source media="(max-width: 768px)" src="${SB}/diamante-aerial-tall-720.mp4" type="video/mp4">` +
  `<source src="${SB}/diamante-aerial-1920.webm" type="video/webm">` +
  `<source src="${SB}/diamante-aerial-1920.mp4" type="video/mp4"></video>` +
  // the rest of the flight (in, over the roofs, the boat out to sea): loaded
  // while the first plays, then the two take turns (placeLoop.ts)
  `<video class="city-place-video city-place-next" data-off="" muted playsinline preload="none" aria-hidden="true" crossorigin="anonymous">` +
  `<source media="(max-width: 768px)" src="${SB}/diamante-rest2-tall-720.webm" type="video/webm">` +
  `<source media="(max-width: 768px)" src="${SB}/diamante-rest2-tall-720.mp4" type="video/mp4">` +
  `<source src="${SB}/diamante-rest2-1920.webm" type="video/webm">` +
  `<source src="${SB}/diamante-rest2-1920.mp4" type="video/mp4"></video>` +
  `<div class="city-place-grain"></div>` +
  `<div class="hero-stamp">${STAMP_SVG}</div>`);
}

/**
 * The whole shell for #root, plus the inline script that swaps in the
 * visitor's language before the first paint. The script follows the order
 * i18next's detector uses here: ?lng=, the stored choice, then the browser.
 */
export function heroShellHtml(copies: Record<"pt" | "en", ShellCopy>, fallback: "pt" | "en" = "en"): string {
  const body =
    `<section class="city" aria-label="${esc(NAME.full)}"><div class="city-stage">` +
    `<div class="city-place" aria-hidden="true">${placeHtml()}</div>` +
    `<div class="city-front"><h1 class="sr-only">${esc(NAME.full)}</h1>${nameFrontHtml(copies[fallback])}</div>` +
    `</div></section>`;
  const json = JSON.stringify(copies).replaceAll("<", "\\u003c");
  const script =
    `<script>window.__heroT0=performance.now();(function(){try{var c=${json};` +
    `var q=new URLSearchParams(location.search).get("lng");var s=null;try{s=localStorage.getItem("i18nextLng")}catch(e){}` +
    `var l=[q,s].concat(navigator.languages||[navigator.language]).map(function(x){return(x||"").slice(0,2)}).filter(function(x){return c[x]})[0]||"${fallback}";` +
    `document.documentElement.lang=l;var t=c[l];` +
    `document.querySelectorAll("[data-shell]").forEach(function(e){e.textContent=t[e.getAttribute("data-shell")]})}catch(e){}})()</script>`;
  return body + script;
}
