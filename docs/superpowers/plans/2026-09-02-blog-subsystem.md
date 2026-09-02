# Blog Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a blog on `my-portfolio` whose articles are authored in Obsidian, rendered at build time, and served as pre-rendered static pages that extend this site's glass-over-galaxy identity and are pleasant to read.

**Architecture:** Three stages with hard boundaries. **Ingest** (`pnpm sync:posts`) copies Markdown and images from a scoped Obsidian folder into the repo and records asset hashes in a committed manifest. **Transform** (a Vite plugin) turns committed Markdown into HTML at build time via remark/rehype, so no parser ships to the browser. **Emit** builds a second HTML entry and fans it out to one real file per route, injecting the article body and per-page meta. Because the body is already HTML, React mounts only the chrome as islands and the article never hydrates.

**Tech Stack:** Node 24, pnpm 10.33.2, Vite 6.3.5, React 18.3.1, TypeScript (strict), Tailwind 4.1.12, i18next, unified/remark/rehype, Shiki, KaTeX, satori + @resvg/resvg-js, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-02-blog-design.md`

---

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

**Identity tokens (already defined in `src/styles/layout.css` and `theme.css` — never redefine)**
- Ground `#030305` · Foreground `#ffffff`
- Zone A (cold, the blog's zone): `--zone-a-1: #4c8dff` → `--zone-a-2: #8b5cf6`
- Zone B (warm, not used by the blog): `--zone-b-1: #f0a63c` → `--zone-b-2: #ec4899`
- `--measure: 72rem` · `--gutter: clamp(1.25rem, 5vw, 3rem)`
- `--rhythm-section: clamp(4.5rem, 8vw, 7rem)` · `--rhythm-block: clamp(2rem, 3.5vw, 3rem)`
- Utility classes `.section-shell`, `.measure`, `.rhythm-block`

**Glass recipe (copy exactly from the nav pill in `AppLayout.tsx`)**
`border border-white/[0.14] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150` with
`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]`.

**The reading slab is the ONE exception:** `bg-[#080810]/80` + `backdrop-blur-2xl` +
`border-white/10` + `rounded-[2rem]`. A translucent pill holding six words is fine; a reading
surface must not let stars move behind body text.

**Type scale (Space Grotesk only — no new font files, ever)**

| Role | Size | Weight | Notes |
|---|---|---|---|
| Article body | 18px / 1.8 | **400** | 62ch measure. 300 greys out on this ground |
| Lead | 21px / 1.6 | 300 | white/60 |
| h2 | clamp(1.75rem, 4vw, 2.25rem) | 700 | uppercase, tracking-tighter |
| h3 | 1.375rem | 600 | |
| Meta / labels | 10–12px | 500 | uppercase, tracking `0.2em`, white/40 |
| Inline code | 0.9em | 400 | system mono, `bg-white/[0.07]` |
| Code block | 14px / 1.7 | 400 | system mono |

System mono stack: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.

**Hard rules**
- **No client router.** No `react-router`, no history library. Routes are real files.
- **The article body never hydrates.** React mounts chrome only.
- The build **never** reads the Obsidian vault. Only committed content under `src/content/`.
- Absence of an asset in the vault **never** authorizes a delete. Only `--prune` deletes.
- A missing or hash-mismatched asset **fails the build**. No degraded mode.
- `sync:posts` never runs on Vercel and never auto-commits.
- All scripts are ESM `.mjs`. TypeScript is `strict` — no `any` without a written reason.
- Reuse `Section`, `SectionHeading`, `GlowCard`, `StarField`, `useSmoothScroll`, `useIsMobile`, `cn`. Do not reimplement them.
- Never redefine a token that `layout.css` already provides.

**Ported source of truth.** Stage 1 already exists and passes 60 tests. Its files live at
`/home/felipe/Code/portfolio/.claude/worktrees/blog-subsystem/` and are copied verbatim in Task 1.

---

## File Structure

| File | Responsibility |
|---|---|
| `blog.config.json` | Committed, machine-independent config |
| `.blog.local.json` | Gitignored, per-machine vault path |
| `scripts/lib/vault.mjs` | Vault resolution, scoped folder walk |
| `scripts/lib/frontmatter.mjs` | Parse, validate, body hash, status, slugify |
| `scripts/lib/assets.mjs` | Embeds, containment, 3-step resolution, manifest |
| `scripts/lib/revisions.mjs` | `updated` proposal |
| `scripts/lib/status-note.mjs` | `_Sync Status.md` generator |
| `scripts/lib/plan-sync.mjs` | Pure sync planner |
| `scripts/sync-posts.mjs` / `check-posts.mjs` | Stage 1 CLIs |
| `plugins/markdown-pipeline.mjs` | unified processor |
| `plugins/remark/*.mjs` | obsidian-embed, obsidian-callout, section-numeral |
| `plugins/rehype/inline-svg.mjs` | Sanitize + Zone A remap |
| `plugins/vite-plugin-posts.mjs` | `virtual:posts` + build-time validation |
| `blog.html` | MPA template for every blog route |
| `scripts/fan-out.mjs` | Writes one real HTML file per route |
| `scripts/lib/feed.mjs` / `og-image.mjs` | RSS and OG cards |
| `src/blog/main.tsx` | Island entry |
| `src/blog/components/*` | SceneListTOC, ReadingProgress, ArticleMasthead, PostCard |
| `src/blog/article.css` | Slab, type scale, two-track grid |

---

## Task 1: Port Stage 1 and the test runner

Stage 1 is written and proven. This task moves it in and re-proves it here, adapting only what is repo-specific.

**Files:**
- Modify: `package.json`, `.gitignore`
- Create: `vitest.config.ts`, `blog.config.json`
- Create: `scripts/lib/{vault,frontmatter,assets,revisions,status-note}.mjs`
- Create: `tests/lib/{vault,frontmatter,assets,revisions,status-note}.test.mjs`

**Interfaces:**
- Consumes: nothing
- Produces (these exact exports are relied on by Tasks 2 and 6):
  - `vault.mjs`: `loadConfig`, `resolveVaultRoot`, `listPostFiles`, `postsDir`, `hostLabel`, `VaultNotConfiguredError`
  - `frontmatter.mjs`: `parsePost`, `hashBody`, `validateFrontmatter`, `deriveStatus`, `serializePost`, `slugify`
  - `assets.mjs`: `findEmbeds`, `hashFile`, `loadManifest`, `saveManifest`, `resolveAsset`, `findOrphans`
  - `revisions.mjs`: `proposeUpdated`
  - `status-note.mjs`: `renderStatusNote`

- [ ] **Step 1: Install the test runner and Stage 1 dependencies**

```bash
pnpm add -D vitest@2.1.8 gray-matter@4.0.3 js-yaml@4.1.0
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{mjs,ts,tsx}'],
    environment: 'node',
    environmentMatchGlobs: [['tests/ui/**', 'jsdom']],
  },
})
```

- [ ] **Step 3: Add scripts to `package.json`**

Add to the existing `"scripts"` block, keeping `dev`, `build` and `preview`:

```json
"test": "vitest run",
"test:watch": "vitest",
"sync:posts": "node scripts/sync-posts.mjs",
"check:posts": "node scripts/check-posts.mjs"
```

- [ ] **Step 4: Copy the five modules and five test suites verbatim**

```bash
SRC=/home/felipe/Code/portfolio/.claude/worktrees/blog-subsystem
mkdir -p scripts/lib tests/lib
cp "$SRC"/scripts/lib/vault.mjs        scripts/lib/
cp "$SRC"/scripts/lib/frontmatter.mjs  scripts/lib/
cp "$SRC"/scripts/lib/assets.mjs       scripts/lib/
cp "$SRC"/scripts/lib/revisions.mjs    scripts/lib/
cp "$SRC"/scripts/lib/status-note.mjs  scripts/lib/
cp "$SRC"/tests/lib/vault.test.mjs        tests/lib/
cp "$SRC"/tests/lib/frontmatter.test.mjs  tests/lib/
cp "$SRC"/tests/lib/assets.test.mjs       tests/lib/
cp "$SRC"/tests/lib/revisions.test.mjs    tests/lib/
cp "$SRC"/tests/lib/status-note.test.mjs  tests/lib/
cp "$SRC"/blog.config.json .
```

Do not edit these files. They are proven; the tests that come with them are the proof.

- [ ] **Step 5: Add the local config to `.gitignore`**

This repo has no blanket image rules, so no negation is needed. Append:

```
.blog.local.json
```

- [ ] **Step 6: Run the ported suite**

Run: `pnpm test`
Expected: **58 tests pass** across 5 suites (vault 9, frontmatter 16, assets 21, revisions 6, status-note 6). The gitignore suite from the source repo is deliberately not ported — it asserted negation rules that this repo does not need.

If any test fails, the port is wrong. Do not edit the module to make a test pass; re-copy the file.

- [ ] **Step 7: Confirm the site still builds**

Run: `pnpm build`
Expected: succeeds, unchanged from before this task.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts blog.config.json .gitignore scripts tests
git commit -m "feat(blog): port the content-ingest stage and add vitest"
```

---

## Task 2: The sync and check CLIs

Wires Task 1's modules into two commands. Dry-run by default; only `--prune` deletes; never auto-commits.

**Files:**
- Create: `scripts/lib/plan-sync.mjs`, `scripts/sync-posts.mjs`, `scripts/check-posts.mjs`
- Create: `tests/lib/plan-sync.test.mjs`

**Interfaces:**
- Consumes: every export listed in Task 1
- Produces: `buildSyncPlan({ repoRoot, vaultRoot, config, today, hostLabel, noUpdated }) -> { posts, errors, warnings, orphans }`
  - `posts[]`: `{ slug, title, sourcePath, targetPath, manifestPath, repoAssetDir, status, proposedUpdated, words, readingTimeMinutes, date, updated, syncedAt, assets, frontmatterWrites, body }`

All decision logic lives in the pure planner so it is testable without touching disk. The CLIs are thin shells.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/plan-sync.test.mjs`.

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/lib/plan-sync.test.mjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `scripts/lib/plan-sync.mjs`**

```js
import { readFileSync } from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { listPostFiles, postsDir } from './vault.mjs'
import { parsePost, hashBody, validateFrontmatter, deriveStatus, slugify } from './frontmatter.mjs'
import { proposeUpdated } from './revisions.mjs'
import { findEmbeds, resolveAsset, loadManifest, findOrphans } from './assets.mjs'

const WORDS_PER_MINUTE = 225

export const countWords = (body) => body.split(/\s+/).filter(Boolean).length
export const readingTime = (body) => Math.max(1, Math.round(countWords(body) / WORDS_PER_MINUTE))

export function buildSyncPlan({ repoRoot, vaultRoot, config, today, hostLabel, noUpdated = false }) {
  const errors = []
  const warnings = []
  const orphans = []
  const posts = []
  const seenSlugs = new Map()

  for (const sourcePath of listPostFiles({ vaultRoot, config })) {
    const name = basename(sourcePath)
    const { data, body } = parsePost(readFileSync(sourcePath, 'utf8'))

    const fieldErrors = validateFrontmatter(data, config.requiredFrontmatter)
    for (const e of fieldErrors) errors.push(`${name}: ${e}`)
    if (fieldErrors.length > 0) continue

    const slug = data.slug ? slugify(data.slug) : slugify(data.title)
    if (seenSlugs.has(slug)) {
      errors.push(`${name}: duplicate slug "${slug}", already used by ${seenSlugs.get(slug)}`)
      continue
    }
    seenSlugs.set(slug, name)

    const bodyHash = hashBody(body)
    const status = deriveStatus({ data, bodyHash })
    const proposedUpdated = proposeUpdated({ data, bodyHash, today, noUpdated })

    const repoAssetDir = join(repoRoot, 'public', 'blog', slug)
    const manifestPath = join(repoRoot, 'src', 'content', 'posts', `${slug}.assets.json`)
    const manifest = loadManifest(manifestPath)

    const embeds = findEmbeds(body)
    const assets = []
    for (const embed of embeds) {
      const resolution = resolveAsset({
        filename: embed.filename,
        vaultDir: dirname(sourcePath),
        repoAssetDir,
        manifest,
      })
      resolution.alt = embed.alt
      resolution.raw = embed.raw

      if (resolution.action === 'missing') {
        errors.push(
          `${name}: image "${embed.filename}" is not in the vault on this machine and not ` +
            `committed to the repo. Publish from the machine that has it, or remove the embed.`,
        )
      } else if (resolution.action === 'reuse') {
        warnings.push(
          `${name}: "${embed.filename}" not present on this host; reusing the copy ingested ` +
            `from '${resolution.entry.ingestedFrom}'.`,
        )
      } else if (resolution.stale) {
        warnings.push(`${name}: "${embed.filename}" changed since the last sync; re-ingesting.`)
      }
      assets.push(resolution)
    }

    for (const orphan of findOrphans({ manifest, referenced: embeds.map((e) => e.filename) })) {
      orphans.push(`${slug}/${orphan}`)
    }

    const frontmatterWrites = {
      ...data,
      status,
      synced_at: new Date().toISOString(),
      synced_hash: bodyHash,
    }
    if (proposedUpdated) frontmatterWrites.updated = proposedUpdated

    posts.push({
      slug, title: data.title, sourcePath, manifestPath, repoAssetDir, status, body,
      targetPath: join(repoRoot, 'src', 'content', 'posts', `${slug}.md`),
      proposedUpdated: proposedUpdated ?? null,
      words: countWords(body),
      readingTimeMinutes: readingTime(body),
      date: data.date ?? null,
      updated: proposedUpdated ?? data.updated ?? null,
      syncedAt: data.synced_at ?? null,
      assets, frontmatterWrites,
    })
  }

  if (orphans.length > 0) {
    warnings.push(
      `Orphaned assets (committed but no longer referenced): ${orphans.join(', ')}. ` +
        `They are kept. Remove them with --prune only if you are sure.`,
    )
  }

  return { posts, errors, warnings, orphans, vaultPostsDir: postsDir({ vaultRoot, config }) }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/lib/plan-sync.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 5: Implement `scripts/sync-posts.mjs`**

```js
#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { execFileSync } from 'node:child_process'
import { loadConfig, resolveVaultRoot, hostLabel, postsDir } from './lib/vault.mjs'
import { serializePost } from './lib/frontmatter.mjs'
import { saveManifest, loadManifest, hashFile } from './lib/assets.mjs'
import { buildSyncPlan } from './lib/plan-sync.mjs'
import { renderStatusNote } from './lib/status-note.mjs'

const repoRoot = process.cwd()
const argv = process.argv.slice(2)
const flag = (name) => argv.includes(name)
const fail = (m) => { console.error(`\n✗ ${m}\n`); process.exit(1) }

let config, vaultRoot
try {
  config = loadConfig(repoRoot)
  vaultRoot = resolveVaultRoot({ argv, env: process.env, repoRoot })
} catch (err) { fail(err.message) }

const today = new Date().toISOString().slice(0, 10)
const plan = buildSyncPlan({
  repoRoot, vaultRoot, config, today,
  hostLabel: hostLabel(repoRoot),
  noUpdated: flag('--no-updated'),
})

console.log(`\nVault: ${vaultRoot}\nFolder: ${config.postsFolder}\n`)
for (const post of plan.posts) {
  const marks = []
  if (post.status === 'draft') marks.push('DRAFT, not published')
  if (post.proposedUpdated) marks.push(`updated -> ${post.proposedUpdated}`)
  console.log(`  ${post.slug}  (${post.words} words, ${post.readingTimeMinutes} min)` +
    (marks.length ? `  [${marks.join('; ')}]` : ''))
  for (const a of post.assets) {
    const verb = a.action === 'ingest' ? (a.stale ? 'update' : 'copy') : 'reuse'
    console.log(`      ${verb}  ${a.filename}`)
  }
}
for (const w of plan.warnings) console.log(`\n  ⚠ ${w}`)
if (plan.errors.length > 0) {
  for (const e of plan.errors) console.error(`\n  ✗ ${e}`)
  fail(`${plan.errors.length} error(s). Nothing was written.`)
}

if (!flag('--yes')) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question('\nWrite these changes? [y/N] ')
  rl.close()
  if (!/^y(es)?$/i.test(answer.trim())) {
    console.log('Aborted. Nothing was written.')
    process.exit(0)
  }
}

