import type { VibeResolveParams, VibeResolveResult } from '@/components/viewer-core/useViewer'
import { reactive } from 'vue'

import { fakeMediaItems, fetchFakeMediaPage } from '@/demo/fakeServer'

const FILL_LOOP_PATTERN_RATIOS = [0.32, 0.28]
const TRACKED_RESOLVE_DELAY_MS = 90

export interface CreateFakeFeedResolverOptions {
  failCount?: number
  failPage?: number | string | null
  initialCursor?: number | string | null
}

export type CreateTrackedFakeFeedResolverOptions = CreateFakeFeedResolverOptions

export interface TrackedFakeFeedResolverStatus {
  fillCollectedCount: number
  fillTargetCount: number
  firstLoadedCursor: string | null
  lastLoadedCursor: string | null
  nextCursor: string | null
  phase: string | null
  previousCursor: string | null
}

export interface TrackedFakeFeedResolver {
  clearRemoved: () => void
  remove: (ids: string | string[]) => { ids: string[] }
  resolve: (params: VibeResolveParams) => Promise<VibeResolveResult>
  restore: (ids: string | string[]) => { ids: string[] }
  status: TrackedFakeFeedResolverStatus
  undo: () => { ids: string[] } | null
}

function normalizePage(page: number | string | null | undefined, fallback: number) {
  if (page == null) {
    return fallback
  }

  const parsed = typeof page === 'string' ? Number.parseInt(page, 10) : page

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.floor(parsed)
}

function normalizeIds(ids: string | string[]) {
  return [...new Set(Array.isArray(ids) ? ids : [ids]).values()].filter(Boolean)
}

function clampPageSize(pageSize: number) {
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    return 25
  }

  return Math.floor(pageSize)
}

function createAbortError() {
  try {
    return new DOMException('The operation was aborted.', 'AbortError')
  }
  catch {
    const error = new Error('The operation was aborted.')
    error.name = 'AbortError'
    return error
  }
}

async function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError()
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    const onAbort = () => {
      cleanup()
      reject(createAbortError())
    }

    const cleanup = () => {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onAbort)
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function createDemoPageSizes(pageSize: number) {
  const firstSparsePage = Math.max(1, Math.floor(pageSize * FILL_LOOP_PATTERN_RATIOS[0]))
  const secondSparsePage = Math.max(1, Math.floor(pageSize * FILL_LOOP_PATTERN_RATIOS[1]))
  const thirdSparsePage = Math.max(1, pageSize - firstSparsePage - secondSparsePage)

  return [firstSparsePage, secondSparsePage, thirdSparsePage, pageSize]
}

function getDemoPageSize(page: number, pageSize: number, initialCursor: number) {
  if (page <= initialCursor) {
    return pageSize
  }

  const pattern = createDemoPageSizes(pageSize)
  return pattern[(page - initialCursor - 1) % pattern.length]
}

function getDemoPageStart(page: number, pageSize: number, initialCursor: number) {
  let total = 0

  for (let currentPage = 1; currentPage < page; currentPage += 1) {
    total += getDemoPageSize(currentPage, pageSize, initialCursor)
  }

  return total
}

function sliceDemoPage(page: number, pageSize: number, initialCursor: number, removedIds: Set<string>) {
  const visibleFeed = removedIds.size
    ? fakeMediaItems.filter((item) => !removedIds.has(item.id))
    : fakeMediaItems
  const start = getDemoPageStart(page, pageSize, initialCursor)
  const requestedCount = getDemoPageSize(page, pageSize, initialCursor)
  const items = visibleFeed.slice(start, start + requestedCount)
  const hasNextPage = getDemoPageStart(page + 1, pageSize, initialCursor) < visibleFeed.length

  return {
    items,
    nextPage: hasNextPage ? String(page + 1) : null,
    previousPage: page > 1 ? String(page - 1) : null,
    total: visibleFeed.length,
  }
}

