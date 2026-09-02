import { visit } from 'unist-util-visit'
import { basename, extname } from 'node:path'

const EMBED = /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g

function escapeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

export default function obsidianEmbed({ slug }) {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent) return
      const only = node.children.length === 1 ? node.children[0] : null
      if (!only || only.type !== 'text') return

      const matches = [...only.value.matchAll(EMBED)]
      if (matches.length === 0) return

      const figures = matches.map((m) => {
        const filename = m[1].trim()
        const alt = escapeAttr((m[2] ?? '').trim() || basename(filename, extname(filename)))
        const isSvg = extname(filename).toLowerCase() === '.svg'
        return {
          type: 'html',
          value: isSvg
            // Marker consumed by the rehype inline-svg plugin in Task 5.
            ? `<div data-inline-svg="/blog/${slug}/${filename}" data-alt="${alt}"></div>`
            : `<figure class="figure figure--wide">` +
              `<img src="/blog/${slug}/${filename}" alt="${alt}" loading="lazy" decoding="async" />` +
              `<figcaption>${alt}</figcaption></figure>`,
        }
      })

      parent.children.splice(index, 1, ...figures)
      return index + figures.length
    })
  }
}
