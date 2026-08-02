import { restoreActiveItemAfterRemoval } from './activeItemRemoval'
import { ExactMediaRemovalController } from './exactMediaRemovalController'
import { ItemRemovalController } from './itemRemovalController'
import { ReelForwardController } from './reelForwardController'
import type { VibeRuntimeState } from './runtime'
import type { VibeItemId } from '../types'

interface RemovalControllerOptions {
  historyLimit: number | undefined
  loadNext: () => Promise<void>
  onActivate: (postId: VibeItemId) => void
  retryEnd: () => Promise<void>
  startRemoval: (postIds: readonly VibeItemId[]) => number
  state: VibeRuntimeState
}

export interface RemovalControllers {
  exactMediaRemoval: ExactMediaRemovalController
  itemRemoval: ItemRemovalController
  reelForward: ReelForwardController
}

export function createRemovalControllers(
  options: RemovalControllerOptions,
): RemovalControllers {
  const reelForward = new ReelForwardController(options)
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
    startRemoval: options.startRemoval,
    state: options.state,
  })

  return { exactMediaRemoval, itemRemoval, reelForward }
}
