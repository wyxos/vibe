import {
  createAutofillState,
  isMatchingBackendSession,
} from './autofill'
import { appendUniqueItems } from './page'
import type { VibeRuntimeState } from './runtime'
import type {
  VibeAutofillOptions,
  VibeAutofillSessionSnapshot,
  VibeBackendAutofillOptions,
  VibeBackendAutofillStartContext,
  VibeBackendAutofillUpdate,
} from '../types'

export async function startBackendAutofill(
  options: VibeBackendAutofillOptions,
  state: VibeRuntimeState,
  context: VibeBackendAutofillStartContext,
  isCurrent: () => boolean,
): Promise<void> {
  const session = await options.onUnderfilled(context)
  if (!isCurrent()) return
  if (!session.sessionId.trim()) {
    throw new TypeError('Vibe backend autofill requires a sessionId.')
  }

  const sessionReceived = Math.max(context.received, session.received ?? context.received)
  Object.assign(state.autofill, {
    missing: Math.max(0, options.pageSize - sessionReceived),
    received: sessionReceived,
    sequence: session.sequence ?? 0,
    sessionId: session.sessionId,
    status: 'waiting',
  })
}

function applyTerminalItems(
  state: VibeRuntimeState,
  update: VibeBackendAutofillUpdate,
): void {
  if (['complete', 'exhausted'].includes(update.status) && update.items) {
    state.items = appendUniqueItems(state.items, update.items)
  }
  if (update.next !== undefined) state.next = update.next
  if (update.total !== undefined) state.total = update.total
}

export function applyBackendAutofillUpdate(
  options: VibeAutofillOptions | undefined,
  state: VibeRuntimeState,
  update: VibeBackendAutofillUpdate,
): boolean {
  const autofill = state.autofill
  if (!isMatchingBackendSession(options, update, autofill)) return false
  if (update.sequence <= autofill.sequence) return false
  if (['cancelled', 'cancelling'].includes(autofill.status)) return false
  if (
    ['complete', 'exhausted'].includes(update.status)
    && update.next === undefined
  ) {
    return false
  }

  applyTerminalItems(state, update)
  autofill.error = update.error ?? null
  autofill.missing = Math.max(0, (autofill.pageSize ?? 0) - update.received)
  autofill.received = update.received
  if (update.requests !== undefined) autofill.requests = update.requests
  autofill.sequence = update.sequence
  autofill.status = update.status
  return true
}

export function restoreBackendAutofillSession(
  options: VibeAutofillOptions | undefined,
  state: VibeRuntimeState,
  snapshot: VibeAutofillSessionSnapshot,
): boolean {
  if (options?.strategy !== 'backend') return false
  if (snapshot.feedKey !== options.feedKey || snapshot.pageSize !== options.pageSize) {
    return false
  }

  state.autofill = createAutofillState(options, snapshot)
  applyTerminalItems(state, snapshot)
  return true
}
