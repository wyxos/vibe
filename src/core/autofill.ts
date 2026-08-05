import type {
  VibeAutofillOptions,
  VibeAutofillSessionSnapshot,
  VibeAutofillState,
  VibeCursor,
  VibeFrontendAutofillOptions,
  VibeItem,
  VibePageLoader,
} from '../types'
import type { VibeRuntimeState } from './runtime'
import { appendUniqueItems, validatePage, type LoadedPageRecord } from './page'
import {
  getRequestDelayMs,
  getRequestDelaySnapshot,
  validateRequestDelayOptions,
  waitForRequestDelay,
  type RequestDelaySnapshot,
} from './requestDelay'

export const DEFAULT_MAX_ADDITIONAL_PAGES = 10

export function frontendAutofillRequestLimit(
  options: VibeFrontendAutofillOptions,
  includeInitialRequest = true,
): number {
  if (options.maxAdditionalPages === 'unlimited') return Number.POSITIVE_INFINITY

  const additionalPages = options.maxAdditionalPages ?? DEFAULT_MAX_ADDITIONAL_PAGES
  return additionalPages + (includeInitialRequest ? 1 : 0)
}

export interface FrontendAutofillProgress {
  missing: number
  next: VibeCursor
  received: number
  requests: number
}

export interface FrontendAutofillCollection extends FrontendAutofillProgress {
  items: VibeItem[]
  lastCursor: VibeCursor
  pages: LoadedPageRecord[]
  total?: number
}

export interface FrontendAutofillResult extends FrontendAutofillCollection {
  pages: LoadedPageRecord[]
  status: 'complete' | 'exhausted' | 'paused'
}

interface CollectFrontendAutofillOptions {
  existingItems: readonly VibeItem[]
  initialCursor: VibeCursor
  loadPage: VibePageLoader
  maximumRequests?: number
  onCollection: (collection: FrontendAutofillCollection) => void
  onDelayChange: (snapshot: RequestDelaySnapshot) => void
  onProgress: (progress: FrontendAutofillProgress) => void
  options: VibeFrontendAutofillOptions
  receivedOffset?: number
  requestOffset?: number
  shouldPause?: () => boolean
  signal: AbortSignal
}

function cursorKey(cursor: VibeCursor): string {
  return `${typeof cursor}:${String(cursor)}`
}

function positiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`Vibe ${name} must be a positive integer.`)
  }
}

export function validateAutofillOptions(options?: VibeAutofillOptions): void {
  if (!options) return

  positiveInteger(options.pageSize, 'autofill pageSize')

  if (options.strategy === 'frontend') {
    validateRequestDelayOptions(options, 'frontend autofill')
    const maximum = options.maxAdditionalPages
    if (maximum !== undefined && maximum !== 'unlimited'
      && (!Number.isInteger(maximum) || maximum < 0)) {
      throw new TypeError(
        'Vibe autofill maxAdditionalPages must be a non-negative integer or "unlimited".',
      )
    }
    return
  }

  if (!options.feedKey.trim()) {
    throw new TypeError('Vibe backend autofill requires a feedKey.')
  }

  const initialSession = options.initialSession
  if (!initialSession) return

  if (initialSession.feedKey !== options.feedKey) {
    throw new TypeError(
      'Vibe backend autofill initialSession feedKey must match autofill feedKey.',
    )
  }
  if (initialSession.pageSize !== options.pageSize) {
    throw new TypeError(
      'Vibe backend autofill initialSession pageSize must match autofill pageSize.',
    )
  }
}

export function createAutofillState(
  options?: VibeAutofillOptions,
  initialSession?: VibeAutofillSessionSnapshot,
  useConfiguredSession = true,
): VibeAutofillState {
  if (!options) {
    return {
      cycleId: null,
      delayRemainingMs: null,
      enabled: false,
      error: null,
      feedKey: null,
      missing: 0,
      nextRequestAt: null,
      pageSize: null,
      received: 0,
      requests: 0,
      sequence: 0,
      sessionId: null,
      status: 'idle',
      strategy: null,
    }
  }

  const session = options.strategy === 'backend'
    ? initialSession ?? (useConfiguredSession ? options.initialSession : undefined)
    : undefined
  const received = session?.received ?? 0
  const delay = getRequestDelaySnapshot(session?.nextRequestAt)

  return {
    cycleId: session?.cycleId ?? null,
    ...delay,
    enabled: true,
    error: session?.error ?? null,
    feedKey: options.strategy === 'backend' ? options.feedKey : null,
    missing: Math.max(0, options.pageSize - received),
    pageSize: options.pageSize,
    received,
    requests: session?.requests ?? 0,
    sequence: session?.sequence ?? 0,
    sessionId: session?.sessionId ?? null,
    status: session ? session.status : 'idle',
    strategy: options.strategy,
  }
}

