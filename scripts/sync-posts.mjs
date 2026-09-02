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
