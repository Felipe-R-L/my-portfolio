import { createRoot } from 'react-dom/client'
import type { Post, TocEntry } from 'virtual:posts'
import '../app/i18n/config'
import '../styles/index.css'
import { BlogChrome } from './BlogChrome'

export type PostSummary = Pick<
  Post, 'slug' | 'title' | 'date' | 'updated' | 'summary' | 'tags' | 'readingTimeMinutes'
>
export type BlogData =
  | { kind: 'article'; post: PostSummary & { toc: TocEntry[] } }
  | { kind: 'index'; posts: PostSummary[] }

const raw = document.getElementById('blog-data')?.textContent
if (!raw) throw new Error('[blog] #blog-data is missing; the fan-out did not run.')
const data = JSON.parse(raw) as BlogData

// The article body is already in the document and is never hydrated.
// React mounts the chrome only.
const container = document.getElementById('blog-chrome')
if (container) createRoot(container).render(<BlogChrome data={data} />)