mkdirSync(join(repoRoot, 'src', 'content', 'posts'), { recursive: true })
const assetRows = []

for (const post of plan.posts) {
  mkdirSync(post.repoAssetDir, { recursive: true })
  const manifest = loadManifest(post.manifestPath)

  for (const a of post.assets) {
    if (a.action === 'ingest') {
      const target = join(post.repoAssetDir, a.filename)
      copyFileSync(a.sourcePath, target)
      manifest[a.filename] = {
        sha256: hashFile(target),
        bytes: readFileSync(target).length,
        ingestedFrom: hostLabel(repoRoot),
        ingestedAt: new Date().toISOString(),
      }
      // An asset silently matched by .gitignore is a failure with no error message.
      try {
        execFileSync('git', ['check-ignore', '-q', target])
        fail(`${target} is matched by .gitignore and would never be committed.`)
      } catch (err) {
        if (err.status !== 1) throw err
      }
      assetRows.push({ article: post.title, filename: a.filename, where: 'repo + vault' })
    } else {
      assetRows.push({
        article: post.title, filename: a.filename,
        where: `repo only (from ${a.entry.ingestedFrom})`,
      })
    }
  }

  if (flag('--prune')) {
    const referenced = new Set(post.assets.map((a) => a.filename))
    for (const nameKey of Object.keys(manifest)) {
      if (!referenced.has(nameKey)) {
        const target = join(post.repoAssetDir, nameKey)
        if (existsSync(target)) rmSync(target)
        delete manifest[nameKey]
        console.log(`  pruned ${post.slug}/${nameKey}`)
      }
    }
  }

  saveManifest(post.manifestPath, manifest)
  writeFileSync(post.targetPath, serializePost(post.frontmatterWrites, post.body))
  writeFileSync(post.sourcePath, serializePost(post.frontmatterWrites, post.body))
}

writeFileSync(
  join(postsDir({ vaultRoot, config }), config.statusNote),
  renderStatusNote({ posts: plan.posts, assets: assetRows, generatedAt: new Date().toISOString() }),
)

console.log('\n✓ Written. Nothing was committed; review and commit yourself.\n')
```

- [ ] **Step 6: Implement `scripts/check-posts.mjs`**

```js
#!/usr/bin/env node
import { loadConfig, resolveVaultRoot, hostLabel } from './lib/vault.mjs'
import { buildSyncPlan } from './lib/plan-sync.mjs'

const repoRoot = process.cwd()
const argv = process.argv.slice(2)

let config, vaultRoot
try {
  config = loadConfig(repoRoot)
  vaultRoot = resolveVaultRoot({ argv, env: process.env, repoRoot })
} catch (err) {
  console.error(`\n✗ ${err.message}\n`)
  process.exit(1)
}

const plan = buildSyncPlan({
  repoRoot, vaultRoot, config,
  today: new Date().toISOString().slice(0, 10),
  hostLabel: hostLabel(repoRoot),
})

const GLYPH = { synced: '✓', pending: '●', draft: '✎', 'never-synced': '◌' }

console.log(`\nVault: ${vaultRoot}\n`)
for (const p of plan.posts) {
  console.log(`  ${GLYPH[p.status] ?? '?'} ${p.slug}  ${p.status}  (${p.words} words, ${p.readingTimeMinutes} min)`)
  for (const a of p.assets) {
    const where = a.action === 'ingest'
      ? (a.stale ? 'vault differs from manifest' : 'vault + repo')
      : a.action === 'reuse' ? `repo only (from ${a.entry.ingestedFrom})` : 'MISSING'
    console.log(`      ${a.filename}  ${where}`)
  }
}
for (const w of plan.warnings) console.log(`\n  ⚠ ${w}`)
for (const e of plan.errors) console.log(`\n  ✗ ${e}`)
console.log('\nThis command writes nothing.\n')
process.exit(plan.errors.length > 0 ? 1 : 0)
```

- [ ] **Step 7: Run the real pipeline end to end**

```bash
echo '{"vaultPath":"/home/felipe/Documents/Sync","hostLabel":"felipe-desktop"}' > .blog.local.json
pnpm check:posts
```

Expected: reports `arc-routing-for-waste-collection`, status `never-synced`, ~2058 words, ~9 min, no assets, no errors.

- [ ] **Step 8: Sync it in**

```bash
pnpm sync:posts
```

Expected: prints the plan, asks for confirmation, then writes `src/content/posts/arc-routing-for-waste-collection.md` and `Blog/_Sync Status.md` in the vault.

- [ ] **Step 9: Run the full suite**

Run: `pnpm test`
Expected: 67 tests pass (58 ported + 9 new).

- [ ] **Step 10: Commit**

```bash
git add scripts tests package.json src/content
git commit -m "feat(blog): sync:posts and check:posts CLIs"
```

---

## Task 3: Markdown pipeline core

Turns committed Markdown into HTML at build time. The browser ships **zero** parser.

**Files:**
- Create: `plugins/markdown-pipeline.mjs`, `tests/markdown/pipeline.test.mjs`

**Interfaces:**
- Produces: `renderMarkdown(body, { slug, readAsset }) -> Promise<{ html, toc }>`
  - `toc: { id: string, text: string, depth: number, numeral: string | null }[]`
  - `readAsset(publicPath) -> string | null`, defaulting to `() => null`

- [ ] **Step 1: Install the pipeline dependencies**

```bash
pnpm add -D unified@11.0.5 remark-parse@11.0.0 remark-gfm@4.0.0 remark-math@6.0.0 \
  remark-rehype@11.1.1 rehype-raw@7.0.0 rehype-katex@7.0.1 rehype-slug@6.0.0 \
  rehype-autolink-headings@7.1.0 rehype-stringify@10.0.1 \
  unist-util-visit@5.0.0 hast-util-from-html@2.0.3 @shikijs/rehype@1.24.2 katex@0.16.11
