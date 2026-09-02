import { describe, it, expect } from 'vitest'
import { buildFeed } from '../../scripts/lib/feed.mjs'

const POSTS = [{
  slug: 'arc', title: 'Arc Routing for Waste Collection', date: '2026-09-02',
  updated: '2026-10-14', summary: 'Why the solvers optimize a different problem.',
  tags: [], revisions: [], html: '<p>x</p>', toc: [],
  wordCount: 2058, readingTimeMinutes: 9,
}]

describe('buildFeed', () => {
  const xml = buildFeed({ posts: POSTS, site: 'https://felipeleone.dev' })

  it('is a valid rss envelope', () => {
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('</rss>')
  })

  it('includes the article with an absolute link', () => {
    expect(xml).toContain('<title>Arc Routing for Waste Collection</title>')
    expect(xml).toContain('<link>https://felipeleone.dev/blog/arc</link>')
  })

  it('carries pubDate and atom:updated so revisions are visible', () => {
    expect(xml).toContain('<pubDate>')
    expect(xml).toContain('<atom:updated>2026-10-14')
  })

  it('escapes xml-special characters in titles', () => {
    const out = buildFeed({ posts: [{ ...POSTS[0], title: 'Cost & <Benefit>' }], site: 'https://x.dev' })
    expect(out).toContain('Cost &amp; &lt;Benefit&gt;')
  })

  it('renders an empty channel without throwing', () => {
    expect(buildFeed({ posts: [], site: 'https://x.dev' })).toContain('</channel>')
  })
})
