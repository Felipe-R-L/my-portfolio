import { describe, it, expect } from 'vitest'
import { renderStatusNote } from '../../scripts/lib/status-note.mjs'

const POSTS = [
  { title: 'Arc Routing for Waste Collection', words: 2058, readingTimeMinutes: 9,
    date: '2026-09-02', updated: null, status: 'synced', syncedAt: '2026-09-02T14:03:00Z' },
  { title: 'Two-Way Streets Revisited', words: 840, readingTimeMinutes: 4,
    date: '2026-08-30', updated: '2026-09-01', status: 'pending', syncedAt: '2026-08-30T09:11:00Z' },
  { title: 'Half Written Idea', words: 120, readingTimeMinutes: 1,
    date: null, updated: null, status: 'draft', syncedAt: null },
]

const ASSETS = [
  { article: 'Arc Routing for Waste Collection', filename: 'routing-graph.svg', where: 'repo + vault' },
  { article: 'Arc Routing for Waste Collection', filename: 'egl-benchmark.svg',
    where: 'repo only (from felipe-desktop)' },
]

describe('renderStatusNote', () => {
  const out = renderStatusNote({ posts: POSTS, assets: ASSETS, generatedAt: '2026-09-02T14:03:00Z' })

  it('marks each status with its glyph', () => {
    expect(out).toContain('| ✓ | Arc Routing for Waste Collection')
    expect(out).toContain('| ● | Two-Way Streets Revisited')
    expect(out).toContain('| ✎ | Half Written Idea')
  })

  it('shows publish and update dates', () => {
    expect(out).toContain('2026-09-02')
    expect(out).toContain('2026-09-01')
  })

  it('surfaces which machine holds a repo-only asset', () => {
    expect(out).toContain('repo only (from felipe-desktop)')
  })

  it('renders empty state without throwing', () => {
    const empty = renderStatusNote({ posts: [], assets: [], generatedAt: '2026-09-02T14:03:00Z' })
    expect(empty).toContain('No articles')
  })

  it('warns that the file is generated', () => {
    expect(out.toLowerCase()).toContain('generated')
  })

  it('finding 6: escapes a pipe in title/article/filename so the row keeps its column count', () => {
    // A pipe splits a naive Markdown table row into an extra column.
    // A row is well-formed only if it has the same number of *unescaped*
    // pipes as the header — a `\|` must not count as a column separator.
    const splitOnUnescapedPipes = (line) => line.split(/(?<!\\)\|/)

    const pipedPosts = [{
      title: 'Routing | Redux', words: 10, readingTimeMinutes: 1,
      date: '2026-09-02', updated: null, status: 'synced', syncedAt: null,
    }]
    const pipedAssets = [
      { article: 'A | B', filename: 'diagram | v2.svg', where: 'vault only' },
    ]
    const withPipes = renderStatusNote({
      posts: pipedPosts, assets: pipedAssets, generatedAt: '2026-09-02T00:00:00Z',
    })
    const lines = withPipes.split('\n')

    const articlesHeader = lines.find((l) => l.startsWith('| | Article'))
    const postRow = lines.find((l) => l.includes('Routing'))
    expect(splitOnUnescapedPipes(postRow).length).toBe(splitOnUnescapedPipes(articlesHeader).length)
    expect(postRow).toContain('Routing \\| Redux')

    const assetsHeader = lines.find((l) => l.startsWith('| Article | Asset'))
    const assetRow = lines.find((l) => l.includes('diagram'))
    expect(splitOnUnescapedPipes(assetRow).length).toBe(splitOnUnescapedPipes(assetsHeader).length)
    expect(assetRow).toContain('A \\| B')
    expect(assetRow).toContain('diagram \\| v2.svg')
  })
})
