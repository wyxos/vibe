import type { Ref, ShallowRef } from 'vue'

export type BackfillBatchResult<TItem, TPageToken> = {
  batchItems: TItem[]
  pages: TPageToken[]
  nextPage: TPageToken | null
}

export type BackfillGetContentResult<TItem, TPageToken> = {
  items: TItem[]
  nextPage: TPageToken | null
}

export type BackfillGetContentFn<TItem, TPageToken> = (
  pageToken: TPageToken
) => Promise<BackfillGetContentResult<TItem, TPageToken>>

export type BackfillStatsShape<TPageToken> = {
  enabled: boolean
  isBackfillActive: boolean
  isRequestInFlight: boolean
  requestPage: TPageToken | null
  progress: {
    collected: number
    target: number
  }
  cooldownMsRemaining: number
  cooldownMsTotal: number
  pageSize: number
  bufferSize: number
  lastBatch: {
    startPage: TPageToken | null
    pages: TPageToken[]
    usedFromBuffer: number
    fetchedFromNetwork: number
    collectedTotal: number
    emitted: number
    carried: number
  } | null
  totals: {
    pagesFetched: number
    itemsFetchedFromNetwork: number
  }
}

export function clampPageSize(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1
}

export function clampDelayMs(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export function createBackfillBatchLoader<TItem, TPageToken>(options: {
  getContent: BackfillGetContentFn<TItem, TPageToken>
  markEnterFromLeft: (items: TItem[]) => void
  buffer: Ref<TItem[]>
  stats: ShallowRef<BackfillStatsShape<TPageToken>>
  isEnabled: () => boolean
  getPageSize: () => number
  getRequestDelayMs: () => number
}) {
  async function sleepWithCountdown(ms: number) {
    const total = clampDelayMs(ms)
    if (total <= 0) return

    options.stats.value = {
      ...options.stats.value,
      cooldownMsTotal: total,
      cooldownMsRemaining: total,
    }

    const start = Date.now()
    const tickMs = 100

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - start
        const remaining = Math.max(0, total - elapsed)

        options.stats.value = {
          ...options.stats.value,
          cooldownMsTotal: total,
          cooldownMsRemaining: remaining,
        }

        if (remaining <= 0) {
          clearInterval(interval)
          resolve()
        }
      }, tickMs)
    })
  }

  async function loadBackfillBatch(startPage: TPageToken | null): Promise<BackfillBatchResult<TItem, TPageToken>> {
    const target = clampPageSize(options.getPageSize())

    const enabled = options.isEnabled()
    const delayMs = clampDelayMs(options.getRequestDelayMs())

    // First, use any carryover items from previous backfill fetches.
    const collected: TItem[] = []
    let usedFromBuffer = 0
    if (options.buffer.value.length) {
      usedFromBuffer = options.buffer.value.length
      collected.push(...options.buffer.value)
      options.buffer.value = []
    }

    options.stats.value = {
      ...options.stats.value,
      enabled,
      isBackfillActive: false,
      isRequestInFlight: false,
      requestPage: null,
      cooldownMsTotal: delayMs,
      cooldownMsRemaining: 0,
      progress: {
        collected: 0,
        target: 0,
      },
      pageSize: target,
      bufferSize: 0,
    }

    const pages: TPageToken[] = []
    let next = startPage
    let fetchedFromNetwork = 0

    let isBackfillActive = false

    while (collected.length < target && next != null) {
      const pageToLoad = next

      // Only consider these as "backfill requests" after we have actually
      // determined we're short and need extra pages.
      if (isBackfillActive) {
        options.stats.value = {
          ...options.stats.value,
          enabled,
          isBackfillActive: true,
          isRequestInFlight: true,
          requestPage: pageToLoad,
          progress: {
            collected: Math.min(collected.length, target),
            target,
          },
          cooldownMsTotal: delayMs,
          cooldownMsRemaining: 0,
          pageSize: target,
        }
      }

      const result = await options.getContent(pageToLoad)

      pages.push(pageToLoad)

      if (isBackfillActive) {
        options.stats.value = {
          ...options.stats.value,
          enabled,
          isBackfillActive: true,
          isRequestInFlight: false,
          requestPage: null,
        }
      }

      fetchedFromNetwork += result.items.length

      // Mark for entry animation when these items are eventually rendered.
      options.markEnterFromLeft(result.items)

      collected.push(...result.items)
      next = result.nextPage

      // If we're still short after the first fetch, that is when backfill becomes active.
      if (!isBackfillActive && collected.length < target && next != null) {
        isBackfillActive = true
        options.stats.value = {
          ...options.stats.value,
          enabled,
          isBackfillActive: true,
          isRequestInFlight: false,
          requestPage: null,
          progress: {
            collected: Math.min(collected.length, target),
            target,
          },
          cooldownMsTotal: delayMs,
          cooldownMsRemaining: 0,
          pageSize: target,
        }
      } else if (isBackfillActive) {
        options.stats.value = {
          ...options.stats.value,
          enabled,
          isBackfillActive: true,
          progress: {
            collected: Math.min(collected.length, target),
            target,
          },
        }
      }

      if (isBackfillActive && collected.length < target && next != null) {
        await sleepWithCountdown(delayMs)
      }
    }

    const batchItems = collected.slice(0, target)
    const carry = collected.slice(target)
    options.buffer.value = carry

    options.stats.value = {
      ...options.stats.value,
      enabled,
      isBackfillActive: false,
      isRequestInFlight: false,
      requestPage: null,
      progress: {
        collected: 0,
        target: 0,
      },
      cooldownMsTotal: delayMs,
      cooldownMsRemaining: 0,
      pageSize: target,
      bufferSize: carry.length,
      lastBatch: {
        startPage,
        pages,
        usedFromBuffer,
        fetchedFromNetwork,
        collectedTotal: collected.length,
        emitted: batchItems.length,
        carried: carry.length,
      },
      totals: {
        pagesFetched: options.stats.value.totals.pagesFetched + pages.length,
        itemsFetchedFromNetwork:
          options.stats.value.totals.itemsFetchedFromNetwork + fetchedFromNetwork,
      },
    }

    return { batchItems, pages, nextPage: next }
  }

  return { loadBackfillBatch }
}
