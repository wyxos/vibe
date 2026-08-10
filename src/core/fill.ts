import { appendUniqueItems, validatePage, type LoadedPageRecord } from './page'
import type {
  VibeFillOptions,
  VibeFillSessionSnapshot,
  VibeFillState,
  VibeFillTarget,
  VibeCursor,
  VibeFrontendFillOptions,
  VibeItem,
  VibePageLoader,
} from '../types'
import {
  getRequestDelayMs,
  getRequestDelaySnapshot,
  validateRequestDelayOptions,
  waitForRequestDelay,
  type RequestDelaySnapshot,
} from './requestDelay'

export interface FrontendFillProgress {
  completedPages: number
  next: VibeCursor
  received: number
}

export interface FrontendFillCollection extends FrontendFillProgress {
  items: VibeItem[]
  lastCursor: VibeCursor
  pages: LoadedPageRecord[]
  total?: number
}

export interface FrontendFillResult extends FrontendFillCollection {
  status: 'complete' | 'exhausted' | 'paused'
}

interface CollectFrontendFillOptions {
  existingItems: readonly VibeItem[]
  initialCursor: VibeCursor
  loadPage: VibePageLoader
  onCollection?: (collection: FrontendFillCollection) => void
  onDelayChange: (snapshot: RequestDelaySnapshot) => void
  onProgress: (progress: FrontendFillProgress) => void
  options: VibeFrontendFillOptions
  shouldPause?: () => boolean
  signal: AbortSignal
  target: VibeFillTarget
}

function cloneTarget(target: VibeFillTarget): VibeFillTarget {
  if ('items' in target) return { items: target.items }
  return 'pages' in target ? { pages: target.pages } : { until: 'end' }
}

function cursorKey(cursor: VibeCursor): string {
  return `${typeof cursor}:${String(cursor)}`
}

export function validateFillTarget(target: VibeFillTarget): VibeFillTarget {
  if (!target || typeof target !== 'object') {
    throw new TypeError('Vibe fill target must be an object.')
  }
  if ('pages' in target) {
    if (!Number.isInteger(target.pages) || target.pages <= 0) {
      throw new TypeError('Vibe fill pages must be a positive integer.')
    }
    return { pages: target.pages }
  }
  if ('items' in target) {
    if (!Number.isInteger(target.items) || target.items <= 0) {
      throw new TypeError('Vibe fill items must be a positive integer.')
    }
    return { items: target.items }
  }
  if ('until' in target && target.until === 'end') return { until: 'end' }
  throw new TypeError("Vibe fill target must be { items }, { pages }, or { until: 'end' }.")
}

export function validateFillOptions(options?: VibeFillOptions): void {
  if (!options) return
  if (options.strategy === 'frontend') {
    validateRequestDelayOptions(options, 'frontend fill')
    return
  }
  if (!options.feedKey.trim()) {
    throw new TypeError('Vibe backend fill requires a feedKey.')
  }

  const session = options.initialSession
  if (!session) return
  if (session.feedKey !== options.feedKey) {
    throw new TypeError(
      'Vibe backend fill initialSession feedKey must match fill feedKey.',
    )
  }
  validateFillTarget(session.target)
}

export function createFillState(
  options?: VibeFillOptions,
  initialSession?: VibeFillSessionSnapshot,
  useConfiguredSession = true,
): VibeFillState {
  const configured = options?.strategy === 'backend' && useConfiguredSession
    ? options.initialSession
    : undefined
  const session = initialSession ?? configured
  const delay = getRequestDelaySnapshot(session?.nextRequestAt)

  return {
    completedPages: session?.completedPages ?? 0,
    cycleId: session?.cycleId ?? null,
    ...delay,
    enabled: Boolean(options),
    error: session?.error ?? null,
    feedKey: options?.strategy === 'backend' ? options.feedKey : null,
    received: session?.received ?? 0,
    sequence: session?.sequence ?? 0,
    sessionId: session?.sessionId ?? null,
    status: session?.status ?? 'idle',
    strategy: options?.strategy ?? null,
    target: session ? cloneTarget(session.target) : null,
  }
}

export function isFillActive(state: VibeFillState): boolean {
  return ['cancelling', 'filling', 'restoring', 'waiting'].includes(state.status)
}

export async function collectFrontendFill({
  existingItems,
  initialCursor,
  loadPage,
  onCollection = () => undefined,
  onDelayChange,
  onProgress,
  options,
  shouldPause = () => false,
  signal,
  target,
}: CollectFrontendFillOptions): Promise<FrontendFillResult> {
  const items: VibeItem[] = []
  const pages: LoadedPageRecord[] = []
  const knownItems = [...existingItems]
  const seenCursors = new Set<string>()
  let completedPages = 0
  let cursor = initialCursor
  let lastCursor = initialCursor
  let next = initialCursor
  let received = 0
  let total: number | undefined

  if ('items' in target && knownItems.length >= target.items) {
    return { completedPages, items, lastCursor, next, pages, received, status: 'complete' }
  }

  while (next !== null) {
    const key = cursorKey(cursor)
    if (seenCursors.has(key)) throw new Error('Vibe fill received a repeated cursor.')
    seenCursors.add(key)

    await waitForRequestDelay({
      delayMs: getRequestDelayMs(completedPages, options),
      onChange: onDelayChange,
      signal,
    })
    if (completedPages > 0 && shouldPause()) {
      return {
        completedPages,
        items,
        lastCursor,
        next,
        pages,
        received,
        status: 'paused',
        total,
      }
    }

    const page = validatePage(await loadPage({ cursor, signal }))
    completedPages += 1
    lastCursor = cursor
    const combined = appendUniqueItems(knownItems, page.items)
    const additions = combined.slice(knownItems.length)
    pages.push({
      contributionIds: additions.map(({ postId }) => postId),
      cursor,
      next: page.next,
      returnedIds: page.items.map(({ postId }) => postId),
    })
    knownItems.push(...additions)
    items.push(...additions)
    received = items.length
    next = page.next
    if (page.total !== undefined) total = page.total
    onProgress({ completedPages, next, received })
    onCollection({
      completedPages,
      items: [...items],
      lastCursor: cursor,
      next,
      pages: [...pages],
      received,
      total,
    })

    if ('items' in target && knownItems.length >= target.items) {
      return {
        completedPages,
        items,
        lastCursor: cursor,
        next,
        pages,
        received,
        status: 'complete',
        total,
      }
    }

    if ('pages' in target && completedPages >= target.pages) {
      return {
        completedPages,
        items,
        lastCursor: cursor,
        next,
        pages,
        received,
        status: 'complete',
        total,
      }
    }
    if (next === null) {
      return {
        completedPages,
        items,
        lastCursor: cursor,
        next,
        pages,
        received,
        status: 'until' in target ? 'complete' : 'exhausted',
        total,
      }
    }
    if (shouldPause()) {
      return {
        completedPages,
        items,
        lastCursor: cursor,
        next,
        pages,
        received,
        status: 'paused',
        total,
      }
    }
    cursor = next
  }

  return {
    completedPages,
    items,
    lastCursor: cursor,
    next: null,
    pages,
    received,
    status: 'until' in target ? 'complete' : 'exhausted',
    total,
  }
}
