import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki from '@shikijs/rehype'
import { visit } from 'unist-util-visit'
import sectionNumeral from './remark/section-numeral.mjs'
import obsidianCallout from './remark/obsidian-callout.mjs'
import obsidianEmbed from './remark/obsidian-embed.mjs'
import inlineSvg from './rehype/inline-svg.mjs'

function toText(node) {
  if (node.type === 'text') return node.value
  if (!node.children) return ''
  return node.children.map(toText).join('')
}

// Collected after rehype-slug so TOC ids match the ids in the HTML.
function collectToc(sink) {
  return () => (tree) => {
    visit(tree, 'element', (node) => {
      const match = /^h([2-3])$/.exec(node.tagName)
      if (!match) return
      sink.push({
        id: node.properties?.id ?? '',
        text: toText(node).trim(),
        depth: Number(match[1]),
        numeral: node.properties?.['data-numeral'] ?? node.properties?.dataNumeral ?? null,
      })
    })
  }
}

// A wide table must scroll inside its own box; the page body never scrolls sideways.
function wrapTables() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || parent.tagName === 'div') return
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      }
    })
  }
}

export async function renderMarkdown(body, { slug, readAsset } = {}) {
  const toc = []

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(sectionNumeral)
    .use(obsidianCallout)
    .use(obsidianEmbed, { slug })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(inlineSvg, { readAsset: readAsset ?? (() => null) })
    .use(collectToc(toc))
    .use(wrapTables)
    .use(rehypeKatex)
    .use(rehypeShiki, { theme: 'github-dark-default' })
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: { className: ['heading-anchor'], ariaHidden: 'true', tabIndex: -1 },
      content: { type: 'text', value: '¶' },
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(body)

  return { html: String(file), toc }
}
