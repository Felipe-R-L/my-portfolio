import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildSyncPlan } from '../../scripts/lib/plan-sync.mjs'

const CONFIG = {
  postsFolder: 'Blog',
  statusNote: '_Sync Status.md',
  requiredFrontmatter: ['title', 'date', 'summary'],
  assetExtensions: ['.svg', '.png'],
}

let repo, vault
const writePost = (name, body) => writeFileSync(join(vault, 'Blog', name), body)

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'repo-'))
  vault = mkdtempSync(join(tmpdir(), 'vault-'))
  mkdirSync(join(vault, 'Blog'), { recursive: true })
  mkdirSync(join(repo, 'src', 'content', 'posts'), { recursive: true })
})
afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
  rmSync(vault, { recursive: true, force: true })
})

const OPTS = () => ({
  repoRoot: repo, vaultRoot: vault, config: CONFIG,
  today: '2026-10-14', hostLabel: 'test-host',
})

describe('buildSyncPlan', () => {
  it('plans a valid post', () => {
    writePost('Post.md', '---\ntitle: Post\ndate: 2026-09-02\nsummary: S\n---\n\nBody.\n')
    const plan = buildSyncPlan(OPTS())
    expect(plan.errors).toEqual([])
    expect(plan.posts[0].slug).toBe('post')
  })

  it('errors on missing required frontmatter instead of guessing', () => {
    writePost('Bad.md', '---\ntitle: Bad\n---\n\nBody.\n')
    const errs = buildSyncPlan(OPTS()).errors.join(' ')
    expect(errs).toContain('date')
    expect(errs).toContain('summary')
  })

  it('errors on a referenced image that exists nowhere', () => {
    writePost('P.md', '---\ntitle: P\ndate: 2026-09-02\nsummary: S\n---\n\n![[nope.svg]]\n')
    expect(buildSyncPlan(OPTS()).errors.join(' ')).toContain('nope.svg')
  })

  it('warns but does not error when an asset is repo-only', () => {
    mkdirSync(join(repo, 'public', 'blog', 'p'), { recursive: true })
    writeFileSync(join(repo, 'public', 'blog', 'p', 'd.svg'), '<svg/>')
    writeFileSync(join(repo, 'src', 'content', 'posts', 'p.assets.json'),
      JSON.stringify({ 'd.svg': { sha256: 'x', ingestedFrom: 'felipe-desktop' } }))
    writePost('P.md', '---\ntitle: P\ndate: 2026-09-02\nsummary: S\n---\n\n![[d.svg]]\n')
    const plan = buildSyncPlan(OPTS())
    expect(plan.errors).toEqual([])
    expect(plan.warnings.join(' ')).toContain('felipe-desktop')
  })

  it('rejects duplicate slugs', () => {
    writePost('A.md', '---\ntitle: Same\ndate: 2026-09-02\nsummary: S\n---\n\nA\n')
    writePost('B.md', '---\ntitle: Same\ndate: 2026-09-03\nsummary: S\n---\n\nB\n')
    expect(buildSyncPlan(OPTS()).errors.join(' ')).toContain('duplicate slug')
  })

  it('proposes an updated date for a changed published post', () => {
    writePost('P.md', '---\ntitle: P\ndate: 2026-09-02\nsummary: S\nsynced_hash: stale\n---\n\nNew.\n')
    expect(buildSyncPlan(OPTS()).posts[0].proposedUpdated).toBe('2026-10-14')
  })

  it('skips the updated bump under noUpdated', () => {
    writePost('P.md', '---\ntitle: P\ndate: 2026-09-02\nsummary: S\nsynced_hash: stale\n---\n\nNew.\n')
    expect(buildSyncPlan({ ...OPTS(), noUpdated: true }).posts[0].proposedUpdated).toBeNull()
  })

  it('keeps drafts in the plan but marks them draft', () => {
    writePost('D.md', '---\ntitle: D\ndate: 2026-09-02\nsummary: S\ndraft: true\n---\n\nBody.\n')
    const plan = buildSyncPlan(OPTS())
    expect(plan.posts[0].status).toBe('draft')
    expect(plan.errors).toEqual([])
  })

  it('reports orphans as warnings, never as deletions', () => {
    mkdirSync(join(repo, 'public', 'blog', 'p'), { recursive: true })
    writeFileSync(join(repo, 'src', 'content', 'posts', 'p.assets.json'),
      JSON.stringify({ 'dropped.svg': { sha256: 'x' } }))
    writePost('P.md', '---\ntitle: P\ndate: 2026-09-02\nsummary: S\n---\n\nNo embeds.\n')
    const plan = buildSyncPlan(OPTS())
    expect(plan.errors).toEqual([])
    expect(plan.orphans.join(' ')).toContain('dropped.svg')
  })
})
