import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArticleMasthead } from '../../src/blog/components/ArticleMasthead'

const base = {
  slug: 'arc', title: 'Arc Routing for Waste Collection',
  summary: 'Why the solvers optimize a different problem.',
  tags: ['optimization'], readingTimeMinutes: 9, toc: [],
}

describe('ArticleMasthead', () => {
  it('shows the publish date and reading time', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead post={{ ...base, date: '2026-09-02', updated: null }} />,
    )
    expect(html).toContain('2026.09.02')
    expect(html).toContain('9')
  })

  it('omits the revised token when never revised', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead post={{ ...base, date: '2026-09-02', updated: null }} />,
    )
    expect(html.toUpperCase()).not.toContain('REVISED')
  })

  it('states the revision rather than replacing the publish date', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead post={{ ...base, date: '2026-09-02', updated: '2026-10-14' }} />,
    )
    expect(html).toContain('2026.09.02')
    expect(html).toContain('2026.10.14')
  })

  it('emits machine-readable time elements for both dates', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead post={{ ...base, date: '2026-09-02', updated: '2026-10-14' }} />,
    )
    expect(html).toContain('datetime="2026-09-02"')
    expect(html).toContain('datetime="2026-10-14"')
  })

  it('renders the title as an h1', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead post={{ ...base, date: '2026-09-02', updated: null }} />,
    )
    expect(html).toContain('<h1')
    expect(html).toContain('Arc Routing for Waste Collection')
  })
})
