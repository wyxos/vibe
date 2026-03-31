import { clampDelayMs, clampPageSize } from '@/masonry/backfill'
import type { BackfillStats, MasonryItemBase, MasonryRestoredPages, PageToken } from '@/masonry/types'

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError'
}

export function abortError(): Error {
  const err = new Error('aborted')
  err.name = 'AbortError'
  return err
}

export function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function syncNextOriginalIndexFromItems(list: MasonryItemBase[]) {
  let max = -1
  for (const item of list) {
    const originalIndex = item?.originalIndex
    if (isFiniteNumber(originalIndex) && originalIndex > max) {
      max = originalIndex
    }
  }
  return max + 1
}

export function assignOriginalIndices(newItems: MasonryItemBase[], startIndex: number) {
  let nextOriginalIndex = startIndex

  for (const item of newItems) {
    if (!item || typeof item !== 'object') continue
    if (!item.id) continue
    if (item.originalIndex != null) continue
    item.originalIndex = nextOriginalIndex
    nextOriginalIndex += 1
  }

  return nextOriginalIndex
}

export function insertItemsByOriginalIndex(
  current: MasonryItemBase[],
  itemsToInsert: MasonryItemBase[]
) {
  if (!itemsToInsert.length) return current

  const existingIds = new Set<string>()
  for (const item of current) {
    const itemId = item?.id
    if (itemId) existingIds.add(itemId)
  }

  const uniqueToInsert: MasonryItemBase[] = []
  for (const item of itemsToInsert) {
    const itemId = item?.id
    if (!itemId) continue
    if (existingIds.has(itemId)) continue
    uniqueToInsert.push(item)
    existingIds.add(itemId)
  }

  if (!uniqueToInsert.length) return current

  const sorted = uniqueToInsert.slice().sort((a, b) => {
    const aIndex = isFiniteNumber(a.originalIndex) ? a.originalIndex : Number.POSITIVE_INFINITY
    const bIndex = isFiniteNumber(b.originalIndex) ? b.originalIndex : Number.POSITIVE_INFINITY
    return aIndex - bIndex
  })

  const next = current.slice()
  for (const item of sorted) {
    const originalIndex = item.originalIndex
    if (!isFiniteNumber(originalIndex)) {
      next.push(item)
      continue
    }

    let low = 0
    let high = next.length
    while (low < high) {
      const mid = (low + high) >> 1
      const midIndex = next[mid]?.originalIndex
      const midValue = isFiniteNumber(midIndex) ? midIndex : Number.POSITIVE_INFINITY
      if (midValue <= originalIndex) low = mid + 1
      else high = mid
    }
    next.splice(low, 0, item)
  }

  return next
}

export function normalizeRestoredPagesLoaded(input: MasonryRestoredPages): PageToken[] {
  const raw = Array.isArray(input) ? input : [input]
  const unique: PageToken[] = []
  const seen = new Set<string>()

  for (const page of raw) {
    if (page == null) continue
    const key = typeof page === 'string' ? `s:${page}` : `n:${String(page)}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(page)
  }

  return unique
}

export function getMeasuredContainerWidth(el: HTMLElement | null, gapX: number) {
  if (!el) return 0
  const paddingRight = Math.max(0, gapX)
  return Math.max(0, el.clientWidth - paddingRight)
}

export function makeInitialBackfillStats(input: {
  mode: string | undefined
  page: PageToken
  backfillRequestDelayMs: number
  pageSize: number
}): BackfillStats {
  return {
    enabled: input.mode === 'backfill',
    isBackfillActive: false,
    isRequestInFlight: false,
    page: input.page,
    next: input.page,
    progress: {
      collected: 0,
      target: 0,
    },
    cooldownMsRemaining: 0,
    cooldownMsTotal: clampDelayMs(input.backfillRequestDelayMs),
    pageSize: clampPageSize(input.pageSize),
    bufferSize: 0,
    lastBatch: null,
    totals: {
      pagesFetched: 0,
      itemsFetchedFromNetwork: 0,
    },
  }
}
