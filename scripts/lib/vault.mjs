import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

export class VaultNotConfiguredError extends Error {
  constructor(message) {
    super(message)
    this.name = 'VaultNotConfiguredError'
  }
}

export function loadConfig(repoRoot) {
  const path = join(repoRoot, 'blog.config.json')
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}. This file is committed; restore it from git.`)
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

function readLocalConfig(repoRoot) {
  const path = join(repoRoot, '.blog.local.json')
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    throw new VaultNotConfiguredError(`${path} is not valid JSON: ${err.message}`)
  }
}

export function resolveVaultRoot({ argv = [], env = {}, repoRoot }) {
  let candidate = null
  let origin = null

  const flagIndex = argv.indexOf('--vault')
  if (flagIndex !== -1 && argv[flagIndex + 1]) {
    candidate = argv[flagIndex + 1]
    origin = '--vault flag'
  } else if (env.OBSIDIAN_VAULT) {
    candidate = env.OBSIDIAN_VAULT
    origin = 'OBSIDIAN_VAULT'
  } else {
    const local = readLocalConfig(repoRoot)
    if (local?.vaultPath) {
      candidate = local.vaultPath
      origin = '.blog.local.json'
    }
  }

  if (!candidate) {
    throw new VaultNotConfiguredError(
      'No vault configured. The vault path is machine-specific and is never guessed.\n' +
        'Fix it in one of three ways:\n' +
        '  1. pnpm sync:posts --vault /path/to/vault\n' +
        '  2. export OBSIDIAN_VAULT=/path/to/vault\n' +
        '  3. echo \'{"vaultPath":"/path/to/vault","hostLabel":"this-machine"}\' > .blog.local.json',
    )
  }

  const abs = resolve(candidate)
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    throw new VaultNotConfiguredError(`Vault path from ${origin} does not exist: ${abs}`)
  }
  return abs
}

export function hostLabel(repoRoot) {
  return readLocalConfig(repoRoot)?.hostLabel ?? 'unknown-host'
}

export function postsDir({ vaultRoot, config }) {
  return join(vaultRoot, config.postsFolder)
}

export function listPostFiles({ vaultRoot, config }) {
  const dir = postsDir({ vaultRoot, config })
  if (!existsSync(dir)) {
    throw new VaultNotConfiguredError(
      `Posts folder not found: ${dir}\n` +
        `Create it, or change "postsFolder" in blog.config.json.`,
    )
  }
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .filter((name) => name !== config.statusNote)
    .sort()
    .map((name) => join(dir, name))
}
