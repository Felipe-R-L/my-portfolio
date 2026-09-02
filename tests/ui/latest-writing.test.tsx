import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('../../src/app/hooks/useIsMobile', () => ({ useIsMobile: () => true }))

const POST = {
  slug: 'arc-routing-for-waste-collection',
  title: 'Arc Routing for Waste Collection',
  date: '2026-09-02',
  updated: null,
  summary: 'Why the solvers you can install optimize a different problem than the one a truck actually has.',
  tags: ['optimization', 'vrp', 'carp', 'pyvrp'],
  revisions: [],
  html: '<p>a waste collection truck attending every street in a neighborhood, repeated many times over to stand in for a full 2000-word article body that must never reach the homepage bundle</p>',
  toc: [],
  wordCount: 2000,
  readingTimeMinutes: 9,
}

const SUMMARY = {
  slug: POST.slug,
  title: POST.title,
  date: POST.date,
  updated: POST.updated,
  summary: POST.summary,
  tags: POST.tags,
  readingTimeMinutes: POST.readingTimeMinutes,
}

describe('LatestWritingContent', () => {
  it('renders nothing when there are no published posts', async () => {
    vi.resetModules()
    vi.doMock('virtual:posts', () => ({ posts: [], default: [], summaries: [] }))
    const { default: LatestWritingContent } = await import(
      '../../src/app/components/LatestWritingContent'
    )
    const html = renderToStaticMarkup(<LatestWritingContent />)
    expect(html).toBe('')
  })

  it('shows the most recent post as a real link to /blog/<slug>', async () => {
    vi.resetModules()
    vi.doMock('virtual:posts', () => ({ posts: [POST], default: [POST], summaries: [SUMMARY] }))
    const { default: LatestWritingContent } = await import(
      '../../src/app/components/LatestWritingContent'
    )
    const html = renderToStaticMarkup(<LatestWritingContent />)
    expect(html).toContain('href="/blog/arc-routing-for-waste-collection"')
    expect(html).toContain('Arc Routing for Waste Collection')
    expect(html).toContain('href="/blog"')
  })

  it('never ships the article html field into the rendered markup', async () => {
    vi.resetModules()
    vi.doMock('virtual:posts', () => ({ posts: [POST], default: [POST], summaries: [SUMMARY] }))
    const { default: LatestWritingContent } = await import(
      '../../src/app/components/LatestWritingContent'
    )
    const html = renderToStaticMarkup(<LatestWritingContent />)
    expect(html).not.toContain('must never reach the homepage bundle')
  })
})
