import {
  collectFrontendAutofill,
  frontendAutofillRequestLimit,
  type FrontendAutofillCollection,
} from './autofill'
import { startBackendAutofill } from './backendAutofill'
import { appendUniqueItems } from './page'
import type { VibeRuntimeState } from './runtime'
import type {
  CreateVibeOptions,
  VibeCursor,
} from '../types'

interface InitialAutofillContext {
  cycleId: string
  isCurrent: () => boolean
  onCollection: (collection: FrontendAutofillCollection) => void
  onLastCursor: (cursor: VibeCursor) => void
  options: CreateVibeOptions
  signal: AbortSignal
  state: VibeRuntimeState
}

export async function autofillInitialPage({
  cycleId,
  isCurrent,
  onCollection,
  onLastCursor,
  options,
  signal,
  state,
}: InitialAutofillContext): Promise<void> {
  const autofill = options.autofill
  if (!autofill) return

  const received = state.items.length
  Object.assign(state.autofill, {
    missing: Math.max(0, autofill.pageSize - received),
    received,
    requests: 1,
  })
  if (received >= autofill.pageSize) {
    state.autofill.status = 'complete'
    return
  }

  if (autofill.strategy === 'backend') {
    await startBackendAutofill(autofill, state, {
      cycleId,
      feedKey: autofill.feedKey,
      items: [...state.items],
      missing: autofill.pageSize - received,
      next: state.next,
      pageSize: autofill.pageSize,
      received,
      signal,
      total: state.total,
    }, isCurrent)
    return
  }

  if (!options.loadPage || state.next === null) {
    state.autofill.status = 'exhausted'
    return
  }

  const result = await collectFrontendAutofill({
    existingItems: state.items,
    initialCursor: state.next,
    loadPage: options.loadPage,
    maximumRequests: frontendAutofillRequestLimit(autofill, false),
    onCollection,
    onDelayChange: (delay) => {
      if (isCurrent()) Object.assign(state.autofill, delay)
    },
    onProgress: (progress) => {
      if (isCurrent()) Object.assign(state.autofill, progress, { status: 'filling' })
    },
    options: autofill,
    receivedOffset: received,
    requestOffset: 1,
    signal,
  })
  if (!isCurrent()) return

  state.items = appendUniqueItems(state.items, result.items)
  state.next = result.next
  if (result.total !== undefined) state.total = result.total
  onLastCursor(result.lastCursor)
  Object.assign(state.autofill, {
    missing: result.missing,
    received: result.received,
    requests: result.requests,
    status: result.status,
  })
}