function trackCursorRange(status: TrackedFakeFeedResolverStatus, page: number) {
  const nextCursor = String(page)

  if (status.firstLoadedCursor === null || page < Number.parseInt(status.firstLoadedCursor, 10)) {
    status.firstLoadedCursor = nextCursor
  }

  if (status.lastLoadedCursor === null || page > Number.parseInt(status.lastLoadedCursor, 10)) {
    status.lastLoadedCursor = nextCursor
  }
}

export function createFakeFeedResolver(options: CreateFakeFeedResolverOptions = {}) {
  const initialCursor = normalizePage(options.initialCursor, 1)
  const failPage = options.failPage == null ? null : normalizePage(options.failPage, initialCursor)
  let remainingFailures = failPage == null ? 0 : Math.max(0, Math.floor(options.failCount ?? 1))

  return async function resolve({ cursor, pageSize, signal }: VibeResolveParams): Promise<VibeResolveResult> {
    const page = normalizePage(cursor, initialCursor)

    if (signal?.aborted) {
      throw createAbortError()
    }

    if (failPage !== null && remainingFailures > 0 && page === failPage) {
      remainingFailures -= 1
      throw new Error(`Simulated page ${page} failure.`)
    }

    const response = await fetchFakeMediaPage({
      page,
      pageSize,
    })

    return {
      items: response.items,
      nextPage: response.nextPage,
      previousPage: response.previousPage,
      total: response.totalItems,
    }
  }
}

export function createTrackedFakeFeedResolver(options: CreateTrackedFakeFeedResolverOptions = {}): TrackedFakeFeedResolver {
  const initialCursor = normalizePage(options.initialCursor, 1)
  const failPage = options.failPage == null ? null : normalizePage(options.failPage, initialCursor)
  let remainingFailures = failPage == null ? 0 : Math.max(0, Math.floor(options.failCount ?? 1))
  const removedIds = new Set<string>()
  const removalHistory: string[][] = []
  const status = reactive<TrackedFakeFeedResolverStatus>({
    fillCollectedCount: 0,
    fillTargetCount: 0,
    firstLoadedCursor: null,
    lastLoadedCursor: null,
    nextCursor: null,
    phase: null,
    previousCursor: null,
  })

  return {
    clearRemoved() {
      removedIds.clear()
      removalHistory.length = 0
    },
    remove(ids: string | string[]) {
      const nextIds = normalizeIds(ids).filter((id) => !removedIds.has(id))
      if (!nextIds.length) {
        return { ids: [] }
      }

      for (const id of nextIds) {
        removedIds.add(id)
      }

      removalHistory.push(nextIds)

      return {
        ids: nextIds,
      }
    },
    async resolve({ cursor, pageSize, signal }: VibeResolveParams): Promise<VibeResolveResult> {
      const page = normalizePage(cursor, initialCursor)
      const safePageSize = clampPageSize(pageSize)

      status.phase = 'loading'
      await delay(TRACKED_RESOLVE_DELAY_MS, signal)

      if (failPage !== null && remainingFailures > 0 && page === failPage) {
        remainingFailures -= 1
        status.phase = 'failed'
        throw new Error(`Simulated page ${page} failure.`)
      }

      const response = sliceDemoPage(page, safePageSize, initialCursor, removedIds)

      status.phase = 'loaded'
      trackCursorRange(status, page)
      status.fillCollectedCount = response.items.length
      status.fillTargetCount = safePageSize
      status.nextCursor = response.nextPage
      status.previousCursor = response.previousPage ?? null

      return response
    },
    restore(ids: string | string[]) {
      const nextIds = normalizeIds(ids).filter((id) => removedIds.has(id))
      if (!nextIds.length) {
        return { ids: [] }
      }

      for (const id of nextIds) {
        removedIds.delete(id)
      }

      return {
        ids: nextIds,
      }
    },
    status,
    undo() {
      const nextIds = removalHistory.pop() ?? []
      if (!nextIds.length) {
        return null
      }

      for (const id of nextIds) {
        removedIds.delete(id)
      }

      return {
        ids: nextIds,
      }
    },
  }
}