```

`rehype-raw` is **not optional**. Task 4's embed plugin emits mdast `html` nodes, which
`remark-rehype` passes through as `raw` nodes. Without `rehype-raw` they never become elements and
Task 5's inline-SVG plugin can never match its own marker.

- [ ] **Step 2: Write the failing test**

Create `tests/markdown/pipeline.test.mjs`.

```js
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test tests/markdown/pipeline.test.mjs`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `plugins/markdown-pipeline.mjs`**

Tasks 4 and 5 add three remark plugins and one rehype plugin to this chain. Write it now with the
imports commented out where those files do not yet exist, and uncomment them in their tasks.

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki from '@shikijs/rehype'
import { visit } from 'unist-util-visit'

function toText(node) {
  if (node.type === 'text') return node.value
  if (!node.children) return ''
  return node.children.map(toText).join('')
}

// Collected after rehype-slug so TOC ids match the ids in the HTML.
function collectToc(sink) {
  return () => (tree) => {
    visit(tree, 'element', (node) => {
      const match = /^h([2-3])$/.exec(node.tagName)
      if (!match) return
      sink.push({
        id: node.properties?.id ?? '',
        text: toText(node).trim(),
        depth: Number(match[1]),
        numeral: node.properties?.['data-numeral'] ?? node.properties?.dataNumeral ?? null,
      })
    })
  }
}

// A wide table must scroll inside its own box; the page body never scrolls sideways.
function wrapTables() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || parent.tagName === 'div') return
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      }
    })
  }
}

export async function renderMarkdown(body, { slug, readAsset } = {}) {
  const toc = []

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    // Task 4 inserts sectionNumeral, obsidianCallout and obsidianEmbed here.
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    // Task 5 inserts inlineSvg here.
    .use(collectToc(toc))
    .use(wrapTables)
    .use(rehypeKatex)
    .use(rehypeShiki, { theme: 'github-dark-default' })
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: { className: ['heading-anchor'], ariaHidden: 'true', tabIndex: -1 },
      content: { type: 'text', value: '¶' },
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(body)

  return { html: String(file), toc }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test tests/markdown/pipeline.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add plugins tests/markdown package.json pnpm-lock.yaml
git commit -m "feat(blog): build-time markdown pipeline"
```

---

## Task 4: Obsidian syntax plugins

`![[embed]]` and `> [!warning]` are neither CommonMark nor GFM, so nothing off the shelf resolves them.

**Files:**
- Create: `plugins/remark/{section-numeral,obsidian-callout,obsidian-embed}.mjs`
- Modify: `plugins/markdown-pipeline.mjs`
- Create: `tests/markdown/obsidian.test.mjs`

**Interfaces:**
- Produces three unified plugin factories: `sectionNumeral()`, `obsidianCallout()`, `obsidianEmbed({ slug })`

- [ ] **Step 1: Write the failing test**

Create `tests/markdown/obsidian.test.mjs`.

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/markdown/obsidian.test.mjs`
Expected: FAIL, embeds render as literal text.

- [ ] **Step 3: Implement `plugins/remark/section-numeral.mjs`**

Runs on mdast before `rehype-slug`, so the slug derives from the cleaned title.

```js
import { visit } from 'unist-util-visit'

const NUMERAL = /^(\d+(?:\.\d+)?)\.?\s+(.*)$/

export default function sectionNumeral() {
  return (tree) => {
    visit(tree, 'heading', (node) => {
      if (node.depth !== 2 && node.depth !== 3) return
      const first = node.children[0]
      if (!first || first.type !== 'text') return

      const match = NUMERAL.exec(first.value)
      if (!match) return

      first.value = match[2]
      node.data = node.data ?? {}
      node.data.hProperties = { ...(node.data.hProperties ?? {}), 'data-numeral': match[1] }
    })
  }
}
```

- [ ] **Step 4: Implement `plugins/remark/obsidian-callout.mjs`**

```js
import { visit } from 'unist-util-visit'

const TYPES = new Set(['note', 'warning', 'tip', 'info'])
const HEADER = /^\[!(\w+)\]\s*(.*)$/

export default function obsidianCallout() {
  return (tree) => {
    visit(tree, 'blockquote', (node) => {
      const first = node.children[0]
      if (!first || first.type !== 'paragraph') return
      const lead = first.children[0]
      if (!lead || lead.type !== 'text') return

      const [firstLine, ...rest] = lead.value.split('\n')
      const match = HEADER.exec(firstLine.trim())
      if (!match) return

      const rawType = match[1].toLowerCase()
      const type = TYPES.has(rawType) ? rawType : 'note'
      const label = match[2].trim()

      lead.value = rest.join('\n').replace(/^\n+/, '')
      if (lead.value === '' && first.children.length === 1) node.children.shift()

      node.data = node.data ?? {}
      node.data.hName = 'aside'
      node.data.hProperties = { className: ['callout', `callout-${type}`] }

      if (label) {
        node.children.unshift({
          type: 'paragraph',
          data: { hProperties: { className: ['callout__label'] } },
          children: [{ type: 'text', value: label }],
        })
      }
    })
  }
}
```

- [ ] **Step 5: Implement `plugins/remark/obsidian-embed.mjs`**

```js
import { visit } from 'unist-util-visit'
import { basename, extname } from 'node:path'

const EMBED = /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g

function escapeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

export default function obsidianEmbed({ slug }) {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent) return
      const only = node.children.length === 1 ? node.children[0] : null
      if (!only || only.type !== 'text') return

      const matches = [...only.value.matchAll(EMBED)]
      if (matches.length === 0) return

      const figures = matches.map((m) => {
        const filename = m[1].trim()
        const alt = escapeAttr((m[2] ?? '').trim() || basename(filename, extname(filename)))
        const isSvg = extname(filename).toLowerCase() === '.svg'
        return {
          type: 'html',
          value: isSvg
            // Marker consumed by the rehype inline-svg plugin in Task 5.
            ? `<div data-inline-svg="/blog/${slug}/${filename}" data-alt="${alt}"></div>`
            : `<figure class="figure figure--wide">` +
              `<img src="/blog/${slug}/${filename}" alt="${alt}" loading="lazy" decoding="async" />` +
              `<figcaption>${alt}</figcaption></figure>`,
        }
      })

      parent.children.splice(index, 1, ...figures)
      return index + figures.length
    })
  }
}
```

- [ ] **Step 6: Wire them into `plugins/markdown-pipeline.mjs`**

Add the imports:

```js
import sectionNumeral from './remark/section-numeral.mjs'
import obsidianCallout from './remark/obsidian-callout.mjs'
import obsidianEmbed from './remark/obsidian-embed.mjs'
```

Replace the `// Task 4 inserts ...` comment with:

```js
    .use(sectionNumeral)
    .use(obsidianCallout)
    .use(obsidianEmbed, { slug })
```

- [ ] **Step 7: Run both markdown suites**

Run: `pnpm test tests/markdown/`
Expected: PASS, 8 + 14 tests.

- [ ] **Step 8: Commit**

```bash
git add plugins tests/markdown
git commit -m "feat(blog): obsidian embeds, callouts and section numerals"
```

---

## Task 5: Inline SVG, sanitized and remapped to Zone A

An Excalidraw export is dark-on-light. Inlined and remapped it becomes Zone A on `#030305` and inherits the page.

**Files:**
- Create: `plugins/rehype/inline-svg.mjs`, `tests/markdown/inline-svg.test.mjs`
- Modify: `plugins/markdown-pipeline.mjs`

**Interfaces:**
- Produces: `inlineSvg({ readAsset })`, a rehype plugin

- [ ] **Step 1: Write the failing test**

Create `tests/markdown/inline-svg.test.mjs`.

```js
import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../../plugins/markdown-pipeline.mjs'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <rect width="400" height="200" fill="#ffffff"/>
  <path d="M0 0 L10 10" stroke="#000000"/>
  <text x="5" y="5" fill="#1e1e1e">node</text>
  <script>alert(1)</script>
  <a href="http://evil.example" onclick="steal()">x</a>
  <image href="http://evil.example/p.png"/>
</svg>`

const render = (md) => renderMarkdown(md, { slug: 'arc', readAsset: () => SVG })

