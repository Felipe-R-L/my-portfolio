/**
 * The hero's first frame as static HTML, written into index.html at build
 * time (see the `heroShell` plugin in vite.config.ts).
 *
 * Without it the page shows nothing until React has downloaded and run, and
 * on a phone that took 3.5 s (Lighthouse "render delay"). The shell is the
 * front layer of the name exactly as `NameLayout show="front"` renders it, so
 * when React mounts and replaces it nothing moves; the city then appears
 * inside the letters. tests/ui/hero-shell.test.tsx holds the two together.
 *
 * Pure strings, no React: the Vite config imports this file.
 */
import { NAME } from "./name";

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export type ShellCopy = { description: string; cta: string };

/** The front layer of the name: every line laid out, the city line a ghost. */
export function nameFrontHtml(copy: ShellCopy): string {
  let offset = 0;
  const lines = NAME.lines
    .map((word, i) => {
      const isCity = i === NAME.city;
      let marked = false;
      const letters = [...word]
        .map((ch, k) => {
          const target = isCity && !marked && ch.toLowerCase() === NAME.mark;
          if (target) marked = true;
          const zoom = target ? ` data-zoom-target="${NAME.markX}"` : "";
          return `<span class="hero-letter"${zoom} style="--i:${offset + k}">${esc(ch)}</span>`;
        })
        .join("");
      offset += word.length;
      const cls = `hero-line${i > 0 ? " hero-line--next" : ""}${isCity ? " city-ghost" : ""}`;
      return `<span class="${cls}"><span class="hero-word">${letters}</span></span>`;
    })
    .join("");
  return (
    `<div class="hero-frame"><div class="hero-name" aria-hidden="true" data-measure="">${lines}</div>` +
    `<div class="hero-credits "><p class="hero-pitch" data-shell="description">${esc(copy.description)}</p>` +
    `<a href="#projects" class="hero-link" data-shell="cta">${esc(copy.cta)}</a></div></div>`
  );
}

/**
 * The whole shell for #root, plus the inline script that swaps in the
 * visitor's language before the first paint. The script follows the order
 * i18next's detector uses here: ?lng=, the stored choice, then the browser.
 */
export function heroShellHtml(copies: Record<"pt" | "en", ShellCopy>, fallback: "pt" | "en" = "en"): string {
  const body =
    `<section class="city" aria-label="${esc(NAME.full)}"><div class="city-stage">` +
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
