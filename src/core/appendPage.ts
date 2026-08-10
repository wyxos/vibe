import type { VibeCursor, VibePage } from '../types'
import { pageCurrentCursor, reconcilePageItems, validatePage } from './page'
import type { RemovalReconciliationController } from './removalReconciliationController'
import type { VibeRuntimeState } from './runtime'

export function appendPageToState(
  pageValue: VibePage,
  state: VibeRuntimeState,
  reconciliation: RemovalReconciliationController,
  setCursor: (cursor: VibeCursor) => void,
): void {
  const page = validatePage(pageValue)
  const items = reconciliation.filterItems(page.items)
  const cursor = pageCurrentCursor(page)
  state.items = reconcilePageItems(state.items, items)
  state.next = page.next
  if (page.total !== undefined) state.total = page.total
  setCursor(cursor)
  reconciliation.recordPages([{
    contributionIds: items.map(({ postId }) => postId),
    cursor,
    next: page.next,
    returnedIds: items.map(({ postId }) => postId),
  }])
}
