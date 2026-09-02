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
