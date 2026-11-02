import type { VibeItemId } from '../types'
import type { VibeRuntimeState } from './runtime'
import type { VibeRouteSync } from './vibeRouting'

export function openMasonryReel(state: VibeRuntimeState, routing: VibeRouteSync, postId: VibeItemId): void {
  if (state.layout !== 'masonry' || !state.items.some((item) => item.postId === postId)) return
  state.activeReelPostId = postId
  state.reelOrigin = 'masonry'
  routing.syncReel(postId)
}
