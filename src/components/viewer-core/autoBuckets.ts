import type { VibeViewerItem } from '../viewer'

import { getVibeOccurrenceKey, reconcileVibeOccurrenceKeys } from './itemIdentity'

export interface VibeAutoBucket {
  cursor: string | null
  items: VibeViewerItem[]
  nextCursor: string | null
  previousCursor: string | null
}

export function flattenVibeBuckets(buckets: VibeAutoBucket[]) {
  return buckets.flatMap((bucket) => bucket.items)
}

export function filterRemovedItems(items: VibeViewerItem[], removedIds: Set<string>) {
  if (!removedIds.size) {
    return items
  }

  return items.filter((item) => !removedIds.has(item.id))
}

export function getVibeBucketVisibleItems(bucket: VibeAutoBucket, removedIds: Set<string>) {
  return filterRemovedItems(bucket.items, removedIds)
}

export function getVibeBucketVisibleCount(bucket: VibeAutoBucket, removedIds: Set<string>) {
  return getVibeBucketVisibleItems(bucket, removedIds).length
}

export function getVibeVisibleItemCount(buckets: VibeAutoBucket[], removedIds: Set<string>) {
  return buckets.reduce((count, bucket) => count + getVibeBucketVisibleCount(bucket, removedIds), 0)
}

export function getVibeCursorAtVisibleIndex(
  buckets: VibeAutoBucket[],
  removedIds: Set<string>,
  index: number,
) {
  if (index < 0) {
    return null
  }

  let visibleIndex = 0

  for (const bucket of buckets) {
    const visibleItems = getVibeBucketVisibleItems(bucket, removedIds)
    const nextVisibleIndex = visibleIndex + visibleItems.length

    if (index < nextVisibleIndex) {
      return bucket.cursor
    }

    visibleIndex = nextVisibleIndex
  }

  return null
}

export function replaceVibeBucketAtCursor(
  buckets: VibeAutoBucket[],
  cursor: string | null,
  nextBucket: VibeAutoBucket,
) {
  const nextBuckets = [...buckets]
  const bucketIndex = nextBuckets.findIndex((bucket) => bucket.cursor === cursor)

  if (bucketIndex >= 0) {
    nextBuckets.splice(bucketIndex, 1, nextBucket)
    return nextBuckets
  }

  return nextBuckets
}

export function resolveVibeBucketItems(
  nextItems: VibeViewerItem[],
  previousItems: VibeViewerItem[],
  sequence: number,
) {
  const resolvedItems = reconcileVibeOccurrenceKeys(nextItems, previousItems, sequence)

  return {
    items: resolvedItems.items,
    nextSequence: resolvedItems.nextSequence,
  }
}

export function mergeRefreshedVibeBucketItems(
  nextItems: VibeViewerItem[],
  previousItems: VibeViewerItem[],
  sequence: number,
  edge: 'leading' | 'trailing',
) {
  const availablePreviousMatches = new Map<string, Array<{ index: number, occurrenceKey: string }>>()
  const matchedEntries = nextItems.map((item) => ({
    item,
    matchIndex: null as number | null,
    occurrenceKey: null as string | null,
  }))
  const replacementByPreviousIndex = new Map<number, VibeViewerItem>()
  const insertionsBeforeIndex = new Map<number, VibeViewerItem[]>()
  let nextSequence = sequence

  for (const [index, item] of previousItems.entries()) {
    const nextMatches = availablePreviousMatches.get(item.id)
    const match = {
      index,
      occurrenceKey: getVibeOccurrenceKey(item),
    }

    if (nextMatches) {
      nextMatches.push(match)
    }
    else {
      availablePreviousMatches.set(item.id, [match])
    }
  }

  for (const entry of matchedEntries) {
    const match = availablePreviousMatches.get(entry.item.id)?.shift()

    if (!match) {
      continue
    }

    entry.matchIndex = match.index
    entry.occurrenceKey = match.occurrenceKey
  }

  const previousMatchedIndices: Array<number | null> = []
  let lastMatchedIndex: number | null = null
  for (const entry of matchedEntries) {
    previousMatchedIndices.push(lastMatchedIndex)
    if (entry.matchIndex !== null) {
      lastMatchedIndex = entry.matchIndex
    }
  }

  const nextMatchedIndices = new Array<number | null>(matchedEntries.length).fill(null)
  let nextMatchedIndex: number | null = null
  for (let index = matchedEntries.length - 1; index >= 0; index -= 1) {
    nextMatchedIndices[index] = nextMatchedIndex
    if (matchedEntries[index].matchIndex !== null) {
      nextMatchedIndex = matchedEntries[index].matchIndex
    }
  }

  for (const [index, entry] of matchedEntries.entries()) {
    if (entry.matchIndex !== null && entry.occurrenceKey) {
      replacementByPreviousIndex.set(entry.matchIndex, withOccurrenceKey(entry.item, entry.occurrenceKey))
      continue
    }

    const insertionIndex = nextMatchedIndices[index]
      ?? (previousMatchedIndices[index] !== null ? previousMatchedIndices[index] + 1 : null)
      ?? (edge === 'leading' ? 0 : previousItems.length)
    const nextItem = withOccurrenceKey(entry.item, `vibe-occurrence-${nextSequence += 1}`)
    const nextInsertions = insertionsBeforeIndex.get(insertionIndex)

    if (nextInsertions) {
      nextInsertions.push(nextItem)
    }
    else {
      insertionsBeforeIndex.set(insertionIndex, [nextItem])
    }
  }

  const mergedItems: VibeViewerItem[] = []
  for (let index = 0; index <= previousItems.length; index += 1) {
    const nextInsertions = insertionsBeforeIndex.get(index)
    if (nextInsertions?.length) {
      mergedItems.push(...nextInsertions)
    }

    if (index >= previousItems.length) {
      continue
    }

    mergedItems.push(replacementByPreviousIndex.get(index) ?? previousItems[index])
  }

  return {
    items: mergedItems,
    nextSequence,
  }
}

function withOccurrenceKey(item: VibeViewerItem, occurrenceKey: string) {
  if (getVibeOccurrenceKey(item) === occurrenceKey) {
    return item
  }

  return {
    ...item,
    __vibeOccurrenceKey: occurrenceKey,
  }
}
