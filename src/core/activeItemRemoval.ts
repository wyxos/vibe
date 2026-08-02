import type { VibeRuntimeState } from './runtime'
import type { VibeItem, VibeItemId, VibeItemPlacement } from '../types'

export function restoreActiveItemAfterRemoval(
  state: VibeRuntimeState,
  placements: readonly VibeItemPlacement[],
  activeIndex: number,
  activate: (postId: VibeItemId) => void,
  loadForward: (postIndex: number, item: VibeItem) => void,
): void {
  const removedPostIds = new Set(placements.map(({ item }) => item.postId))
  if (state.activeReelPostId === null || !removedPostIds.has(state.activeReelPostId)) return

  const replacement = state.items[Math.max(activeIndex, 0)]
  if (replacement) {
    activate(replacement.postId)
    return
  }

  const removedActiveItem = placements.find(
    ({ item }) => item.postId === state.activeReelPostId,
  )?.item
  if (removedActiveItem) loadForward(Math.max(activeIndex, 0), removedActiveItem)
}
