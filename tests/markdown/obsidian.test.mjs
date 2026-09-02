import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../../plugins/markdown-pipeline.mjs'

const render = (md) => renderMarkdown(md, { slug: 'arc' })

describe('obsidian embeds', () => {
  it('rewrites a raster embed to a public path', async () => {
    const { html } = await render('![[diagram.png]]')
    expect(html).toContain('src="/blog/arc/diagram.png"')
  })

  it('uses the pipe alt as the alt attribute', async () => {
    const { html } = await render('![[diagram.png|Routing graph]]')
    expect(html).toContain('alt="Routing graph"')
  })

  it('falls back to the filename stem for alt', async () => {
    const { html } = await render('![[routing-graph.png]]')
    expect(html).toContain('alt="routing-graph"')
  })

  it('wraps the image in a figure on the wide track', async () => {
    const { html } = await render('![[diagram.png]]')
    expect(html).toContain('<figure')
    expect(html).toContain('figure--wide')
  })

  it('leaves ordinary wikilinks alone', async () => {
    const { html } = await render('see [[Another Note]]')
    expect(html).toContain('[[Another Note]]')
  })
})

describe('obsidian callouts', () => {
  it('renders a warning callout with its label', async () => {
    const { html } = await render('> [!warning] Three caveats\n> The budget is elapsed time.')
    expect(html).toContain('callout-warning')
    expect(html).toContain('Three caveats')
    expect(html).toContain('The budget is elapsed time.')
  })

  it('supports note, tip and info', async () => {
    for (const type of ['note', 'tip', 'info']) {
      const { html } = await render(`> [!${type}] T\n> body`)
      expect(html).toContain(`callout-${type}`)
    }
  })

  it('falls back to note for an unknown type', async () => {
    const { html } = await render('> [!wat] T\n> body')
    expect(html).toContain('callout-note')
  })

  it('leaves a plain blockquote as a blockquote', async () => {
    const { html } = await render('> just a quote')
    expect(html).toContain('<blockquote>')
    expect(html).not.toContain('callout')
  })

  it('uses aside, not blockquote, for callouts', async () => {
    const { html } = await render('> [!warning] T\n> body')
    expect(html).toContain('<aside')
  })
})

describe('section numerals', () => {
  it('splits the numeral out of the heading text', async () => {
    const { html, toc } = await render('## 5. Cracking Two-Way Streets')
    expect(html).toContain('data-numeral="5"')
    expect(toc[0].text).toBe('Cracking Two-Way Streets')
    expect(toc[0].numeral).toBe('5')
  })

  it('handles sub-numerals', async () => {
    const { toc } = await render('### 3.2 Iterated Local Search')
    expect(toc[0].numeral).toBe('3.2')
    expect(toc[0].text).toBe('Iterated Local Search')
  })

  it('slugs from the cleaned title, not the numeral', async () => {
    const { html } = await render('## 5. Cracking Two-Way Streets')
    expect(html).toContain('id="cracking-two-way-streets"')
  })

  it('degrades gracefully without a numeral', async () => {
    const { toc } = await render('## Conclusion')
    expect(toc[0].numeral).toBeNull()
    expect(toc[0].text).toBe('Conclusion')
  })
})
