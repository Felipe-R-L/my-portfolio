declare module 'virtual:posts' {
  export type TocEntry = { id: string; text: string; depth: number; numeral: string | null }
  export type Revision = { date: string; note: string }
  export type Post = {
    slug: string
    title: string
    date: string
    updated: string | null
    summary: string
    tags: string[]
    revisions: Revision[]
    html: string
    toc: TocEntry[]
    wordCount: number
    readingTimeMinutes: number
  }
  export const posts: Post[]
  export default posts

  // Named PostSummary (not the same symbol as the local `PostSummary` type
  // declared in src/blog/main.tsx) so the two don't shadow each other.
  export type PostListItem = Pick<
    Post, 'slug' | 'title' | 'date' | 'updated' | 'summary' | 'tags' | 'readingTimeMinutes'
  >
  export const summaries: PostListItem[]
}
