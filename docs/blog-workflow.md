# Blog workflow

How articles get from the Obsidian vault into the site. Written for the
author coming back after a few months away, not for a reviewer — if you've
forgotten the details, start here.

## The two commands

There are two CLIs, both run from the repo root, both reading `Blog/` inside
the Obsidian vault:

- **`pnpm check:posts`** — read-only. Shows what would happen on a sync.
  Writes nothing, ever. Safe to run any time, from any machine.
- **`pnpm sync:posts`** — writes. Copies markdown into
  `src/content/posts/<slug>.md`, copies images into `public/blog/<slug>/`,
  updates the asset manifest, and rewrites `Blog/_Sync Status.md` in the
  vault. Shows a dry-run diff first and asks `Write these changes? [y/N]`
  before touching anything — pass `--yes` to skip the prompt (useful in
  scripts, but read the printed plan first the first time).

Neither command ever commits. After a sync, `git diff` / `git add` / commit
by hand, same as any other change.

### Flags

- **`--vault <path>`** — use this vault instead of the configured one.
- **`--no-updated`** — skip proposing an `updated:` frontmatter bump even
  though the body changed. Useful for typo fixes you don't want dated as a
  revision.
- **`--prune`** (sync only) — delete repo-committed images that are no
  longer referenced by any embed. Nothing is ever pruned automatically; see
  "Never-delete" below.
- **`--yes`** (sync only) — skip the confirmation prompt.

The vault root itself is resolved in this order, and is never guessed:
`--vault` flag → `$OBSIDIAN_VAULT` env var → `.blog.local.json` (gitignored,
per-machine: `{"vaultPath": "...", "hostLabel": "..."}`) → hard failure with
instructions for all three.

## Frontmatter contract

Every file in `Blog/*.md` needs:

```yaml
---
title: Arc Routing for Waste Collection
date: 2026-09-02
summary: Why the solvers optimize a different problem.
tags: [optimization, pyvrp]
draft: true
---
```

**Author-owned** (you write these): `title`, `date`, `summary` — required.
Optional: `updated`, `revisions`, `tags`, `slug`, `draft`.

**Tool-owned** (sync writes these; don't hand-edit): `status`, `synced_at`,
`synced_hash`.

`synced_hash` is a hash of the **body only**, not the whole file. This is
deliberate: the tool writes frontmatter back into the file on every sync, so
hashing the whole file would invalidate itself on the very write that
records it. Only prose changes move the status.

`draft: true` keeps an article out of the site entirely (no page, no RSS
entry, no archive card) even after syncing. Remove it — as was done for
"Arc Routing for Waste Collection" itself — when the piece is ready to go
live, then sync and build again.

## Status glyphs

`check:posts` and the sync dry-run both print one of four states per
article, derived from frontmatter + a body hash comparison — never stored
as a fact you could get out of sync with reality:

| Glyph | Meaning |
|---|---|
| `◌` | never synced — no `synced_hash` yet |
| `✎` | draft — `draft: true`, regardless of hash |
| `●` | pending changes — body hash differs from `synced_hash` |
| `✓` | synced — body hash matches `synced_hash` |

## How images travel

**The repo is the durable image store. The vault is an opportunistic
source, never an authority on deletion.**

For every `![[embed]]` in an article, resolution goes, in order:

1. Present in the vault on this machine → ingest (copy + hash it into the
   manifest at `src/content/posts/<slug>.assets.json`).
2. Not in the vault here, but already committed to the repo → reuse the
   committed copy and report where it originally came from.
3. Neither → **hard fail**. The build never silently drops an image.

The practical consequence: **the first time you publish an article with a
new image, run `sync:posts` from the machine that actually has that
image.** Text (the markdown itself) syncs identically from any machine
because it lives in the vault; images only exist where they were created
until the first sync commits them to the repo. After that first sync, any
machine can re-sync the article — the image reuse path (case 2) covers it.

**Never-delete rule.** No code path removes a committed image just because
the vault no longer has it — that would be reading absence as intent, and
absence is ambiguous (it just as easily means "wrong machine" as "please
delete this"). Orphaned images (committed, but no article embeds them any
more) are reported and left alone unless you explicitly pass `--prune`.

## Failure messages, decoded

- **`Missing blog.config.json. This file is committed; restore it from
  git.`** — the committed config is gone or you're not in the repo root.
- **`No vault configured. The vault path is machine-specific and is never
  guessed.`** — set up `.blog.local.json`, `$OBSIDIAN_VAULT`, or pass
  `--vault` (the error message lists all three).
- **`Vault path from <origin> does not exist: <path>`** — the configured
  path is wrong or the vault isn't mounted (e.g. sync not finished on this
  device yet).
- **`missing required frontmatter field: <field>`** — `title`, `date`, or
  `summary` is absent; fill it in.
- **`date is not a parseable ISO date`** — use `YYYY-MM-DD`.
- **`tags must be an array, for example: [optimization, pyvrp]`** /
  **`draft must be true or false`** — fix the YAML type.
- **`duplicate slug "<slug>", already used by <file>`** — two articles
  resolve to the same slug (from `title` or an explicit `slug:`); rename
  one.
- **`image "<file>" is not in the vault on this machine and not committed
  to the repo. Publish from the machine that has it, or remove the
  embed.`** — see "How images travel" above; this is the machine-asymmetry
  case.
- **`"<file>" not present on this host; reusing the copy ingested from
  '<host>'`** — a warning, not an error: everything's fine, the image is
  already committed, sourced from another machine.
- **`"<file>" changed since the last sync; re-ingesting.`** — the vault copy's
  hash no longer matches the manifest (you redrew the diagram); the newer
  version is copied in.
- **`<file> is matched by .gitignore and would never be committed.`** — a
  blanket image-extension ignore rule is swallowing `public/blog/**`; it
  needs a negation there (see `.gitignore`).
- **`Orphaned assets (committed but no longer referenced): ...`** — a
  warning. They're kept; use `--prune` only once you're sure they're
  genuinely unused.

## Publishing checklist

1. Write the article in Obsidian under `Blog/`, with `draft: true` while
   drafting.
2. `pnpm check:posts` any time to see current status without writing
   anything.
3. When ready, remove `draft: true`.
4. From the machine holding any new images: `pnpm sync:posts` (review the
   printed plan, confirm, or pass `--yes`).
5. `pnpm build` to regenerate the static pages, RSS feed and OG card.
6. Review `git diff` (article markdown, `.assets.json` manifest, and any
   new files under `public/blog/`), then commit.
7. Check `Blog/_Sync Status.md` in the vault — it's regenerated on every
   sync as a phone-readable table of every article's state and every
   asset's residency.
