import { describe, it, expect } from 'vitest'
import { renderRoute } from '../scripts/fan-out.mjs'

const TEMPLATE = `<!doctype html><html lang="en"><head><!--blog-head--></head>` +
  `<body><div id="blog-chrome"></div><div id="blog-content"><!--blog-content--></div>` +
  `<script type="application/json" id="blog-data"><!--blog-data--></script></body></html>`

const POST = {
  slug: 'arc', title: 'Arc Routing for Waste Collection', date: '2026-09-02',
  updated: '2026-10-14', summary: 'Why the solvers optimize a different problem.',
  tags: ['optimization'], revisions: [], html: '<h2 id="one">One</h2><p>Body.</p>',
  toc: [{ id: 'one', text: 'One', depth: 2, numeral: '1' }],
  wordCount: 2058, readingTimeMinutes: 9,
}

describe('renderRoute', () => {
  it('injects the article body into the document', () => {
    const html = renderRoute({ template: TEMPLATE, kind: 'article', post: POST, posts: [POST] })
    expect(html).toContain('<p>Body.</p>')
    expect(html).not.toContain('<!--blog-content-->')
  })

  it('emits per-article og and twitter tags', () => {
    const html = renderRoute({ template: TEMPLATE, kind: 'article', post: POST, posts: [POST] })
    expect(html).toContain('property="og:type" content="article"')
    expect(html).toContain('og:url" content="https://felipeleone.dev/blog/arc"')
    expect(html).toContain('name="twitter:card"')
  })

  it('emits json-ld carrying both dates', () => {
    const html = renderRoute({ template: TEMPLATE, kind: 'article', post: POST, posts: [POST] })
    expect(html).toContain('"@type":"Article"')
    expect(html).toContain('"datePublished":"2026-09-02"')
    expect(html).toContain('"dateModified":"2026-10-14"')
  })

  it('escapes quotes in meta content', () => {
    const post = { ...POST, summary: 'He said "no" & left' }
    const html = renderRoute({ template: TEMPLATE, kind: 'article', post, posts: [post] })
    expect(html).toContain('&quot;no&quot;')
    expect(html).not.toMatch(/content="He said "no"/)
  })

  it('embeds json the browser can parse without breaking out of the script tag', () => {
    const post = { ...POST, title: 'A </script> title' }
    const html = renderRoute({ template: TEMPLATE, kind: 'article', post, posts: [post] })
    expect(html).not.toContain('A </script> title')
    expect(html).toContain('<\\/script>')
  })

  it('renders the index route with summaries but no bodies', () => {
    const html = renderRoute({ template: TEMPLATE, kind: 'index', posts: [POST] })
    expect(html).toContain('"kind":"index"')
    expect(html).not.toContain('<p>Body.</p>')
    expect(html).toContain('og:type" content="website"')
  })
})
