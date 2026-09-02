import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  findEmbeds, hashFile, resolveAsset, findOrphans, loadManifest, saveManifest,
} from '../../scripts/lib/assets.mjs'

let vaultDir, repoAssetDir

beforeEach(() => {
  vaultDir = mkdtempSync(join(tmpdir(), 'vault-'))
  repoAssetDir = mkdtempSync(join(tmpdir(), 'assets-'))
})
afterEach(() => {
  rmSync(vaultDir, { recursive: true, force: true })
  rmSync(repoAssetDir, { recursive: true, force: true })
})

describe('findEmbeds', () => {
  it('finds a bare wikilink embed', () => {
    expect(findEmbeds('text\n![[diagram.svg]]\nmore')).toEqual([
      { raw: '![[diagram.svg]]', filename: 'diagram.svg', alt: 'diagram' },
    ])
  })

  it('supports an explicit alt after a pipe', () => {
    expect(findEmbeds('![[graph.svg|Routing graph]]')[0].alt).toBe('Routing graph')
  })

  it('finds several embeds and de-duplicates repeats', () => {
    const found = findEmbeds('![[a.png]] ![[b.png]] ![[a.png]]')
    expect(found.map((e) => e.filename)).toEqual(['a.png', 'b.png'])
  })

  it('ignores plain wikilinks that are not embeds', () => {
    expect(findEmbeds('see [[Another Note]] here')).toEqual([])
  })

  it('ignores standard markdown images', () => {
    expect(findEmbeds('![alt](/blog/x/diagram.svg)')).toEqual([])
  })
})

describe('resolveAsset', () => {
  it('scenario: present in vault -> ingest', () => {
    writeFileSync(join(vaultDir, 'd.svg'), '<svg/>')
    const r = resolveAsset({ filename: 'd.svg', vaultDir, repoAssetDir, manifest: {} })
    expect(r.action).toBe('ingest')
    expect(r.sourcePath).toBe(join(vaultDir, 'd.svg'))
  })

  it('scenario A: absent everywhere -> missing, never a silent path', () => {
    const r = resolveAsset({ filename: 'gone.svg', vaultDir, repoAssetDir, manifest: {} })
    expect(r.action).toBe('missing')
  })

  it('scenario B: absent in vault but present in repo -> REUSE, never delete', () => {
    writeFileSync(join(repoAssetDir, 'd.svg'), '<svg/>')
    const manifest = {
      'd.svg': { sha256: hashFile(join(repoAssetDir, 'd.svg')), ingestedFrom: 'felipe-desktop' },
    }
    const r = resolveAsset({ filename: 'd.svg', vaultDir, repoAssetDir, manifest })
    expect(r.action).toBe('reuse')
    expect(r.entry.ingestedFrom).toBe('felipe-desktop')
    // The committed file must still be on disk, untouched.
    expect(existsSync(join(repoAssetDir, 'd.svg'))).toBe(true)
  })

  it('scenario C: vault copy differs from the manifest -> ingest, flagged stale', () => {
    writeFileSync(join(repoAssetDir, 'd.svg'), '<svg>old</svg>')
    writeFileSync(join(vaultDir, 'd.svg'), '<svg>new</svg>')
    const manifest = { 'd.svg': { sha256: hashFile(join(repoAssetDir, 'd.svg')) } }
    const r = resolveAsset({ filename: 'd.svg', vaultDir, repoAssetDir, manifest })
    expect(r.action).toBe('ingest')
    expect(r.stale).toBe(true)
  })

  it('does not flag stale when the vault copy is byte-identical', () => {
    writeFileSync(join(repoAssetDir, 'd.svg'), '<svg/>')
    writeFileSync(join(vaultDir, 'd.svg'), '<svg/>')
    const manifest = { 'd.svg': { sha256: hashFile(join(repoAssetDir, 'd.svg')) } }
    expect(resolveAsset({ filename: 'd.svg', vaultDir, repoAssetDir, manifest }).stale)
      .toBe(false)
  })
})

