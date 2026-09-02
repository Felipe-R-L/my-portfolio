import { deriveStatus } from './frontmatter.mjs'

/**
 * Returns the date to record in `updated`, or null to leave it alone.
 * See spec 5.2.1. A draft churns freely; that is not a revision.
 */
export function proposeUpdated({ data, bodyHash, today, noUpdated = false }) {
  if (noUpdated) return null
  if (data.draft === true) return null

  const status = deriveStatus({ data, bodyHash })
  if (status !== 'pending') return null
  if (data.updated === today) return null

  return today
}
