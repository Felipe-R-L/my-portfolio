import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  loadConfig, resolveVaultRoot, listPostFiles, VaultNotConfiguredError,
} from '../../scripts/lib/vault.mjs'

let repo, vault

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'repo-'))
  vault = mkdtempSync(join(tmpdir(), 'vault-'))
  writeFileSync(join(repo, 'blog.config.json'), JSON.stringify({
    postsFolder: 'Blog',
    statusNote: '_Sync Status.md',
    requiredFrontmatter: ['title', 'date', 'summary'],
    assetExtensions: ['.svg', '.png'],
  }))
  mkdirSync(join(vault, 'Blog'))
  writeFileSync(join(vault, 'Blog', 'Post One.md'), '# one')
  writeFileSync(join(vault, 'Blog', 'Post Two.md'), '# two')
  writeFileSync(join(vault, 'Blog', '_Sync Status.md'), 'generated')
  writeFileSync(join(vault, 'Blog', 'notes.txt'), 'not markdown')
  mkdirSync(join(vault, 'Private Notes'))
  writeFileSync(join(vault, 'Private Notes', 'CV.md'), '# secret')
  writeFileSync(join(vault, 'Root Note.md'), '# also secret')
})

afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
  rmSync(vault, { recursive: true, force: true })
})

describe('loadConfig', () => {
  it('reads the committed config', () => {
    expect(loadConfig(repo).postsFolder).toBe('Blog')
  })
})

describe('resolveVaultRoot', () => {
  it('prefers the --vault flag over everything', () => {
    const got = resolveVaultRoot({
      argv: ['--vault', vault], env: { OBSIDIAN_VAULT: '/env/path' }, repoRoot: repo,
    })
    expect(got).toBe(vault)
  })

  it('falls back to OBSIDIAN_VAULT', () => {
    expect(resolveVaultRoot({ argv: [], env: { OBSIDIAN_VAULT: vault }, repoRoot: repo })).toBe(vault)
  })

  it('falls back to .blog.local.json', () => {
    writeFileSync(join(repo, '.blog.local.json'), JSON.stringify({ vaultPath: vault }))
    expect(resolveVaultRoot({ argv: [], env: {}, repoRoot: repo })).toBe(vault)
  })

  it('throws rather than guessing when nothing is configured', () => {
    expect(() => resolveVaultRoot({ argv: [], env: {}, repoRoot: repo }))
      .toThrow(VaultNotConfiguredError)
  })

  it('throws when the configured path does not exist', () => {
    expect(() => resolveVaultRoot({ argv: ['--vault', '/no/such/vault'], env: {}, repoRoot: repo }))
      .toThrow(VaultNotConfiguredError)
  })
})

describe('listPostFiles', () => {
  it('returns only markdown inside the posts folder', () => {
    const files = listPostFiles({ vaultRoot: vault, config: loadConfig(repo) })
    const names = files.map((f) => f.split('/').pop())
    expect(names).toEqual(['Post One.md', 'Post Two.md'])
  })

  it('never reaches notes outside the posts folder', () => {
    const files = listPostFiles({ vaultRoot: vault, config: loadConfig(repo) })
    expect(files.join('|')).not.toContain('CV.md')
    expect(files.join('|')).not.toContain('Root Note.md')
  })

  it('excludes the generated status note', () => {
    const files = listPostFiles({ vaultRoot: vault, config: loadConfig(repo) })
    expect(files.join('|')).not.toContain('_Sync Status.md')
  })
})