describe('inline svg', () => {
  it('inlines the svg instead of linking it', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).toContain('<svg')
    expect(html).not.toContain('src="/blog/arc/d.svg"')
  })

  it('strips script elements', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
  })

  it('strips event handler attributes', async () => {
    expect((await render('![[d.svg]]')).html).not.toContain('onclick')
  })

  it('strips external references', async () => {
    expect((await render('![[d.svg]]')).html).not.toContain('evil.example')
  })

  it('remaps near-black ink to white', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).toContain('#ffffff')
    expect(html).not.toContain('#000000')
  })

  it('drops the near-white ground so the slab shows through', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).toContain('transparent')
  })

  it('keeps the viewBox and drops fixed width and height', async () => {
    const { html } = await render('![[d.svg]]')
    expect(html).toContain('viewBox="0 0 400 200"')
    expect(html).not.toContain('width="400"')
  })

  it('adds role and a title from the alt text', async () => {
    const { html } = await render('![[d.svg|Routing graph]]')
    expect(html).toContain('role="img"')
    expect(html).toContain('Routing graph')
  })

  it('fails loudly when the asset cannot be read', async () => {
    await expect(renderMarkdown('![[missing.svg]]', { slug: 'arc', readAsset: () => null }))
      .rejects.toThrow(/missing\.svg/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/markdown/inline-svg.test.mjs`
Expected: FAIL, the marker div passes through untouched.

- [ ] **Step 3: Implement `plugins/rehype/inline-svg.mjs`**

```js
import { visit } from 'unist-util-visit'
import { fromHtml } from 'hast-util-from-html'

const FORBIDDEN = new Set(['script', 'foreignobject', 'iframe', 'image', 'use', 'a'])

// Conservative, threshold-based. The article sits on #080810, so near-white
// grounds are dropped rather than repainted and Excalidraw accents become Zone A.
const REMAP = [
  { test: (r, g, b) => r < 60 && g < 60 && b < 60, to: '#ffffff' },
  { test: (r, g, b) => r > 200 && g > 200 && b > 200, to: 'transparent' },
  { test: (r, g, b) => r > 140 && g < 90 && b < 90, to: '#4c8dff' },
]

function parseColor(value) {
  if (typeof value !== 'string') return null
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value.trim().toLowerCase())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function remapColor(value) {
  const rgb = parseColor(value)
  if (!rgb) return value
  for (const rule of REMAP) if (rule.test(...rgb)) return rule.to
  return value
}

function sanitize(node) {
  if (!node.children) return
  node.children = node.children.filter(
    (c) => !(c.type === 'element' && FORBIDDEN.has(c.tagName.toLowerCase())),
  )
  for (const child of node.children) {
    if (child.type !== 'element') continue
    for (const key of Object.keys(child.properties ?? {})) {
      const lower = key.toLowerCase()
      if (lower.startsWith('on')) { delete child.properties[key]; continue }
      if ((lower === 'href' || lower === 'xlinkhref') &&
          /^(https?:)?\/\//.test(String(child.properties[key]))) {
        delete child.properties[key]; continue
      }
      if (['fill', 'stroke', 'color', 'stopcolor'].includes(lower)) {
        child.properties[key] = remapColor(child.properties[key])
      }
      if (lower === 'style') {
        child.properties[key] = String(child.properties[key]).replace(
          /(fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,6})/g,
          (_, prop, col) => `${prop}:${remapColor(col)}`,
        )
      }
    }
    sanitize(child)
  }
}

export default function inlineSvg({ readAsset }) {
  return (tree) => {
    const pending = []
    visit(tree, 'element', (node, index, parent) => {
      const path = node.properties?.['data-inline-svg'] ?? node.properties?.dataInlineSvg
      if (!path) return
      pending.push({ index, parent, path, alt: node.properties['data-alt'] ?? node.properties?.dataAlt ?? '' })
    })

    for (const { index, parent, path, alt } of pending) {
      const raw = readAsset(path)
      if (raw == null) {
        throw new Error(
          `Cannot inline SVG "${path}": the file is not committed to the repo. ` +
            `Run pnpm sync:posts from the machine that has it.`,
        )
      }

      const fragment = fromHtml(raw, { fragment: true, space: 'svg' })
      const svg = fragment.children.find((c) => c.type === 'element' && c.tagName === 'svg')
      if (!svg) throw new Error(`"${path}" does not contain an <svg> root.`)

      sanitize(svg)
      delete svg.properties.width
      delete svg.properties.height
      svg.properties.role = 'img'
      svg.properties.className = ['figure__svg']
      svg.children.unshift({
        type: 'element', tagName: 'title', properties: {},
        children: [{ type: 'text', value: alt }],
      })

      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['figure', 'figure--wide'] },
        children: [
          svg,
          { type: 'element', tagName: 'figcaption', properties: {},
            children: [{ type: 'text', value: alt }] },
        ],
      }
    }
  }
}
```

- [ ] **Step 4: Wire it into `plugins/markdown-pipeline.mjs`**

Add `import inlineSvg from './rehype/inline-svg.mjs'` and replace the `// Task 5 inserts ...`
comment with:

```js
    .use(inlineSvg, { readAsset: readAsset ?? (() => null) })
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test tests/markdown/inline-svg.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add plugins tests/markdown
git commit -m "feat(blog): inline svg with sanitization and zone-a remapping"
```

---

## Task 6: Vite plugin, virtual module and build-time validation

Exposes posts to the build and makes a broken article fail it.

**Files:**
- Create: `plugins/vite-plugin-posts.mjs`, `src/types/posts.d.ts`, `tests/plugins/vite-plugin-posts.test.mjs`
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: `loadPosts({ repoRoot }) -> Promise<Post[]>` (newest first, drafts excluded) and the
  virtual module `virtual:posts` exporting `posts` as both named and default.

- [ ] **Step 1: Write the failing test**

Create `tests/plugins/vite-plugin-posts.test.mjs`.

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/plugins/vite-plugin-posts.test.mjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `plugins/vite-plugin-posts.mjs`**

```js
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { parsePost, validateFrontmatter, slugify } from '../scripts/lib/frontmatter.mjs'
import { findEmbeds, loadManifest, hashFile } from '../scripts/lib/assets.mjs'
import { renderMarkdown } from './markdown-pipeline.mjs'

const REQUIRED = ['title', 'date', 'summary']
const WORDS_PER_MINUTE = 225

function assertHeadingLevels(toc, slug) {
  let previous = 1
  for (const entry of toc) {
    if (entry.depth > previous + 1) {
      throw new Error(
        `[posts] ${slug}: heading level skips from h${previous} to h${entry.depth} at ` +
          `"${entry.text}". Use consecutive levels.`,
      )
    }
    previous = entry.depth
  }
}

export async function loadPosts({ repoRoot }) {
  const dir = join(repoRoot, 'src', 'content', 'posts')
  if (!existsSync(dir)) return []

  const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
  const posts = []
  const seenSlugs = new Map()

  for (const file of files) {
    const name = basename(file, '.md')
    const { data, body } = parsePost(readFileSync(join(dir, file), 'utf8'))

    const errors = validateFrontmatter(data, REQUIRED)
    if (errors.length > 0) throw new Error(`[posts] ${file}: ${errors.join('; ')}`)

    const slug = data.slug ? slugify(data.slug) : name
    if (seenSlugs.has(slug)) {
      throw new Error(`[posts] duplicate slug "${slug}" in ${file} and ${seenSlugs.get(slug)}`)
    }
    seenSlugs.set(slug, file)

    if (data.draft === true) continue

    const assetDir = join(repoRoot, 'public', 'blog', slug)
    const manifest = loadManifest(join(dir, `${slug}.assets.json`))

    for (const embed of findEmbeds(body)) {
      const assetPath = join(assetDir, embed.filename)
      if (!existsSync(assetPath)) {
        throw new Error(
          `[posts] ${file}: asset "${embed.filename}" is referenced but not committed at ` +
            `public/blog/${slug}/. Run pnpm sync:posts from the machine that has it.`,
        )
      }
      const recorded = manifest[embed.filename]
      if (recorded?.sha256 && recorded.sha256 !== hashFile(assetPath)) {
        throw new Error(
          `[posts] ${file}: asset "${embed.filename}" hash does not match the manifest. ` +
            `The committed file changed outside sync:posts. Re-run pnpm sync:posts.`,
        )
      }
    }

    const readAsset = (publicPath) => {
      const abs = join(repoRoot, 'public', publicPath.replace(/^\//, ''))
      return existsSync(abs) ? readFileSync(abs, 'utf8') : null
    }

    const { html, toc } = await renderMarkdown(body, { slug, readAsset })
    assertHeadingLevels(toc, slug)

    const wordCount = body.split(/\s+/).filter(Boolean).length

    posts.push({
      slug,
      title: data.title,
      date: String(data.date),
      updated: data.updated ? String(data.updated) : null,
      summary: data.summary,
      tags: data.tags ?? [],
      revisions: data.revisions ?? [],
      html, toc, wordCount,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
    })
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return posts
}

const VIRTUAL_ID = 'virtual:posts'
const RESOLVED_ID = '\0virtual:posts'

export default function postsPlugin({ repoRoot = process.cwd() } = {}) {
  return {
    name: 'blog-posts',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    async load(id) {
      if (id !== RESOLVED_ID) return
      const posts = await loadPosts({ repoRoot })
      return `export const posts = ${JSON.stringify(posts)};\nexport default posts;\n`
    },
    configureServer(server) {
      const dir = join(repoRoot, 'src', 'content', 'posts')
      server.watcher.add(dir)
      server.watcher.on('all', (_event, file) => {
        if (!String(file).startsWith(dir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}
```

- [ ] **Step 4: Create `src/types/posts.d.ts`**

```ts
declare module 'virtual:posts' {
  export type TocEntry = { id: string; text: string; depth: number; numeral: string | null }
  export type Revision = { date: string; note: string }
  export type Post = {
    slug: string
    title: string
    date: string
    updated: string | null
    summary: string
    tags: string[]
    revisions: Revision[]
    html: string
    toc: TocEntry[]
    wordCount: number
    readingTimeMinutes: number
  }
  export const posts: Post[]
  export default posts
}
```

- [ ] **Step 5: Register the plugin in `vite.config.ts`**

Add `import postsPlugin from "./plugins/vite-plugin-posts.mjs";` at the top, and add
`postsPlugin({ repoRoot: __dirname }),` to the `plugins` array **before** `react()`.

Do not touch the existing `manualChunks` function. Its package-boundary regex fixes a real bug
documented in the file.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test tests/plugins/vite-plugin-posts.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 7: Confirm the site still builds**

Run: `pnpm build`
Expected: succeeds. `virtual:posts` is not imported by anything yet, so output is unchanged.

- [ ] **Step 8: Commit**

```bash
git add plugins src/types vite.config.ts tests/plugins
git commit -m "feat(blog): virtual:posts module with build-time validation"
```

---

## Task 7: The reading surface

The slab, the editorial type scale and the two-track grid. Pure CSS, no components yet, so it can be judged on its own.

**Files:**
- Create: `src/blog/article.css`
- Modify: `src/styles/index.css`

**Interfaces:**
- Produces the class contract every later task styles against: `.article`, `.article__slab`,
  `.article__body`, `.table-scroll`, `.callout`, `.callout__label`, `.figure`, `.figure--wide`,
  `.figure__svg`, `.heading-anchor`

- [ ] **Step 1: Create `src/blog/article.css`**

Every token below already exists in `layout.css` or `theme.css`. Do not redefine them.

