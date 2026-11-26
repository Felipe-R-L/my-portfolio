/**
 * The travel stamp over Diamante: a round postmark with the town's two
 * postcard lines around the rim ("Benvenuti a Diamante", "Città dei murales e
 * del peperoncino"), a chilli in the middle and the coordinates under it.
 * Inked in currentColor through a filter that roughens the edges and knocks
 * small holes in the ink, like a rubber stamp on paper.
 *
 * A plain string, so the static shell (index.html) and React draw the same
 * thing. Pure, no React: the Vite config imports this file through shell.ts.
 */

const RIM = "BENVENUTI A DIAMANTE • CITTÀ DEI MURALES E DEL PEPERONCINO •";

export const STAMP_SVG =
  `<svg class="hero-stamp-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">` +
  `<defs>` +
  `<filter id="hs-ink" x="-5%" y="-5%" width="110%" height="110%">` +
  `<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="wob"/>` +
  `<feDisplacementMap in="SourceGraphic" in2="wob" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="edge"/>` +
  `<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="grain"/>` +
  `<feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 0 0 0 2.6" result="holes"/>` +
  `<feComposite in="edge" in2="holes" operator="in"/>` +
  `</filter>` +
  `<path id="hs-rim" d="M100 21a79 79 0 1 1 0 158a79 79 0 1 1 0-158"/>` +
  `</defs>` +
  `<g filter="url(#hs-ink)" fill="currentColor" stroke="currentColor">` +
  `<circle cx="100" cy="100" r="92" fill="none" stroke-width="2.6"/>` +
  `<circle cx="100" cy="100" r="66" fill="none" stroke-width="1.2"/>` +
  `<text class="hero-stamp-rim" stroke="none" textLength="490" lengthAdjust="spacing">` +
  `<textPath href="#hs-rim">${RIM}</textPath></text>` +
  // the chilli: stem, calyx and the curved body, in a 48-unit box
  `<g transform="translate(70 52) scale(1.25)" stroke="none">` +
  `<path d="M31 6C29 7 28 10 28.5 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>` +
  `<path d="M22.5 15.5C24.5 12.5 30.5 12 33 14.5C34 16 33.5 18 32 19C29 20.5 25 20.5 23 19C22 18 21.8 16.6 22.5 15.5Z"/>` +
  `<path d="M23.5 18.5C21 26 18.5 33 12.5 38.5C10 40.8 7 42.3 4 43C11.5 44.6 19.5 42 25 36C29.5 31 31.5 25 32 19Z"/>` +
  `</g>` +
  `<text class="hero-stamp-coords" x="100" y="136" text-anchor="middle" stroke="none">39°40′ N · 15°49′ E</text>` +
  `</g></svg>`;
