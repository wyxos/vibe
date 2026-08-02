import { restoreActiveItemAfterRemoval } from './activeItemRemoval'
import { ExactMediaRemovalController } from './exactMediaRemovalController'
import { ItemRemovalController } from './itemRemovalController'
import { ReelForwardController } from './reelForwardController'
import { ReelRemovalTransitionController } from './reelRemovalTransitionController'
import type { VibeSurfaceExpose } from './feed'
import type { VibeRuntimeState } from './runtime'
import type { VibeItemId } from '../types'

interface RemovalControllerOptions {
  historyLimit: number | undefined
  loadNext: () => Promise<void>
  onActivate: (postId: VibeItemId) => void
  retryEnd: () => Promise<void>
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
    reelForward,
    state: options.state,
  })
  const itemRemoval = new ItemRemovalController({
    historyLimit: options.historyLimit,
    onItemsRemoved: (removal, placements, activeIndex) => {
      restoreActiveItemAfterRemoval(
        options.state,
        placements,
        activeIndex,
        options.onActivate,
        (postIndex, item) => reelForward.start(removal, postIndex, item),
      )
    },
    onRemovalRestored: (removal) => {
      const restoredForwardItem = reelForward.cancel(removal)
      if (restoredForwardItem) options.onActivate(restoredForwardItem.postId)
    },
    prepareRemoval: (postIds) => reelRemoval.prepareItems(postIds),
    startRemoval: (postIds) => options.surface()?.startItemRemoval(postIds) ?? 0,
    state: options.state,
  })

  return { exactMediaRemoval, itemRemoval, reelForward, reelRemoval }
}
