import { restoreActiveItemAfterRemoval } from './activeItemRemoval'
import { ExactMediaRemovalController } from './exactMediaRemovalController'
import { ItemRemovalController } from './itemRemovalController'
import { ReelForwardController } from './reelForwardController'
import { ReelRemovalTransitionController } from './reelRemovalTransitionController'
import type { VibeSurfaceExpose } from './feed'
import type { VibeRuntimeState } from './runtime'
import type { VibeItemId } from '../types'
import type { VibeItemRemovalOptions } from './itemRemovalOptions'

interface RemovalControllerOptions {
  historyLimit: number | undefined
  onActivate: (postId: VibeItemId) => void
  onItemsRemoved: (postIds: readonly VibeItemId[]) => void
  onItemsRestored: (postIds: readonly VibeItemId[]) => void
  replenishAfterRemoval: () => Promise<void>
  state: VibeRuntimeState
  surface: () => VibeSurfaceExpose | null
}

export interface RemovalControllers {
  exactMediaRemoval: ExactMediaRemovalController
  itemRemoval: ItemRemovalController
  reelForward: ReelForwardController
  reelRemoval: ReelRemovalTransitionController
}

export function createRemovalControllers(
  options: RemovalControllerOptions,
): RemovalControllers {
  const reelForward = new ReelForwardController(options)
  const reelRemoval = new ReelRemovalTransitionController({
    state: options.state,
    transitionMedia: (direction) => options.surface()
      ?.transitionActiveReelMedia(direction) ?? Promise.resolve(false),
    transitionPost: (postId) => options.surface()
      ?.transitionActiveReelPost(postId) ?? Promise.resolve(false),
  })
  const exactMediaRemoval = new ExactMediaRemovalController({
    onActivate: options.onActivate,
    onPostRemoved: (postId) => options.onItemsRemoved([postId]),
    onPostRestored: (postId) => options.onItemsRestored([postId]),
    reelForward,
    state: options.state,
  })
  const itemRemoval = new ItemRemovalController({
    historyLimit: options.historyLimit,
    onItemsRemoved: (removal, placements, activeIndex) => {
      options.onItemsRemoved(placements.map(({ item }) => item.postId))
      restoreActiveItemAfterRemoval(
        options.state,
        placements,
        activeIndex,
        options.onActivate,
        (postIndex, item) => reelForward.start(removal, postIndex, item),
      )
    },
    onRemovalRestored: (removal) => {
      options.onItemsRestored(removal.map(({ item }) => item.postId))
      const restoredForwardItem = reelForward.cancel(removal)
      if (restoredForwardItem) options.onActivate(restoredForwardItem.postId)
    },
    prepareRemoval: (postIds) => reelRemoval.prepareItems(postIds),
    startRemoval: (postIds, removalOptions?: VibeItemRemovalOptions) => options.surface()
      ?.startItemRemoval(postIds, removalOptions) ?? 0,
    state: options.state,
  })

  return { exactMediaRemoval, itemRemoval, reelForward, reelRemoval }
}