```css
/**
 * The article is the largest frosted object on the site: a lit document
 * suspended over the same galaxy as everything else.
 *
 * The nav pill can be `bg-white/[0.06]` because it holds six words. A reading
 * surface cannot — stars moving behind body text is the one thing that makes
 * a nine-minute article unreadable. So the slab is a dense #080810 at 80%,
 * and the galaxy stays visible at the margins and through the blur instead.
 */
.article {
  --article-measure: 62ch;
  --article-wide: var(--measure);
  --article-ink: rgba(255, 255, 255, 0.9);
  --article-dim: rgba(255, 255, 255, 0.6);
  --article-faint: rgba(255, 255, 255, 0.4);
  --article-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  padding-inline: var(--gutter);
  padding-block: calc(var(--rhythm-section) * 1.5) var(--rhythm-section);
}

.article__slab {
  max-width: var(--article-wide);
  margin-inline: auto;
  background: rgb(8 8 16 / 0.8);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 2rem;
  box-shadow:
    inset 0 1px 0 0 rgb(255 255 255 / 0.08),
    0 24px 80px rgb(0 0 0 / 0.5);
  padding: clamp(1.75rem, 5vw, 4rem) 0;
}

/* Two tracks: prose locks to the measure, figures and code break out wider. */
.article__body {
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--gutter), 1fr)
    [wide-start] minmax(0, calc((var(--article-wide) - var(--article-measure)) / 2))
    [text-start] min(var(--article-measure), 100%) [text-end]
    minmax(0, calc((var(--article-wide) - var(--article-measure)) / 2)) [wide-end]
    minmax(var(--gutter), 1fr) [full-end];

  font-size: 18px;
  line-height: 1.8;
  font-weight: 400;
  color: var(--article-ink);
}

.article__body > * { grid-column: text; }
.article__body > figure,
.article__body > pre,
.article__body > .table-scroll,
.article__body > .callout { grid-column: wide; }

.article__body > p { margin: 0 0 1.4em; }

/* Headings echo SectionHeading: uppercase, tight tracking, bold. */
.article__body h2 {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  margin: 2.5em 0 0.6em;
  position: relative;
}

.article__body h3 {
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  margin: 2em 0 0.5em;
}

/* Section numerals sit in the margin as slate marks. */
.article__body h2[data-numeral]::before {
  content: attr(data-numeral);
  position: absolute;
  left: -2.75rem;
  top: 0.35em;
  font-family: var(--article-mono);
  font-size: 0.8rem;
  color: var(--article-faint);
}

@media (max-width: 1200px) {
  .article__body h2[data-numeral]::before {
    position: static;
    display: block;
    margin-bottom: 0.4rem;
  }
}

.article__body a {
  color: var(--article-ink);
  text-decoration: underline;
  text-decoration-color: var(--zone-a-1);
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
  transition: color 0.3s;
}
.article__body a:hover { color: var(--zone-a-1); }

.article__body strong { font-weight: 700; color: #fff; }
.article__body ul, .article__body ol { margin: 0 0 1.4em; padding-left: 1.4em; }
.article__body li { margin-bottom: 0.5em; }

.article__body code {
  font-family: var(--article-mono);
  font-size: 0.9em;
  background: rgb(255 255 255 / 0.07);
  border-radius: 4px;
  padding: 0.12em 0.4em;
}

.article__body pre {
  background: rgb(0 0 0 / 0.4);
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  overflow-x: auto;
  margin: 2em 0;
}
.article__body pre code {
  background: none;
  padding: 0;
  font-size: 14px;
  line-height: 1.7;
}

/* Wide content scrolls inside its own box; the page body never scrolls sideways. */
.table-scroll { overflow-x: auto; margin: 2em 0; }
.article__body table { border-collapse: collapse; width: 100%; font-size: 15px; }
.article__body th, .article__body td {
  border-bottom: 1px solid rgb(255 255 255 / 0.1);
  padding: 0.65rem 0.9rem;
  text-align: left;
}
.article__body th {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--article-faint);
}

/* Callouts are operator notes, not decoration. */
.callout {
  background: rgb(255 255 255 / 0.04);
  border: 1px solid rgb(255 255 255 / 0.08);
  border-left: 2px solid var(--zone-a-1);
  border-radius: 0 1rem 1rem 0;
  padding: 1.25rem 1.5rem;
  margin: 2em 0;
}
.callout__label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--article-dim);
  margin: 0 0 0.6rem;
}
.callout > p:last-child { margin-bottom: 0; }

.figure { margin: 2.5em 0; }
.figure img, .figure__svg { width: 100%; height: auto; display: block; border-radius: 1rem; }
.figure figcaption {
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--article-faint);
  margin-top: 0.75rem;
}

.heading-anchor {
  opacity: 0;
  margin-left: 0.4em;
  color: var(--zone-a-1);
  text-decoration: none;
  font-size: 0.6em;
  vertical-align: middle;
}
h2:hover .heading-anchor, h3:hover .heading-anchor, .heading-anchor:focus { opacity: 1; }

.article__body .katex-display { overflow-x: auto; overflow-y: hidden; padding: 0.5em 0; }

@media (prefers-reduced-motion: reduce) {
  .article *, .article *::before { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 2: Import it from `src/styles/index.css`**

Append after the existing imports, so it can override Tailwind base:

```css
@import "../blog/article.css";
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm build`
Expected: succeeds, CSS bundle grows by roughly 3-4 kB.

- [ ] **Step 4: Commit**

```bash
git add src/blog/article.css src/styles/index.css
git commit -m "feat(blog): the reading surface"
```

---

## Task 8: MPA entry, fan-out and the island shell

The routing decision made real: one HTML file per route, chrome mounted as islands, article body never hydrated.

**Files:**
- Create: `blog.html`, `src/blog/main.tsx`, `src/blog/BlogChrome.tsx`, `scripts/fan-out.mjs`
- Modify: `vite.config.ts`, `package.json`
- Create: `tests/fan-out.test.mjs`

**Interfaces:**
- Consumes: `loadPosts` (Task 6)
- Produces:
  - `blog.html` with the exact markers `<!--blog-head-->`, `<!--blog-content-->`, `<!--blog-data-->`
  - `renderRoutes({ repoRoot, dist })` in `scripts/fan-out.mjs`
  - `window.__BLOG__` shape: `{ kind: 'index' | 'article', post?: Post, posts?: PostSummary[] }`
    read from `<script type="application/json" id="blog-data">`

- [ ] **Step 1: Create `blog.html`**

The markers are replaced by the fan-out. Vite injects the built CSS and JS around them.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="preload"
      href="/assets/fonts/space-grotesk-latin.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
    <!--blog-head-->
  </head>
  <body>
    <!-- Chrome islands mount here. The article body below is static and never hydrates. -->
    <div id="blog-chrome"></div>
    <div id="blog-content"><!--blog-content--></div>
    <script type="application/json" id="blog-data"><!--blog-data--></script>
    <script type="module" src="/src/blog/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Add the entry to `vite.config.ts`**

Inside the existing `build` object, alongside `rollupOptions.output`, add an `input`. Keep
`manualChunks` exactly as it is.

```ts
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        blog: path.resolve(__dirname, "blog.html"),
      },
      output: {
        manualChunks(id) { /* unchanged */ },
      },
    },
```

- [ ] **Step 3: Write the failing test**

Create `tests/fan-out.test.mjs`. This tests the pure renderer, not the whole build.

```js
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
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm test tests/fan-out.test.mjs`
Expected: FAIL, module not found.

- [ ] **Step 5: Implement `scripts/fan-out.mjs`**

```js
#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

export const SITE = 'https://felipeleone.dev'

const escapeAttr = (v) =>
  String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;')

// A closing tag inside JSON would end the script element early.
const embedJson = (value) =>
  JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('</script>', '<\\/script>')

function articleHead(post) {
  const url = `${SITE}/blog/${post.slug}`
  const image = `${SITE}/og/${post.slug}.png`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { '@type': 'Person', name: 'Felipe Rodrigues Leone' },
    keywords: post.tags.join(', '),
    inLanguage: 'en',
    image,
    mainEntityOfPage: url,
  }

  return [
    `<title>${escapeAttr(post.title)} — Felipe R. Leone</title>`,
    `<meta name="description" content="${escapeAttr(post.summary)}" />`,
    `<meta property="og:title" content="${escapeAttr(post.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(post.summary)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="article:published_time" content="${post.date}" />`,
    post.updated ? `<meta property="article:modified_time" content="${post.updated}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(post.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(post.summary)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" type="application/rss+xml" href="${SITE}/rss.xml" />`,
    `<script type="application/ld+json">${embedJson(jsonLd)}</script>`,
  ].filter(Boolean).join('\n    ')
}

function indexHead() {
  const url = `${SITE}/blog`
  const title = 'Writing — Felipe R. Leone'
  const description = 'Technical writing on optimization, routing and applied software.'
  return [
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" type="application/rss+xml" href="${SITE}/rss.xml" />`,
  ].join('\n    ')
}

const summarise = (p) => ({
  slug: p.slug, title: p.title, date: p.date, updated: p.updated,
  summary: p.summary, tags: p.tags, readingTimeMinutes: p.readingTimeMinutes,
})

export function renderRoute({ template, kind, post, posts }) {
  const head = kind === 'article' ? articleHead(post) : indexHead()
  const content = kind === 'article' ? post.html : ''
  const data = kind === 'article'
    ? { kind, post: { ...summarise(post), toc: post.toc } }
    : { kind, posts: posts.map(summarise) }

  return template
    .replace('<!--blog-head-->', head)
    .replace('<!--blog-content-->', content)
    .replace('<!--blog-data-->', embedJson(data))
}

export async function renderRoutes({ repoRoot, dist }) {
  const { loadPosts } = await import(join(repoRoot, 'plugins', 'vite-plugin-posts.mjs'))
  const posts = await loadPosts({ repoRoot })

  const templatePath = join(dist, 'blog.html')
  if (!existsSync(templatePath)) {
    throw new Error(`[fan-out] ${templatePath} is missing. Did vite build run with the blog input?`)
  }
  const template = readFileSync(templatePath, 'utf8')

  const write = (relative, html) => {
    const target = join(dist, relative)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, html)
    console.log(`  emitted ${relative}`)
  }

  write('blog/index.html', renderRoute({ template, kind: 'index', posts }))
  for (const post of posts) {
    write(`blog/${post.slug}/index.html`, renderRoute({ template, kind: 'article', post, posts }))
  }

  // The template itself must not ship as a reachable page.
  rmSync(templatePath)

  return posts
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repoRoot = process.cwd()
  const dist = join(repoRoot, 'dist')
  const posts = await renderRoutes({ repoRoot, dist })

  const { writeFeed } = await import('./lib/feed.mjs')
  writeFeed({ posts, dist })

  const { writeOgImages } = await import('./lib/og-image.mjs')
  await writeOgImages({ posts, dist, repoRoot })

  console.log(`\n✓ emitted ${posts.length + 1} blog routes\n`)
}
```

- [ ] **Step 6: Create no-op stubs so Task 8 is independently green**

Task 9 implements these. Without the stubs the dynamic imports throw and nothing is emitted.

`scripts/lib/feed.mjs`:

```js
// Implemented in Task 9.
export function writeFeed() {}
```

`scripts/lib/og-image.mjs`:

```js
// Implemented in Task 9.
export async function writeOgImages() {}
```

- [ ] **Step 7: Implement `src/blog/main.tsx`**

```tsx
import { createRoot } from 'react-dom/client'
import type { Post, TocEntry } from 'virtual:posts'
import '../app/i18n/config'
import '../styles/index.css'
import { BlogChrome } from './BlogChrome'

export type PostSummary = Pick<
  Post, 'slug' | 'title' | 'date' | 'updated' | 'summary' | 'tags' | 'readingTimeMinutes'
