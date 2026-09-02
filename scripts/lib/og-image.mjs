import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

import { OG_WIDTH as W, OG_HEIGHT as H } from './og-size.mjs'

function card({ title, meta, fontFamily }) {
  const row = (children, style) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } })
  return {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', backgroundColor: '#030305',
        padding: '72px', fontFamily,
      },
      children: [
        row('FELIPE R. LEONE', { fontSize: 22, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)' }),
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              row('', {
                width: 96, height: 5, marginBottom: 32, borderRadius: 999,
                backgroundImage: 'linear-gradient(90deg, #4c8dff, #8b5cf6)',
              }),
              row(title, {
                fontSize: 66, fontWeight: 700, lineHeight: 1.1,
                color: '#ffffff', letterSpacing: '-0.03em',
              }),
            ],
          },
        },
        row(meta, { fontSize: 22, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }),
      ],
    },
  }
}

// satori cannot read woff2 — it needs a raw TTF/OTF buffer. The site's
// public/ woff2 files are the browser-facing assets and must never be the
// source here. This TTF is a build-time-only rasterisation input for the
// og-image pipeline; it lives at repo-root assets/fonts/ (NOT under
// public/) so it is never copied into dist or served to a visitor.
function loadFont(repoRoot) {
  const path = join(repoRoot, 'assets/fonts/space-grotesk.ttf')
  if (existsSync(path)) return readFileSync(path)
  throw new Error(
    `[og] No TTF found for Space Grotesk at ${path}. satori cannot read woff2. Place a TTF of ` +
      `the family already used by the site at assets/fonts/space-grotesk.ttf (repo root, not ` +
      `public/). Do not add a new typeface.`,
  )
}

export async function writeOgImages({ posts, dist, repoRoot }) {
  if (posts.length === 0) return
  const outDir = join(dist, 'og')
  mkdirSync(outDir, { recursive: true })

  const fontData = loadFont(repoRoot)
  const fonts = [{ name: 'Space Grotesk', weight: 700, style: 'normal', data: fontData }]

  for (const post of posts) {
    const meta = `${post.date.replaceAll('-', '.')} · ${post.readingTimeMinutes} MIN` +
      (post.updated ? ` · REVISED ${post.updated.replaceAll('-', '.')}` : '')

    const svg = await satori(
      card({ title: post.title, meta, fontFamily: 'Space Grotesk' }),
      { width: W, height: H, fonts },
    )
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()
    writeFileSync(join(outDir, `${post.slug}.png`), png)
    console.log(`  emitted og/${post.slug}.png`)
  }
}
