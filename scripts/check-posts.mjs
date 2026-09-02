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
