import { getVibeBucketVisibleCount, type VibeAutoBucket } from './autoBuckets'
import type { VibeAutoDirection } from './autoResolveHelpers'

export function findLeadingBoundaryBucket(buckets: VibeAutoBucket[], removedIds: Set<string>) {
  return buckets.find((bucket) => getVibeBucketVisibleCount(bucket, removedIds) > 0) ?? buckets[0] ?? null
}

export function findTrailingBoundaryBucket(buckets: VibeAutoBucket[], removedIds: Set<string>) {
  for (let index = buckets.length - 1; index >= 0; index -= 1) {
    const bucket = buckets[index]

    if (getVibeBucketVisibleCount(bucket, removedIds) > 0) {
      return bucket
    }
  }

  return buckets[buckets.length - 1] ?? null
}

export function getExhaustedNextCursor(bucket: VibeAutoBucket | null) {
  if (!bucket?.nextCursor || !bucket.nextCursorExhausted) {
    return null
  }

  return bucket.nextCursor
}

export function markVibeNextCursorExhausted(
  buckets: VibeAutoBucket[],
  originCursor: string | null | undefined,
  cursor: string | null,
  exhausted: boolean,
) {
  if (originCursor === undefined || cursor === null) return buckets

  return buckets.map((bucket) => {
    if (bucket.cursor !== originCursor || bucket.nextCursor !== cursor) {
      return bucket
    }

    return {
      ...bucket,
      nextCursorExhausted: exhausted,
    }
  })
}

export function resolveCollectedNextCursor(direction: VibeAutoDirection, cursor: string | null, nextPage: string | null) {
  if (nextPage || direction !== 'forward' || cursor === null) {
    return {
      cursor: nextPage,
      exhausted: false,
    }
  }

  return {
    cursor,
    exhausted: true,
  }
}

export function resolveRefreshedNextCursor(bucket: VibeAutoBucket, nextPage: string | null) {
  if (nextPage) {
    return {
      cursor: nextPage,
      exhausted: false,
    }
  }

  const cursor = bucket.nextCursor ?? bucket.cursor

  return {
    cursor,
    exhausted: Boolean(cursor),
  }
}

export function trimVibeBucketsToVisibleWindow(buckets: VibeAutoBucket[], removedIds: Set<string>) {
  const firstVisibleIndex = buckets.findIndex((bucket) => getVibeBucketVisibleCount(bucket, removedIds) > 0)

  if (firstVisibleIndex < 0) {
    return buckets
  }

  let lastVisibleIndex = firstVisibleIndex

  for (let index = buckets.length - 1; index >= firstVisibleIndex; index -= 1) {
    if (getVibeBucketVisibleCount(buckets[index], removedIds) > 0) {
      lastVisibleIndex = index
      break
    }
  }

  return buckets.slice(firstVisibleIndex, lastVisibleIndex + 1)
}
