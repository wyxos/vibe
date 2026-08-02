import type { VibeRouteSync } from './vibeRouting'
import type { VibeRuntimeState } from './runtime'
import type { VibeItemPlacement } from '../types'

export function restoreActiveItemAfterRemoval(
  state: VibeRuntimeState,
  routing: VibeRouteSync,
  placements: readonly VibeItemPlacement[],
  activeIndex: number,
  closeMasonryReel: () => void,
): void {
  const removedPostIds = new Set(placements.map(({ item }) => item.postId))
  if (state.activeReelPostId === null || !removedPostIds.has(state.activeReelPostId)) return

  if (state.reelOrigin === 'masonry') {
    closeMasonryReel()
    return
  }

  const replacement = state.items[
    Math.min(Math.max(activeIndex, 0), state.items.length - 1)
  ]
  state.activeReelPostId = replacement?.postId ?? null
  if (replacement) routing.syncReel(replacement.postId)
  else routing.syncFeed()
}
