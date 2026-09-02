import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://felipeleone.dev'

const esc = (v) =>
  String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;')

export function buildFeed({ posts, site = SITE }) {
  const items = posts.map((post) => `    <item>
      <title>${esc(post.title)}</title>
      <link>${site}/blog/${post.slug}</link>
      <guid isPermaLink="true">${site}/blog/${post.slug}</guid>
      <description>${esc(post.summary)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <atom:updated>${new Date(post.updated ?? post.date).toISOString()}</atom:updated>
    </item>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Felipe R. Leone — Writing</title>
    <link>${site}/blog</link>
    <description>Technical writing on optimization, routing and applied software.</description>
    <language>en</language>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
}

export function writeFeed({ posts, dist }) {
  mkdirSync(dist, { recursive: true })
  writeFileSync(join(dist, 'rss.xml'), buildFeed({ posts }))
  console.log('  emitted rss.xml')
}
