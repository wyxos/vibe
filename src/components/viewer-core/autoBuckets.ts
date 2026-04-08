import type { VibeViewerItem } from '../viewer'

import { reconcileVibeOccurrenceKeys } from './itemIdentity'

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