>
export type BlogData =
  | { kind: 'article'; post: PostSummary & { toc: TocEntry[] } }
  | { kind: 'index'; posts: PostSummary[] }

const raw = document.getElementById('blog-data')?.textContent
if (!raw) throw new Error('[blog] #blog-data is missing; the fan-out did not run.')
const data = JSON.parse(raw) as BlogData

// The article body is already in the document and is never hydrated.
// React mounts the chrome only.
const container = document.getElementById('blog-chrome')
if (container) createRoot(container).render(<BlogChrome data={data} />)
```

- [ ] **Step 8: Implement a minimal `src/blog/BlogChrome.tsx`**

Tasks 10 and 11 fill in the TOC, masthead and index. This is the shell that proves the island mounts.

```tsx
import { Suspense, lazy } from 'react'
import { useReducedMotion } from 'motion/react'
import { StarField } from '../app/components/shared/StarField'
import { useIsMobile } from '../app/hooks/useIsMobile'
import { useSmoothScroll } from '../app/hooks/useSmoothScroll'
import type { BlogData } from './main'

const LazyGalaxy = lazy(() => import('../app/components/react-bits/Galaxy'))

export function BlogChrome({ data }: { data: BlogData }) {
  useSmoothScroll()
  const isReducedMotion = useReducedMotion()
  const isMobile = useIsMobile()

  // Same rule as AppLayout: the WebGL starfield is the heaviest thing on the
  // page and barely perceptible on a phone.
  const useWebGL = !isMobile && !isReducedMotion

  return (
    <>
      <div className="fixed inset-0 z-0" aria-hidden="true">
        {useWebGL ? (
          <Suspense fallback={<StarField />}>
            <LazyGalaxy
              mouseRepulsion={false}
              mouseInteraction={false}
              density={0.3}
              glowIntensity={0.2}
              numLayers={4}
              saturation={0.2}
              hueShift={240}
            />
          </Suspense>
        ) : (
          <StarField />
        )}
      </div>

      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-[#030305]/10 via-[#030305]/30 to-[#030305]/80"
      />

      <span className="sr-only">{data.kind === 'article' ? data.post.title : 'Writing'}</span>
    </>
  )
}
```

Note `mouseRepulsion` and `mouseInteraction` are **off** here. A starfield that reacts to the pointer
is delightful on a landing page and distracting behind a paragraph someone is reading.

- [ ] **Step 9: Add the build step to `package.json`**

```json
"build": "vite build && node scripts/fan-out.mjs",
"build:client": "vite build"
```

- [ ] **Step 10: Run the tests and a real build**

```bash
pnpm test tests/fan-out.test.mjs
pnpm build
ls -R dist/blog
```

Expected: 6 tests pass. `dist/blog/index.html` exists, `dist/blog/arc-routing-for-waste-collection/index.html`
exists and contains the article prose, and `dist/blog.html` is gone.

- [ ] **Step 11: Verify the article is readable without JavaScript**

```bash
grep -c "waste collection truck" dist/blog/arc-routing-for-waste-collection/index.html
```

Expected: at least 1. The prose is in the document, not fetched.

- [ ] **Step 12: Commit**

```bash
git add blog.html src/blog scripts vite.config.ts package.json tests/fan-out.test.mjs
git commit -m "feat(blog): mpa routes with island chrome"
```

---

## Task 9: RSS and generated OG cards

Both read the same metadata the pages do, so a link unfurl can never disagree with the article.

**Files:**
- Replace: `scripts/lib/feed.mjs`, `scripts/lib/og-image.mjs` (stubs from Task 8)
- Create: `tests/lib/feed.test.mjs`

**Interfaces:**
- Produces: `buildFeed({ posts, site }) -> string`, `writeFeed({ posts, dist })`,
  `writeOgImages({ posts, dist, repoRoot })`

- [ ] **Step 1: Install the image dependencies**

```bash
pnpm add -D satori@0.12.1 @resvg/resvg-js@2.6.2
```

No font download is needed: the site already self-hosts Space Grotesk at
`public/assets/fonts/space-grotesk-latin.woff2`. satori needs a TTF or OTF buffer, so confirm what
is present:

```bash
ls -la public/assets/fonts/
```

If only `.woff2` files exist, add `pnpm add -D woff2-encoder@1.0.5` and decompress at build time, or
place a `.ttf` of the same family at `public/assets/fonts/space-grotesk.ttf`. **Do not add a new
typeface** — this must be the same family the site already ships.

- [ ] **Step 2: Write the failing test**

Create `tests/lib/feed.test.mjs`.

```js
import { describe, it, expect } from 'vitest'
import { buildFeed } from '../../scripts/lib/feed.mjs'

const POSTS = [{
  slug: 'arc', title: 'Arc Routing for Waste Collection', date: '2026-09-02',
  updated: '2026-10-14', summary: 'Why the solvers optimize a different problem.',
  tags: [], revisions: [], html: '<p>x</p>', toc: [],
  wordCount: 2058, readingTimeMinutes: 9,
}]

describe('buildFeed', () => {
  const xml = buildFeed({ posts: POSTS, site: 'https://felipeleone.dev' })

  it('is a valid rss envelope', () => {
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('</rss>')
  })

  it('includes the article with an absolute link', () => {
    expect(xml).toContain('<title>Arc Routing for Waste Collection</title>')
    expect(xml).toContain('<link>https://felipeleone.dev/blog/arc</link>')
  })

  it('carries pubDate and atom:updated so revisions are visible', () => {
    expect(xml).toContain('<pubDate>')
    expect(xml).toContain('<atom:updated>2026-10-14')
  })

  it('escapes xml-special characters in titles', () => {
    const out = buildFeed({ posts: [{ ...POSTS[0], title: 'Cost & <Benefit>' }], site: 'https://x.dev' })
    expect(out).toContain('Cost &amp; &lt;Benefit&gt;')
  })

  it('renders an empty channel without throwing', () => {
    expect(buildFeed({ posts: [], site: 'https://x.dev' })).toContain('</channel>')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test tests/lib/feed.test.mjs`
Expected: FAIL — the stub exports no `buildFeed`.

- [ ] **Step 4: Implement `scripts/lib/feed.mjs`**

```js
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://felipeleone.dev'

const esc = (v) =>
  String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;')

export function buildFeed({ posts, site = SITE }) {
  const items = posts.map((post) => `    <item>
      <title>${esc(post.title)}</title>
      <link>${site}/blog/${post.slug}</link>
      <guid isPermaLink="true">${site}/blog/${post.slug}</guid>
      <description>${esc(post.summary)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <atom:updated>${new Date(post.updated ?? post.date).toISOString()}</atom:updated>
    </item>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Felipe R. Leone — Writing</title>
    <link>${site}/blog</link>
    <description>Technical writing on optimization, routing and applied software.</description>
    <language>en</language>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
}

export function writeFeed({ posts, dist }) {
  mkdirSync(dist, { recursive: true })
  writeFileSync(join(dist, 'rss.xml'), buildFeed({ posts }))
  console.log('  emitted rss.xml')
}
```

- [ ] **Step 5: Implement `scripts/lib/og-image.mjs`**

The card uses this site's identity: `#030305` ground, a Zone A gradient rule, Space Grotesk.

```js
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const W = 1200
const H = 630

function card({ title, meta, fontFamily }) {
  const row = (children, style) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } })
  return {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', backgroundColor: '#030305',
        padding: '72px', fontFamily,
      },
      children: [
        row('FELIPE R. LEONE', { fontSize: 22, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)' }),
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              row('', {
                width: 96, height: 5, marginBottom: 32, borderRadius: 999,
                backgroundImage: 'linear-gradient(90deg, #4c8dff, #8b5cf6)',
              }),
              row(title, {
                fontSize: 66, fontWeight: 700, lineHeight: 1.1,
                color: '#ffffff', letterSpacing: '-0.03em',
              }),
            ],
          },
        },
        row(meta, { fontSize: 22, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }),
      ],
    },
  }
}

function loadFont(repoRoot) {
  const candidates = [
    join(repoRoot, 'public/assets/fonts/space-grotesk.ttf'),
    join(repoRoot, 'public/assets/fonts/SpaceGrotesk-Bold.ttf'),
  ]
  for (const path of candidates) if (existsSync(path)) return readFileSync(path)
  throw new Error(
    `[og] No TTF found for Space Grotesk. satori cannot read woff2. Place a TTF of the family ` +
      `already used by the site at public/assets/fonts/space-grotesk.ttf. Do not add a new typeface.`,
  )
}

export async function writeOgImages({ posts, dist, repoRoot }) {
  if (posts.length === 0) return
  const outDir = join(dist, 'og')
  mkdirSync(outDir, { recursive: true })

  const fontData = loadFont(repoRoot)
  const fonts = [{ name: 'Space Grotesk', weight: 700, style: 'normal', data: fontData }]

  for (const post of posts) {
    const meta = `${post.date.replaceAll('-', '.')} · ${post.readingTimeMinutes} MIN` +
      (post.updated ? ` · REVISED ${post.updated.replaceAll('-', '.')}` : '')

    const svg = await satori(
      card({ title: post.title, meta, fontFamily: 'Space Grotesk' }),
      { width: W, height: H, fonts },
    )
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()
    writeFileSync(join(outDir, `${post.slug}.png`), png)
    console.log(`  emitted og/${post.slug}.png`)
  }
}
```

- [ ] **Step 6: Run the tests and a real build**

```bash
pnpm test tests/lib/feed.test.mjs
pnpm build
ls dist/rss.xml dist/og/
```

Expected: 5 tests pass; `dist/rss.xml` and one PNG per article exist.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib package.json pnpm-lock.yaml tests/lib/feed.test.mjs public/assets/fonts
git commit -m "feat(blog): rss feed and generated og cards"
```

---

## Task 10: Article chrome — masthead, TOC rail, progress

The pieces a reader actually touches.

**Files:**
- Create: `src/blog/components/{ArticleMasthead,SceneListTOC,ReadingProgress,BlogNav}.tsx`
- Modify: `src/blog/BlogChrome.tsx`, `blog.html`
- Create: `tests/ui/masthead.test.tsx`

**Interfaces:**
- Consumes: `BlogData` (Task 8), `PostSummary`
- Produces: `<ArticleMasthead post>`, `<SceneListTOC toc>`, `<ReadingProgress />`, `<BlogNav />`

- [ ] **Step 1: Install the test dependencies**

```bash
pnpm add -D jsdom@25.0.1
```

- [ ] **Step 2: Write the failing test**

Create `tests/ui/masthead.test.tsx`. The dateline is the part with real logic.

```tsx
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test tests/ui/masthead.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `src/blog/components/ArticleMasthead.tsx`**

Title stays in title case: article titles are too long to shout, unlike section headings.

```tsx
import { useTranslation } from 'react-i18next'
import type { PostSummary } from '../main'

const timecode = (iso: string) => iso.replaceAll('-', '.')

export function ArticleMasthead({ post }: { post: PostSummary }) {
  const { t } = useTranslation()

  return (
    <header className="px-[var(--gutter)] pb-10 pt-2 max-w-[62ch] mx-auto">
      {post.tags[0] && (
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/40 mb-5">
          {post.tags[0]}
        </p>
      )}

      <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.1] tracking-tighter text-white">
        {post.title}
      </h1>

      <div
        aria-hidden="true"
        className="mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-[var(--zone-a-1)] to-[var(--zone-a-2)]"
      />

      <p className="mt-6 text-[21px] font-light leading-[1.6] text-white/60">{post.summary}</p>

      <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
        {t('blog.published')}{' '}
        <time dateTime={post.date}>{timecode(post.date)}</time>
        {post.updated && (
          <>
            {' · '}
            <span className="text-[var(--zone-a-1)]">
              {t('blog.revised')} <time dateTime={post.updated}>{timecode(post.updated)}</time>
            </span>
          </>
        )}
        {' · '}
        {t('blog.read_time', { count: post.readingTimeMinutes })}
      </p>
    </header>
  )
}
```

- [ ] **Step 5: Implement `src/blog/components/ReadingProgress.tsx`**

```tsx
import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable <= 0 ? 0 : Math.min(100, (window.scrollY / scrollable) * 100))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[2px]" aria-hidden="true">
      <div
        className="h-full bg-gradient-to-r from-[var(--zone-a-1)] to-[var(--zone-a-2)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Implement `src/blog/components/SceneListTOC.tsx`**

Uses the nav pill's exact glass recipe.

```tsx
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TocEntry } from 'virtual:posts'
import { cn } from '../../app/utils/cn'

const GLASS =
  'border border-white/[0.14] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 ' +
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]'

export function SceneListTOC({ toc }: { toc: TocEntry[] }) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState(toc[0]?.id ?? '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const headings = toc
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) return null

  const list = (
    <ol className="space-y-3">
      {toc.map((entry) => (
        <li key={entry.id} style={{ paddingLeft: entry.depth === 3 ? '0.9rem' : 0 }}>
          <a
            href={`#${entry.id}`}
            aria-current={activeId === entry.id ? 'true' : undefined}
            onClick={() => setOpen(false)}
            className={cn(
              'flex gap-2.5 border-l-2 pl-3 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-300',
              activeId === entry.id
                ? 'border-[var(--zone-a-1)] text-white'
                : 'border-transparent text-white/45 hover:text-white/80',
            )}
          >
            {entry.numeral && <span className="shrink-0 text-white/25">{entry.numeral}</span>}
            <span>{entry.text}</span>
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <>
      <nav
        aria-label={t('blog.contents')}
        className={cn(
          'hidden xl:block fixed left-6 top-1/2 -translate-y-1/2 z-40 w-56 max-h-[70vh] overflow-y-auto rounded-[24px] px-5 py-6',
          GLASS,
        )}
      >
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
          {t('blog.contents')}
        </p>
        {list}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'xl:hidden fixed bottom-6 right-6 z-50 rounded-[40px] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white',
          GLASS,
        )}
      >
        {open ? t('blog.close') : t('blog.contents')}
      </button>

      {open && (
        <nav
          aria-label={t('blog.contents')}
          className="xl:hidden fixed inset-0 z-40 overflow-y-auto bg-[#030305]/95 backdrop-blur-2xl px-8 pb-28 pt-24"
        >
          {list}
        </nav>
      )}
    </>
  )
}
```

- [ ] **Step 7: Implement `src/blog/components/BlogNav.tsx`**

The same frosted pill as `AppLayout`, but its section links leave for the home page.

```tsx
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'

const NAV_ITEMS = [
  { href: '/#about', key: 'nav.about' },
  { href: '/#projects', key: 'nav.projects' },
  { href: '/#experience', key: 'nav.experience' },
  { href: '/#services', key: 'nav.services' },
  { href: '/blog', key: 'nav.blog' },
] as const

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
] as const

export function BlogNav() {
  const { t, i18n } = useTranslation()

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] md:w-max rounded-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="rounded-[40px] border border-white/[0.14] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 px-4 md:px-8 py-2.5 md:py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]">
        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex items-center gap-3 md:gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="group relative whitespace-nowrap text-[9px] md:text-xs font-medium uppercase tracking-[0.05em] md:tracking-[0.2em] text-white/60 transition-colors hover:text-white"
              >
                {t(item.key)}
                <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-gradient-to-r from-[var(--zone-a-1)] to-[var(--zone-a-2)] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex h-4 items-center gap-1.5 md:gap-3 border-l border-white/10 pl-3 md:pl-6">
            {LANGUAGES.map((lang) => {
              const isActive = i18n.language.startsWith(lang.code)
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang.code)}
                  lang={lang.code}
                  title={lang.label}
                  aria-pressed={isActive}
                  className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    isActive ? 'text-[var(--zone-a-1)]' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {lang.code}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
```

- [ ] **Step 8: Wire the chrome together in `src/blog/BlogChrome.tsx`**

Add the imports, then render inside the fragment after the gradient overlay, replacing the
`<span className="sr-only">` placeholder:

```tsx
      <BlogNav />
      {data.kind === 'article' && (
        <>
          <ReadingProgress />
          <SceneListTOC toc={data.post.toc} />
        </>
      )}
```

The masthead is rendered into the document by the fan-out, not here — see Step 9.

- [ ] **Step 9: Render the masthead at build time**

The masthead is static, so it belongs in the emitted HTML rather than in an island. In
`scripts/fan-out.mjs`, import `renderToStaticMarkup` from `react-dom/server` and the masthead
component is **not** available to a `.mjs` script. Instead, emit the masthead markup from
`renderRoute` as a plain template string that mirrors `ArticleMasthead`'s classes, and keep the
React component for tests only. Add to `renderRoute`, before `post.html`:

```js
const timecode = (iso) => iso.replaceAll('-', '.')

function mastheadHtml(post) {
  const revised = post.updated
    ? ` · <span style="color:var(--zone-a-1)">REVISED <time datetime="${post.updated}">${timecode(post.updated)}</time></span>`
    : ''
  return `<header class="article__masthead">
  ${post.tags[0] ? `<p class="article__kicker">${escapeAttr(post.tags[0])}</p>` : ''}
  <h1 class="article__title">${escapeAttr(post.title)}</h1>
  <div class="article__rule" aria-hidden="true"></div>
  <p class="article__lead">${escapeAttr(post.summary)}</p>
  <p class="article__dateline">PUBLISHED <time datetime="${post.date}">${timecode(post.date)}</time>${revised} · ${post.readingTimeMinutes} MIN</p>
</header>`
}
```

Then set `content` for an article to
`` `<article class="article" lang="en"><div class="article__slab">${mastheadHtml(post)}<div class="article__body" id="article-body">${post.html}</div></div></article>` ``

and add the matching classes to `src/blog/article.css` (`.article__masthead`, `.article__kicker`,
`.article__title`, `.article__rule`, `.article__lead`, `.article__dateline`) using the Global
Constraints type scale.

- [ ] **Step 10: Add a skip link to `blog.html`**

Immediately after `<body>`:

```html
    <a href="#article-body" class="skip-link">Skip to article</a>
```

with a `.skip-link` rule in `article.css` that is visually hidden until `:focus`.

- [ ] **Step 11: Run tests and build**

```bash
pnpm test tests/ui/masthead.test.tsx
pnpm build
```

Expected: 5 tests pass; the build emits the article with masthead markup present in the HTML.

- [ ] **Step 12: Commit**

```bash
git add src/blog scripts/fan-out.mjs blog.html tests/ui package.json
git commit -m "feat(blog): masthead, scene-list toc and reading progress"
```

---

## Task 11: The archive index

Reuses this site's components so posts move the way the rest of the site moves.

**Files:**
- Create: `src/blog/components/{PostCard,BlogIndex}.tsx`
- Modify: `src/blog/BlogChrome.tsx`, `scripts/fan-out.mjs`
- Create: `tests/ui/post-card.test.tsx`

**Interfaces:**
- Consumes: `PostSummary`, `GlowCard`, `Section`, `SectionHeading`
- Produces: `<PostCard post index>`, `<BlogIndex posts>`

- [ ] **Step 1: Write the failing test**

Create `tests/ui/post-card.test.tsx`.

```tsx
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
    const html = renderToStaticMarkup(<PostCard post={POST} index={0} />)
    expect(html).toContain('href="/blog/arc"')
  })

  it('shows the title, month timecode and reading time', async () => {
    const { PostCard } = await import('../../src/blog/components/PostCard')
    const html = renderToStaticMarkup(<PostCard post={POST} index={0} />)
    expect(html).toContain('Arc Routing for Waste Collection')
    expect(html).toContain('2026.09')
    expect(html).toContain('9')
  })

  it('marks a revised post', async () => {
    const { PostCard } = await import('../../src/blog/components/PostCard')
    const html = renderToStaticMarkup(<PostCard post={POST} index={0} />)
    expect(html).toContain('REV')
  })

  it('does not mark an unrevised post', async () => {
    const { PostCard } = await import('../../src/blog/components/PostCard')
    const html = renderToStaticMarkup(<PostCard post={{ ...POST, updated: null }} index={0} />)
    expect(html).not.toContain('REV')
  })

  it('numbers the entry', async () => {
    const { PostCard } = await import('../../src/blog/components/PostCard')
    const html = renderToStaticMarkup(<PostCard post={POST} index={0} />)
    expect(html).toContain('01')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/ui/post-card.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/blog/components/PostCard.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { GlowCard } from '../../app/components/shared/GlowCard'
import type { PostSummary } from '../main'

export function PostCard({ post, index }: { post: PostSummary; index: number }) {
  const { t } = useTranslation()
  const month = post.date.slice(0, 7).replace('-', '.')

  return (
    <GlowCard
      glowColor="#4c8dff"
      spotlightColor="rgba(76, 141, 255, 0.12)"
      tilt
      contentClassName="h-full p-7 md:p-9"
    >
      <a href={`/blog/${post.slug}`} className="group block no-underline">
        <p className="mb-4 flex flex-wrap items-center gap-x-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
          <span className="text-white/25">{String(index + 1).padStart(2, '0')}</span>
          <time dateTime={post.date}>{month}</time>
          <span>· {t('blog.read_time', { count: post.readingTimeMinutes })}</span>
          {post.updated && <span className="text-[var(--zone-a-1)]">· REV</span>}
        </p>

        <h3 className="text-[clamp(1.5rem,3vw,2rem)] font-bold leading-[1.15] tracking-tight text-white transition-colors group-hover:text-[var(--zone-a-1)]">
          {post.title}
        </h3>

        <p className="mt-4 max-w-[60ch] text-base font-light leading-relaxed text-white/60">
          {post.summary}
        </p>

        {post.tags.length > 0 && (
          <p className="mt-6 flex flex-wrap gap-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
            {post.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </p>
        )}
      </a>
    </GlowCard>
  )
}
```

- [ ] **Step 4: Implement `src/blog/components/BlogIndex.tsx`**

```tsx
import { PenLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Section } from '../../app/components/shared/Section'
import { SectionHeading } from '../../app/components/shared/SectionHeading'
import { PostCard } from './PostCard'
import type { PostSummary } from '../main'

export function BlogIndex({ posts }: { posts: PostSummary[] }) {
  const { t } = useTranslation()

  return (
    <main className="relative z-10 pt-28">
      <Section id="writing">
        <SectionHeading
          icon={PenLine}
          accent="cold"
          title={t('blog.title')}
          subtitle={t('blog.entries', { count: posts.length })}
        />

        {posts.length === 0 ? (
          <p className="text-lg font-light text-white/60">{t('blog.empty')}</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        )}
      </Section>
    </main>
  )
}
```

- [ ] **Step 5: Render it from `BlogChrome`**

The index has no static body, so unlike the article it IS an island. Add to `BlogChrome.tsx`:

```tsx
      {data.kind === 'index' && <BlogIndex posts={data.posts} />}
```

- [ ] **Step 6: Run tests and build**

```bash
pnpm test tests/ui/post-card.test.tsx
pnpm build
```

Expected: 5 tests pass; `dist/blog/index.html` builds.

- [ ] **Step 7: Commit**

```bash
git add src/blog tests/ui
git commit -m "feat(blog): archive index"
```

---

## Task 12: i18n keys and the site nav

The chrome speaks the reader's language; the article stays English.

**Files:**
- Modify: `src/app/i18n/locales/en.json`, `src/app/i18n/locales/pt.json`, `src/app/AppLayout.tsx`
- Create: `tests/i18n.test.mjs`

**Interfaces:**
- Produces the `blog.*` key set consumed by Tasks 10 and 11:
  `nav.blog`, `blog.title`, `blog.entries`, `blog.empty`, `blog.published`, `blog.revised`,
  `blog.read_time`, `blog.contents`, `blog.close`, `blog.back`

- [ ] **Step 1: Write the failing test**

Create `tests/i18n.test.mjs`. This catches the failure mode where one locale is updated and the other is not.

```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const load = (lang) =>
  JSON.parse(readFileSync(join(process.cwd(), 'src/app/i18n/locales', `${lang}.json`), 'utf8'))

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null && !Array.isArray(v)
      ? flatten(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )

const REQUIRED = [
  'nav.blog', 'blog.title', 'blog.entries', 'blog.empty', 'blog.published',
  'blog.revised', 'blog.read_time', 'blog.contents', 'blog.close', 'blog.back',
]

describe('locales', () => {
  it('define every blog key in English', () => {
    const keys = flatten(load('en'))
    for (const key of REQUIRED) expect(keys).toContain(key)
  })

  it('define every blog key in Portuguese', () => {
    const keys = flatten(load('pt'))
    for (const key of REQUIRED) expect(keys).toContain(key)
  })

  it('have identical key sets, so neither locale drifts', () => {
    expect(flatten(load('en')).sort()).toEqual(flatten(load('pt')).sort())
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/i18n.test.mjs`
Expected: FAIL, `nav.blog` missing.

- [ ] **Step 3: Add the keys to `en.json`**

Add `"blog": "Writing"` inside the existing `nav` object, and a new top-level `blog` object:

```json
  "blog": {
    "title": "Writing",
    "entries": "{{count}} entry",
    "entries_other": "{{count}} entries",
    "empty": "Nothing published yet.",
    "published": "Published",
    "revised": "Revised",
    "read_time": "{{count}} min read",
    "contents": "Contents",
    "close": "Close",
    "back": "Back to writing"
  }
```

- [ ] **Step 4: Add the keys to `pt.json`**

Add `"blog": "Escrita"` inside `nav`, and:

```json
  "blog": {
    "title": "Escrita",
    "entries": "{{count}} artigo",
    "entries_other": "{{count}} artigos",
    "empty": "Nada publicado ainda.",
    "published": "Publicado em",
    "revised": "Revisado em",
    "read_time": "{{count}} min de leitura",
    "contents": "Conteúdo",
    "close": "Fechar",
    "back": "Voltar para a escrita"
  }
```

- [ ] **Step 5: Add the BLOG item to `src/app/AppLayout.tsx`**

`NAV_ITEMS` currently holds `{ id, key }` pairs scrolled to with Lenis. A blog link must navigate
instead. Extend the type and the click handler:

```tsx
const NAV_ITEMS = [
  { id: "about", key: "nav.about" },
  { id: "projects", key: "nav.projects" },
  { id: "experience", key: "nav.experience" },
  { id: "services", key: "nav.services" },
  { href: "/blog", key: "nav.blog" },
] as const;
```

In the map, render an item with `href` as a plain `<a href={item.href}>` with no `onClick`, keeping
the existing className and underline span. Items with `id` keep their current Lenis behaviour
unchanged.

- [ ] **Step 6: Run the tests and check both languages in the browser**

```bash
pnpm test tests/i18n.test.mjs
pnpm build && pnpm preview
```

Expected: 3 tests pass. In the browser, the nav shows the blog item, switching to PT translates the
chrome, and the article body stays English with `lang="en"` on the `<article>`.

- [ ] **Step 7: Commit**

```bash
git add src/app tests/i18n.test.mjs
git commit -m "feat(blog): i18n keys and the site nav entry"
```

---

## Task 13: Vercel config, docs and final verification

**Files:**
- Create: `vercel.json`, `docs/blog-workflow.md`

- [ ] **Step 1: Create `vercel.json`**

No `rewrites` block. Pre-rendering is what removes the need for one.

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false
}
```

- [ ] **Step 2: Write `docs/blog-workflow.md`**

Cover: the four commands (`check:posts`, `sync:posts`, `--no-updated`, `--prune`), the frontmatter
contract, the four status glyphs, how images travel (repo is the durable store; publish from the
machine that has the image the first time), and what each failure message means. Source the content
from spec sections 5.1 through 5.6.

- [ ] **Step 3: Run the whole suite**

Run: `pnpm test`
Expected: all suites pass. Record the total.

- [ ] **Step 4: Verify the production build**

```bash
pnpm build
pnpm preview
```

Check in a browser:
- `/` renders the portfolio exactly as before, galaxy and all
- `/blog` lists one entry using the site's card treatment
- `/blog/arc-routing-for-waste-collection` renders the article
- **A hard refresh on the article URL returns 200, not 404**
- View source shows the prose and the OG tags with JavaScript disabled
- `/rss.xml` parses; `/og/arc-routing-for-waste-collection.png` renders

- [ ] **Step 5: Verify the reading experience by hand**

At 375, 768, 1440 and 1920:
- Body is 18px at a 62ch measure and never touches the slab edge
- Tables and code break out wider and scroll inside themselves; the page never scrolls sideways
- The galaxy is visible at the margins but no star moves behind body text
- The TOC tracks the active section and collapses below `xl`
- Under `prefers-reduced-motion`, `StarField` replaces the galaxy and nothing animates
- Keyboard only: the skip link works, focus rings are visible, the TOC is reachable

- [ ] **Step 6: Confirm the bundle did not regress**

```bash
pnpm build 2>&1 | grep -E "dist/assets/.*\.js"
```

Expected: the main entry's chunks are unchanged from before this work; the blog entry is a separate
chunk. No `react-router` in the output.

- [ ] **Step 7: Publish the article**

Remove `draft: true` from `Blog/Arc Routing for Waste Collection.md` in the vault, then:

```bash
pnpm sync:posts
pnpm build
```

- [ ] **Step 8: Commit**

```bash
git add vercel.json docs/blog-workflow.md src/content
git commit -m "feat(blog): vercel config and workflow docs"
```

---

## Self-Review

**Spec coverage**

| Spec section | Task |
|---|---|
| 5.1–5.2 config, frontmatter, hashing | 1 (ported) |
| 5.3 asset resolution, containment, never-delete | 1 (ported) |
| 5.4 machine asymmetry | 1 (ported), 2 (reporting) |
| 5.5 safety, status note | 1 (ported), 2 (CLIs) |
| 5.6 gitignore | 1 |
| 6.1 pipeline incl. rehype-raw | 3 |
| 6.2 inline SVG | 5 |
| 6.3 build-time validation | 6 |
| 6.4 emitted interface | 6 |
| 7.1 no client router, MPA fan-out | 8 |
| 7.2 islands | 8 |
| 7.3 OG, JSON-LD, RSS, anchors | 3 (anchors), 8 (tags), 9 (RSS, images) |
| 8.2 the slab | 7 |
| 8.3 type scale | 7 |
| 8.4 two-track grid | 7 |
| 8.5 chrome | 10 |
| 8.6 callouts, code, figures | 3, 5, 7 |
| 8.7 index page | 11 |
| 8.8 motion | 8 (pointer interaction off), 10 |
| 8.9 i18n | 12 |
| 8.10 accessibility | 7, 10, verified in 13 |
| 9 file layout | all |
| 10 testing | every task |
| 12 article work | already applied; published in 13 |

No gaps.

**Known execution notes**

1. **Task 9 Step 1 may need a TTF.** satori cannot read woff2, and the site ships woff2 only. The
   step says explicitly: use a TTF of the same family, never a new typeface. If no TTF can be
   produced, drop the OG image and keep the OG tags — the card is the least load-bearing feature here.
2. **Task 10 Step 9 renders the masthead twice by different means** — as a React component for
   tests, and as a template string in the fan-out for the emitted HTML. This is deliberate: the
   masthead is static, so shipping React to render it would defeat the islands decision. The test
   guards the date logic, which is the only part with branching.
3. **`SITE` is hard-coded** to `https://felipeleone.dev` in `scripts/fan-out.mjs` and
   `scripts/lib/feed.mjs`. Change both if the domain differs.

**Type consistency**

`Post`, `TocEntry` and `Revision` are declared once in `src/types/posts.d.ts` (Task 6). `PostSummary`
and `BlogData` are declared once in `src/blog/main.tsx` (Task 8) and imported unchanged by Tasks 10
and 11. `renderMarkdown(body, { slug, readAsset })` keeps that signature from Task 3 onward.
`renderRoute({ template, kind, post, posts })` is stable from Task 8 through Task 11.
