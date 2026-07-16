import { createFillState } from './fill'
import { appendUniqueItems } from './page'
import type { VibeRuntimeState } from './runtime'
import type {
  VibeBackendFillOptions,
  VibeBackendFillStartContext,
  VibeBackendFillUpdate,
  VibeFillOptions,
  VibeFillSessionSnapshot,
  VibeCursor,
} from '../types'

export async function startBackendFill(
  options: VibeBackendFillOptions,
  state: VibeRuntimeState,
  context: VibeBackendFillStartContext,
  isCurrent: () => boolean,
): Promise<void> {
  const session = await options.onStart(context)
  if (!isCurrent()) return
  if (!session.sessionId.trim()) {
    throw new TypeError('Vibe backend fill requires a sessionId.')
  }

  Object.assign(state.fill, {
    completedPages: session.completedPages ?? 0,
    received: session.received ?? 0,
    sequence: session.sequence ?? 0,
    sessionId: session.sessionId,
    status: 'waiting',
  })
}

function isMatchingSession(
  options: VibeFillOptions | undefined,
  state: VibeRuntimeState,
  update: Pick<VibeBackendFillUpdate, 'feedKey' | 'sessionId'>,
): boolean {
  return options?.strategy === 'backend'
    && update.feedKey === options.feedKey
    && update.sessionId === state.fill.sessionId
}

function hasValidCounters(update: VibeBackendFillUpdate): boolean {
  return Number.isInteger(update.completedPages)
    && update.completedPages >= 0
    && Number.isInteger(update.received)
    && update.received >= 0
    && Number.isInteger(update.sequence)
    && update.sequence >= 0
}

function isValidTerminalUpdate(
  state: VibeRuntimeState,
  update: VibeBackendFillUpdate,
): boolean {
  if (!['complete', 'exhausted'].includes(update.status)) return true
  const target = state.fill.target
  if (!target || !Array.isArray(update.items)) return false
  if (update.next === undefined || update.lastCursor === undefined) return false
  if (update.status === 'exhausted') {
    return 'pages' in target
      && update.completedPages < target.pages
      && update.next === null
  }
  if ('pages' in target) return update.completedPages === target.pages
  return update.next === null
}

function applyTerminalUpdate(
  state: VibeRuntimeState,
  update: VibeBackendFillUpdate,
  onLastCursor: (cursor: VibeCursor) => void,
): void {
  if (update.total !== undefined) state.total = update.total
  if (!['complete', 'exhausted'].includes(update.status)) return
  state.items = appendUniqueItems(state.items, update.items ?? [])
  state.next = update.next ?? null
  onLastCursor(update.lastCursor ?? null)
}

export function applyBackendFillUpdate(
  options: VibeFillOptions | undefined,
  state: VibeRuntimeState,
  update: VibeBackendFillUpdate,
  onLastCursor: (cursor: VibeCursor) => void,
): boolean {
  if (!isMatchingSession(options, state, update)) return false
  if (!hasValidCounters(update)) return false
  if (update.sequence <= state.fill.sequence) return false
  if (['cancelled', 'cancelling'].includes(state.fill.status)) return false
  if (!isValidTerminalUpdate(state, update)) return false

  applyTerminalUpdate(state, update, onLastCursor)
  Object.assign(state.fill, {
    completedPages: update.completedPages,
    error: update.error ?? null,
    received: update.received,
    sequence: update.sequence,
    status: update.status,
  })
  return true
}

export function restoreBackendFillSession(
  options: VibeFillOptions | undefined,
  state: VibeRuntimeState,
  snapshot: VibeFillSessionSnapshot,
  onLastCursor: (cursor: VibeCursor) => void,
): boolean {
  if (options?.strategy !== 'backend' || snapshot.feedKey !== options.feedKey) {
    return false
  }

  const previousFill = state.fill
  state.fill = createFillState(options, snapshot)
  if (!hasValidCounters(snapshot) || !isValidTerminalUpdate(state, snapshot)) {
    state.fill = previousFill
    return false
  }
  applyTerminalUpdate(state, snapshot, onLastCursor)
  return true
}
