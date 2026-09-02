import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../../plugins/markdown-pipeline.mjs'

const render = (md) => renderMarkdown(md, { slug: 'test' })

describe('renderMarkdown', () => {
  it('renders GFM tables', async () => {
    const { html } = await render('| a | b |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>1</td>')
  })

  it('renders footnotes', async () => {
    const { html } = await render('Text[^1]\n\n[^1]: A note.')
    expect(html).toContain('footnote')
  })

  it('renders strikethrough and task lists', async () => {
    const { html } = await render('~~gone~~\n\n- [ ] a\n- [x] b')
    expect(html).toContain('<del>gone</del>')
    expect(html).toContain('type="checkbox"')
  })

  it('renders inline and block math', async () => {
    const { html } = await render('Cost $O(n!)$ grows.\n\n$$c_{ij} = d_{ij}$$')
    expect(html).toContain('katex')
  })

  it('highlights fenced code at build time', async () => {
    const { html } = await render('```python\nx = 1\n```')
    expect(html).toContain('<pre')
    expect(html).toContain('shiki')
  })

  it('gives headings stable ids and anchor links', async () => {
    const { html } = await render('## Cracking Two-Way Streets')
    expect(html).toContain('id="cracking-two-way-streets"')
    expect(html).toContain('href="#cracking-two-way-streets"')
  })

  it('extracts a table of contents', async () => {
    const { toc } = await render('## One\n\ntext\n\n### One A\n\ntext\n\n## Two')
    expect(toc.map((t) => t.text)).toEqual(['One', 'One A', 'Two'])
    expect(toc.map((t) => t.depth)).toEqual([2, 3, 2])
  })

  it('wraps tables so they can scroll without the page scrolling sideways', async () => {
    const { html } = await render('| a | b |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('table-scroll')
  })
})
