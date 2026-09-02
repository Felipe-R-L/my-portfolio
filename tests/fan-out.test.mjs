import { describe, it, expect } from 'vitest'
import { renderRoute, SITE, AUTHOR, AUTHOR_URL } from '../scripts/fan-out.mjs'
import { OG_WIDTH, OG_HEIGHT } from '../scripts/lib/og-size.mjs'

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
    expect(html).toContain(`og:url" content="${SITE}/blog/arc"`)
    expect(html).toContain('name="twitter:card"')
  })

  it('declares og image dimensions and type so scrapers never have to probe', () => {
    const html = renderRoute({ template: TEMPLATE, kind: 'article', post: POST, posts: [POST] })
    expect(html).toContain(`property="og:image:width" content="${OG_WIDTH}"`)
    expect(html).toContain(`property="og:image:height" content="${OG_HEIGHT}"`)
    expect(html).toContain('property="og:image:type" content="image/png"')
  })

  it('names the author in meta tags, not only in json-ld', () => {
    const html = renderRoute({ template: TEMPLATE, kind: 'article', post: POST, posts: [POST] })
    expect(html).toContain(`name="author" content="${AUTHOR}"`)
    expect(html).toContain(`property="article:author" content="${AUTHOR_URL}"`)
    expect(html).toContain(`"name":"${AUTHOR}"`)
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

  it('round-trips $-pattern sequences in the article body without corruption', () => {
    // String.prototype.replace interprets $&, $`, $' and $$ in a *string*
    // replacement argument. head/content/data are arbitrary author content
    // (code fences, shell snippets) and must be inserted literally.
    const dollarHtml = "<pre><code>echo $&; echo $`; echo $'; echo $$</code></pre>"
    const post = { ...POST, html: dollarHtml }
    const html = renderRoute({ template: TEMPLATE, kind: 'article', post, posts: [post] })
    expect(html).toContain(dollarHtml)
    expect(html).not.toContain('<!--blog-content-->')
    expect(html).not.toContain('<!--blog-head-->')
    expect(html).not.toContain('<!--blog-data-->')
  })

  it('renders the index route with summaries but no bodies', () => {
    const html = renderRoute({ template: TEMPLATE, kind: 'index', posts: [POST] })
    expect(html).toContain('"kind":"index"')
    expect(html).not.toContain('<p>Body.</p>')
    expect(html).toContain('og:type" content="website"')
  })
})
