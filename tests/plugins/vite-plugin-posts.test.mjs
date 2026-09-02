import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadPosts } from '../../plugins/vite-plugin-posts.mjs'

let repo
const postsDir = () => join(repo, 'src', 'content', 'posts')
const writePost = (slug, front, body) =>
  writeFileSync(join(postsDir(), `${slug}.md`), `---\n${front}\n---\n\n${body}\n`)

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'repo-'))
  mkdirSync(postsDir(), { recursive: true })
})
afterEach(() => rmSync(repo, { recursive: true, force: true }))

describe('loadPosts', () => {
  it('loads and renders a post', async () => {
    writePost('a', 'title: A\ndate: 2026-09-02\nsummary: S', '## 1. Intro\n\nHello.')
    const posts = await loadPosts({ repoRoot: repo })
    expect(posts[0].slug).toBe('a')
    expect(posts[0].html).toContain('Hello.')
    expect(posts[0].toc[0].numeral).toBe('1')
  })

  it('computes word count and reading time', async () => {
    writePost('a', 'title: A\ndate: 2026-09-02\nsummary: S', 'word '.repeat(450))
    const [post] = await loadPosts({ repoRoot: repo })
    expect(post.wordCount).toBe(450)
    expect(post.readingTimeMinutes).toBe(2)
  })

  it('excludes drafts', async () => {
    writePost('a', 'title: A\ndate: 2026-09-02\nsummary: S\ndraft: true', 'Body.')
    expect(await loadPosts({ repoRoot: repo })).toHaveLength(0)
  })

  it('sorts newest first', async () => {
    writePost('old', 'title: Old\ndate: 2026-01-01\nsummary: S', 'x')
    writePost('new', 'title: New\ndate: 2026-09-02\nsummary: S', 'x')
    expect((await loadPosts({ repoRoot: repo })).map((p) => p.slug)).toEqual(['new', 'old'])
  })

  it('fails the build on missing required frontmatter', async () => {
    writePost('a', 'title: A', 'Body.')
    await expect(loadPosts({ repoRoot: repo })).rejects.toThrow(/date/)
  })

  it('fails the build on a duplicate slug', async () => {
    writePost('a', 'title: A\ndate: 2026-09-02\nsummary: S\nslug: same', 'x')
    writePost('b', 'title: B\ndate: 2026-09-03\nsummary: S\nslug: same', 'x')
    await expect(loadPosts({ repoRoot: repo })).rejects.toThrow(/duplicate slug/)
  })

  it('fails the build when an asset is missing from the repo', async () => {
    writePost('a', 'title: A\ndate: 2026-09-02\nsummary: S', '![[gone.png]]')
    await expect(loadPosts({ repoRoot: repo })).rejects.toThrow(/gone\.png/)
  })

  it('fails the build when an asset hash does not match the manifest', async () => {
    mkdirSync(join(repo, 'public', 'blog', 'a'), { recursive: true })
    writeFileSync(join(repo, 'public', 'blog', 'a', 'd.png'), 'actual bytes')
    writePost('a', 'title: A\ndate: 2026-09-02\nsummary: S', '![[d.png]]')
    writeFileSync(join(postsDir(), 'a.assets.json'), JSON.stringify({ 'd.png': { sha256: 'wrong' } }))
    await expect(loadPosts({ repoRoot: repo })).rejects.toThrow(/hash/i)
  })

  it('fails the build when heading levels skip', async () => {
    writePost('a', 'title: A\ndate: 2026-09-02\nsummary: S', '## Two\n\n#### Four')
    await expect(loadPosts({ repoRoot: repo })).rejects.toThrow(/heading/i)
  })
})
