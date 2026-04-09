import type { VibeViewerItem } from '../viewer'
import { filterRemovedItems, getVibeBucketVisibleCount, resolveVibeBucketItems, type VibeAutoBucket } from './autoBuckets'
import { clamp, type VibeAutoDirection } from './autoResolveHelpers'
import { getVibeOccurrenceKey } from './itemIdentity'

export interface VibeCollectedBuckets {
  buckets: VibeAutoBucket[]
  canceled: boolean
  visibleCount: number
}

export interface VibeInitialAutoState {
  activeIndex?: number
  cursor: string | null
  items: VibeViewerItem[]
  nextCursor?: string | null
  previousCursor?: string | null
}

export function isAbortError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }

  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
    return true
  }

  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'ERR_CANCELED'
}

export function createAutoResolveBucket(options: {
  cursor: string | null
  nextCursor: string | null
  nextItems: VibeViewerItem[]
  previousCursor: string | null
  previousItems: VibeViewerItem[]
  sequence: number
}) {
  const resolvedItems = resolveVibeBucketItems(options.nextItems, options.previousItems, options.sequence)

  return {
    bucket: {
      cursor: options.cursor,
      items: resolvedItems.items,
      nextCursor: options.nextCursor,
      previousCursor: options.previousCursor,
    } satisfies VibeAutoBucket,
    nextSequence: resolvedItems.nextSequence,
  }
}

export function finalizeCollectedBuckets(
  buckets: VibeAutoBucket[],
  direction: VibeAutoDirection,
  removedIds: Set<string>,
  canceled: boolean,
): VibeCollectedBuckets | null {
  if (!buckets.length) {
    return canceled ? null : {
      buckets: [],
      canceled,
      visibleCount: 0,
    }
  }

  const orderedBuckets = direction === 'backward'
    ? [...buckets].reverse()
    : buckets

  return {
    buckets: orderedBuckets,
    canceled,
    visibleCount: orderedBuckets.reduce((count, bucket) => {
      return count + getVibeBucketVisibleCount(bucket, removedIds)
    }, 0),
  }
}

export function hydrateAutoResolveState(options: {
  initialState: VibeInitialAutoState
  removedIds: Set<string>
  sequence: number
}) {
  const created = createAutoResolveBucket({
    cursor: options.initialState.cursor,
    nextCursor: options.initialState.nextCursor ?? null,
    nextItems: options.initialState.items,
    previousCursor: options.initialState.previousCursor ?? null,
    previousItems: [],
    sequence: options.sequence,
  })
  const visibleItems = filterRemovedItems(created.bucket.items, options.removedIds)

  return {
    activeIndex: clamp(options.initialState.activeIndex ?? 0, 0, Math.max(0, visibleItems.length - 1)),
    buckets: [created.bucket],
    nextSequence: created.nextSequence,
  }
}

export function getActiveOccurrenceKey(items: VibeViewerItem[], activeIndex: number) {
  const currentItem = items[clamp(activeIndex, 0, Math.max(0, items.length - 1))]
  return currentItem ? getVibeOccurrenceKey(currentItem) : null
}

export function getSyncedActiveIndex(items: VibeViewerItem[], activeIndex: number, anchorOccurrenceKey: string | null = null) {
  if (!items.length) {
    return 0
  }

  const anchoredIndex = anchorOccurrenceKey
    ? items.findIndex((item) => getVibeOccurrenceKey(item) === anchorOccurrenceKey)
    : -1

  return anchoredIndex >= 0
    ? anchoredIndex
    : clamp(activeIndex, 0, items.length - 1)
}

export function isStaticBoundaryUnderfilled(bucket: VibeAutoBucket | null, removedIds: Set<string>, pageSize: number) {
  if (!bucket) {
    return false
  }

  return getVibeBucketVisibleCount(bucket, removedIds) < pageSize
}