export function isAutofillActive(state: VibeAutofillState): boolean {
  return ['cancelling', 'filling', 'restoring', 'waiting'].includes(state.status)
}

export async function cancelAutofill(
  options: VibeAutofillOptions | undefined,
  state: VibeRuntimeState,
  cancelRequest: () => void,
): Promise<void> {
  const autofill = state.autofill
  if (!isAutofillActive(autofill) || !autofill.cycleId) return

  const context = {
    cycleId: autofill.cycleId,
    feedKey: autofill.feedKey ?? '',
    sessionId: autofill.sessionId,
  }
  cancelRequest()
  autofill.status = 'cancelling'

  try {
    if (options?.strategy === 'backend') await options.onCancel(context)
    autofill.error = null
    autofill.status = 'cancelled'
  } catch (error: unknown) {
    autofill.error = error
    autofill.status = 'error'
    throw error
  }
}

export function isMatchingBackendSession(
  options: VibeAutofillOptions | undefined,
  update: Pick<VibeAutofillSessionSnapshot, 'feedKey' | 'sessionId'>,
  state: VibeAutofillState,
): boolean {
  return options?.strategy === 'backend'
    && update.feedKey === options.feedKey
    && update.sessionId === state.sessionId
}

export async function collectFrontendAutofill({
  existingItems,
  initialCursor,
  loadPage,
  maximumRequests: configuredMaximumRequests,
  onCollection,
  onDelayChange,
  onProgress,
  options,
  receivedOffset = 0,
  requestOffset = 0,
  shouldPause = () => false,
  signal,
}: CollectFrontendAutofillOptions): Promise<FrontendAutofillResult> {
  const items: VibeItem[] = []
  const knownItems = [...existingItems]
  const seenCursors = new Set<string>()
  const maximumRequests = configuredMaximumRequests
    ?? frontendAutofillRequestLimit(options)
  let cursor = initialCursor
  let lastCursor = initialCursor
  let next: VibeCursor = initialCursor
  let requests = 0
  const pages: LoadedPageRecord[] = []
  let total: number | undefined

  while (requests < maximumRequests) {
    const key = cursorKey(cursor)
    if (seenCursors.has(key)) {
      throw new Error('Vibe autofill received a repeated cursor.')
    }
    seenCursors.add(key)

    await waitForRequestDelay({
      delayMs: getRequestDelayMs(requestOffset + requests, options),
      onChange: onDelayChange,
      signal,
    })
    if (requests > 0 && shouldPause()) {
      return {
        items,
        lastCursor,
        missing: Math.max(0, options.pageSize - receivedOffset - items.length),
        next,
        pages,
        received: receivedOffset + items.length,
        requests: requestOffset + requests,
        status: 'paused',
        total,
      }
    }

    const page = validatePage(await loadPage({ cursor, signal }))
    requests += 1
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
    next = page.next
    if (page.total !== undefined) total = page.total

    const progress = {
      missing: Math.max(0, options.pageSize - receivedOffset - items.length),
      next,
      received: receivedOffset + items.length,
      requests: requestOffset + requests,
    }
    onProgress(progress)
    const collection = {
      ...progress,
      items: [...items],
      lastCursor,
      pages: [...pages],
      total,
    }
    onCollection(collection)

    if (progress.missing === 0) {
      return { ...collection, pages, status: 'complete' }
    }
    if (next === null) {
      return { ...collection, pages, status: 'exhausted' }
    }
    if (shouldPause()) {
      return { ...collection, pages, status: 'paused' }
    }

    cursor = next
  }

  return {
    items,
    lastCursor,
    missing: Math.max(0, options.pageSize - receivedOffset - items.length),
    next,
    pages,
    received: receivedOffset + items.length,
    requests: requestOffset + requests,
    status: 'exhausted',
    total,
  }
}
