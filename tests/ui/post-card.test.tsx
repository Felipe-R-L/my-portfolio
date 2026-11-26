import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('../../src/app/hooks/useIsMobile', () => ({ useIsMobile: () => true }))

const POST = {
  slug: 'arc', title: 'Arc Routing for Waste Collection', date: '2026-09-02',
  updated: '2026-10-14', summary: 'Why the solvers optimize a different problem.',
  tags: ['optimization', 'pyvrp'], readingTimeMinutes: 9,
}

describe('PostCard', () => {
  it('links to the article', async () => {
    const { PostCard } = await import('../../src/blog/components/PostCard')
    const html = renderToStaticMarkup(<PostCard post={POST} />)
    expect(html).toContain('href="/blog/arc"')
  })

  it('shows the title, month timecode and reading time', async () => {
    const { PostCard } = await import('../../src/blog/components/PostCard')
    const html = renderToStaticMarkup(<PostCard post={POST} />)
    expect(html).toContain('Arc Routing for Waste Collection')
    expect(html).toContain('2026.09')
    expect(html).toContain('9')
  })

  it('marks a revised post with the revision month', async () => {
    const { PostCard } = await import('../../src/blog/components/PostCard')
    const html = renderToStaticMarkup(<PostCard post={POST} />)
    expect(html).toContain('blog-post__rev')
    expect(html).toContain('2026.10')
  })

  it('does not mark an unrevised post', async () => {
    const { PostCard } = await import('../../src/blog/components/PostCard')
    const html = renderToStaticMarkup(<PostCard post={{ ...POST, updated: null }} />)
    expect(html).not.toContain('blog-post__rev')
  })

  it('lists the tags', async () => {
    const { PostCard } = await import('../../src/blog/components/PostCard')
    const html = renderToStaticMarkup(<PostCard post={POST} />)
    expect(html).toContain('<li>pyvrp</li>')
  })
})
