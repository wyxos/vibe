import { appendUniqueItems } from './page'
import type { RemovalReconciliationController } from './removalReconciliationController'
import type { RequestDelaySnapshot } from './requestDelay'
import type { VibeRuntimeState } from './runtime'
import type { VibeCursor, VibePageLoader } from '../types'

export type FillReconciliationStatus = 'complete' | 'paused' | 'skipped'

interface FillReconciliationOptions {
  controller: RemovalReconciliationController
  isCurrent: () => boolean
  loadPage: VibePageLoader
  onDelayChange: (snapshot: RequestDelaySnapshot) => void
  setLastCursor: (cursor: VibeCursor) => void
  signal: AbortSignal
  state: VibeRuntimeState
}

export async function reconcileBeforeFill({
  controller,
  isCurrent,
  loadPage,
  onDelayChange,
  setLastCursor,
  signal,
  state,
}: FillReconciliationOptions): Promise<FillReconciliationStatus> {
  if (!controller.needsReconciliation(state.items)) return 'skipped'

  const result = await controller.reconcile({
    existingItems: state.items,
    loadPage,
    onDelayChange,
    shouldPause: () => state.loadMoreLocked,
    signal,
  })
  if (!isCurrent()) return result.status

  state.items = appendUniqueItems(state.items, result.items)
  state.next = result.next
  setLastCursor(result.lastCursor)
  if (result.total !== undefined) state.total = result.total
  controller.completeReconciliation(result)
  return result.status
}
