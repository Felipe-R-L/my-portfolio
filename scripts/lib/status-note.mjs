const GLYPH = {
  synced: '✓',
  pending: '●',
  draft: '✎',
  'never-synced': '◌',
}

const LABEL = {
  synced: 'synced',
  pending: 'pending changes',
  draft: 'draft',
  'never-synced': 'never synced',
}

function cell(value) {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

// A `|` in free text would otherwise be read as a table column separator,
// silently splitting the row and corrupting every column after it.
function esc(value) {
  return String(value).replaceAll('|', '\\|')
}

export function renderStatusNote({ posts, assets, generatedAt }) {
  const lines = []
  lines.push('# Sync Status')
  lines.push('')
  lines.push('> [!info] Generated file')
  lines.push('> Written by `pnpm sync:posts`. Edits here are overwritten on the next run.')
  lines.push(`> Last generated ${generatedAt}.`)
  lines.push('')
  lines.push('## Articles')
  lines.push('')

  if (posts.length === 0) {
    lines.push('No articles in the posts folder yet.')
  } else {
    lines.push('| | Article | Words | Read | Published | Updated | Status | Last sync |')
    lines.push('|-|---------|-------|------|-----------|---------|--------|-----------|')
    for (const p of posts) {
      lines.push(
        `| ${GLYPH[p.status] ?? '?'} | ${esc(p.title)} | ${p.words} | ${p.readingTimeMinutes} min | ` +
          `${cell(p.date)} | ${cell(p.updated)} | ${LABEL[p.status] ?? p.status} | ${cell(p.syncedAt)} |`,
      )
    }
  }

  lines.push('')
  lines.push('## Assets')
  lines.push('')

  if (assets.length === 0) {
    lines.push('No image embeds referenced.')
  } else {
    lines.push('| Article | Asset | Where |')
    lines.push('|---------|-------|-------|')
    for (const a of assets) {
      lines.push(`| ${esc(a.article)} | ${esc(a.filename)} | ${a.where} |`)
    }
  }

  lines.push('')
  return `${lines.join('\n')}\n`
}
