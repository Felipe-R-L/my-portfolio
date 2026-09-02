import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import {
  join, dirname, basename, extname, resolve, sep,
} from 'node:path'

const EMBED = /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g

export function findEmbeds(body) {
  const out = []
  const seen = new Set()
  for (const m of body.matchAll(EMBED)) {
    const filename = m[1].trim()
    if (!filename) continue // `![[   ]]` etc: nothing to resolve, not an error to surface here.
    if (seen.has(filename)) continue
    seen.add(filename)
    out.push({
      raw: m[0],
      filename,
      alt: (m[2] ?? '').trim() || basename(filename, extname(filename)),
    })
  }
  return out
}

export function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

export function loadManifest(path) {
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function saveManifest(path, manifest) {
  mkdirSync(dirname(path), { recursive: true })
  const sorted = {}
  for (const key of Object.keys(manifest).sort()) sorted[key] = manifest[key]
  writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`)
}

/**
 * Resolve `filename` against `dir` and confirm the result is still contained
 * within `dir`. Guards against `../` traversal and absolute-path overrides
 * (path.resolve discards `dir` entirely when `filename` is absolute) — an
 * author-controlled filename must never be able to name a path outside the
 * directory it is meant to be resolved against.
 *
 * Returns the resolved absolute path, or null if it escapes.
 */
function resolveWithin(dir, filename) {
  const base = resolve(dir)
  const candidate = resolve(dir, filename)
  if (candidate === base || candidate.startsWith(base + sep)) return candidate
  return null
}

/** True only for an existing regular file — never throws on a directory or a dangling path. */
function isRegularFile(path) {
  try {
    return existsSync(path) && statSync(path).isFile()
  } catch {
    return false
  }
}

/**
 * Three-step resolution. See spec 5.3.
 *
 * The repo is the durable store; the vault is an opportunistic source.
 * Absence from the vault is NOT information and never authorizes a delete,
 * because it is indistinguishable from "not synced yet", "on another machine"
 * and "excluded by config".
 */
export function resolveAsset({
  filename, vaultDir, repoAssetDir, manifest,
}) {
  const trimmed = typeof filename === 'string' ? filename.trim() : ''
  if (!trimmed) {
    return { action: 'missing', filename, stale: false }
  }

  const vaultPath = resolveWithin(vaultDir, trimmed)
  const repoPath = resolveWithin(repoAssetDir, trimmed)
  // A filename that resolves outside the directory it's meant to live in
  // (e.g. `../escaped.png`) is never followed anywhere. Refuse it outright.
  if (vaultPath === null || repoPath === null) {
    return { action: 'missing', filename, stale: false }
  }

  const recorded = Object.hasOwn(manifest ?? {}, filename) ? manifest[filename] : undefined

  // 1. Present in the vault on this machine (and actually a file, not a directory).
  if (isRegularFile(vaultPath)) {
    const vaultHash = hashFile(vaultPath)
    // "Stale" means the vault copy disagrees with the best-known prior truth.
    // Prefer the actual committed bytes on disk over the manifest record,
    // so a lost/reset manifest can never mask a real divergence.
    let priorHash = null
    if (isRegularFile(repoPath)) {
      priorHash = hashFile(repoPath)
    } else if (recorded && recorded.sha256) {
      priorHash = recorded.sha256
    }
    return {
      action: 'ingest',
      filename,
      sourcePath: vaultPath,
      sha256: vaultHash,
      stale: priorHash !== null && priorHash !== vaultHash,
    }
  }

  // 2. Already committed to the repo. Reuse it and report provenance. Read-only.
  if (isRegularFile(repoPath)) {
    return {
      action: 'reuse',
      filename,
      entry: recorded ?? { sha256: hashFile(repoPath), ingestedFrom: 'unknown-host' },
      stale: false,
    }
  }

  // 3. Nowhere (or not a real file). Never emit a path to a file that does not exist.
  return { action: 'missing', filename, stale: false }
}

export function findOrphans({ manifest, referenced }) {
  // `referenced` failing to be a real array (undefined, null, a scan that
  // errored) carries no information about what's actually referenced — it
  // must never be read as "nothing is referenced, prune it all".
  if (!Array.isArray(referenced)) return []
  const live = new Set(referenced)
  return Object.keys(manifest).filter((name) => !live.has(name)).sort()
}
