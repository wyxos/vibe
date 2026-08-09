import type { VibeCursor, VibeItem, VibeItemId, VibePage } from '../types'

export interface LoadedPageRecord {
  contributionIds: VibeItemId[]
  cursor: VibeCursor
  next: VibeCursor
  returnedIds: VibeItemId[]
}

export function validatePage(page: VibePage): VibePage {
  if (!page || typeof page !== 'object' || !Array.isArray(page.items)) {
    throw new TypeError('Vibe loadPage must resolve to a page with an items array.')
  }

  if (page.current !== undefined && page.current !== null
    && typeof page.current !== 'string' && typeof page.current !== 'number') {
    throw new TypeError('Vibe page current must be a string, number, null, or undefined.')
  }

  if (page.next !== null && typeof page.next !== 'string' && typeof page.next !== 'number') {
    throw new TypeError('Vibe page next must be a string, number, or null.')
  }

  if (page.total !== undefined && (!Number.isFinite(page.total) || page.total < 0)) {
    throw new TypeError('Vibe page total must be a non-negative number when provided.')
  }

  return page
}

export function appendUniqueItems(
  current: readonly VibeItem[],
  incoming: readonly VibeItem[],
): VibeItem[] {
  const postIds = new Set(current.map((item) => item.postId))

  return [
    ...current,
    ...incoming.filter((item) => {
      if (postIds.has(item.postId)) return false
      postIds.add(item.postId)
      return true
    }),
  ]
}

export function pageCurrentCursor(page: VibePage): VibeCursor {
  return Object.prototype.hasOwnProperty.call(page, 'current')
    ? page.current ?? null
    : page.next
}
