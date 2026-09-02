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