describe('the never-delete rule', () => {
  it('exposes no resolution that deletes a repo asset', () => {
    writeFileSync(join(repoAssetDir, 'd.svg'), '<svg/>')
    for (const manifest of [{}, { 'd.svg': { sha256: 'mismatch' } }]) {
      const r = resolveAsset({ filename: 'd.svg', vaultDir, repoAssetDir, manifest })
      expect(r.action).not.toBe('delete')
      expect(existsSync(join(repoAssetDir, 'd.svg'))).toBe(true)
    }
  })
})

describe('findOrphans', () => {
  it('reports manifest entries no longer referenced', () => {
    const manifest = { 'used.svg': { sha256: 'a' }, 'dropped.svg': { sha256: 'b' } }
    expect(findOrphans({ manifest, referenced: ['used.svg'] })).toEqual(['dropped.svg'])
  })

  it('returns nothing when everything is referenced', () => {
    const manifest = { 'used.svg': { sha256: 'a' } }
    expect(findOrphans({ manifest, referenced: ['used.svg'] })).toEqual([])
  })
})

describe('review round 1 fixes', () => {
  it('finding 1: a filename that escapes vaultDir/repoAssetDir is never followed', () => {
    // The escaped file exists one level above both directories.
    writeFileSync(join(vaultDir, '..', 'escaped.png'), 'evil bytes')
    try {
      const r = resolveAsset({
        filename: '../escaped.png', vaultDir, repoAssetDir, manifest: {},
      })
      expect(r.action).toBe('missing')
      expect(r.sourcePath).toBeUndefined()
    } finally {
      rmSync(join(vaultDir, '..', 'escaped.png'), { force: true })
    }
  })

  it('finding 2: an empty-name embed is skipped by findEmbeds, not surfaced as a file', () => {
    expect(findEmbeds('![[   ]]')).toEqual([])
  })

  it('finding 2: a directory embed resolves to missing instead of throwing EISDIR', () => {
    mkdirSync(join(vaultDir, 'images'))
    expect(() => resolveAsset({
      filename: 'images', vaultDir, repoAssetDir, manifest: {},
    })).not.toThrow()
    const r = resolveAsset({
      filename: 'images', vaultDir, repoAssetDir, manifest: {},
    })
    expect(r.action).toBe('missing')
  })

  it('finding 3: a non-array referenced value never authorizes pruning everything', () => {
    const manifest = { 'a.svg': { sha256: 'x' }, 'b.svg': { sha256: 'y' } }
    expect(findOrphans({ manifest, referenced: undefined })).toEqual([])
    expect(findOrphans({ manifest, referenced: null })).toEqual([])
  })

  it('finding 4: divergent bytes are flagged stale even with an empty/reset manifest', () => {
    writeFileSync(join(repoAssetDir, 'd.svg'), '<svg>old</svg>')
    writeFileSync(join(vaultDir, 'd.svg'), '<svg>new</svg>')
    const r = resolveAsset({
      filename: 'd.svg', vaultDir, repoAssetDir, manifest: {},
    })
    expect(r.action).toBe('ingest')
    expect(r.stale).toBe(true)
  })

  it('finding 5: a filename shadowing Object.prototype does not leak a function as entry', () => {
    writeFileSync(join(repoAssetDir, 'constructor'), 'not a function')
    const r = resolveAsset({
      filename: 'constructor', vaultDir, repoAssetDir, manifest: {},
    })
    expect(r.action).toBe('reuse')
    expect(typeof r.entry).toBe('object')
    expect(typeof r.entry.sha256).toBe('string')
  })
})

describe('manifest io', () => {
  it('returns an empty object for a manifest that does not exist yet', () => {
    expect(loadManifest(join(repoAssetDir, 'none.json'))).toEqual({})
  })

  it('round-trips', () => {
    const p = join(repoAssetDir, 'm.json')
    saveManifest(p, { 'a.svg': { sha256: 'x' } })
    expect(loadManifest(p)).toEqual({ 'a.svg': { sha256: 'x' } })
  })
})
