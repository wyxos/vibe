import { mediaAssets } from './mediaAsset'
import type { VibeRuntimeState } from './runtime'
import type { VibeItem, VibeItemId, VibeMediaTarget } from '../types'

interface ReelRemovalTransitionControllerOptions {
  state: VibeRuntimeState
  transitionMedia: (direction: -1 | 1) => Promise<boolean>
  transitionPost: (postId: VibeItemId) => Promise<boolean>
}

export class ReelRemovalTransitionController {
  private generation = 0
  private pending: Promise<void> = Promise.resolve()

  constructor(private readonly options: ReelRemovalTransitionControllerOptions) {}

  prepareItems(postIds: readonly VibeItemId[]): Promise<void> {
    return this.serialize(() => this.preparePosts(postIds))
  }

  prepareMedia(target: VibeMediaTarget): Promise<void> {
    return this.serialize(async () => {
      const { state } = this.options
      if (!this.isReelActive() || state.activeReelPostId !== target.postId) return

      const item = state.items.find(({ postId }) => postId === target.postId)
      if (!item) return
      const activeMediaIndex = state.mediaIndices.get(target.postId) ?? 0
      if (target.mediaIndex !== activeMediaIndex) return

      if (mediaAssets(item).length > 1) {
        await this.options.transitionMedia(1)
        return
      }

      await this.preparePosts([target.postId])
    })
  }

  reset(): void {
    this.generation += 1
    this.pending = Promise.resolve()
  }

  private async preparePosts(postIds: readonly VibeItemId[]): Promise<void> {
    const { state } = this.options
    const activePostId = state.activeReelPostId
    const removedPostIds = new Set(postIds)
    if (!this.isReelActive() || activePostId === null || !removedPostIds.has(activePostId)) {
      return
    }

    const generation = this.generation
    const activeIndex = state.items.findIndex(({ postId }) => postId === activePostId)
    if (activeIndex < 0) return
    const replacement = this.nextSurvivor(activeIndex, removedPostIds)

    if (
      replacement
      && generation === this.generation
      && state.activeReelPostId === activePostId
    ) await this.options.transitionPost(replacement.postId)
  }

  private isReelActive(): boolean {
    const { state } = this.options
    return state.layout === 'reel' || state.reelOrigin === 'masonry'
  }

  private nextSurvivor(
    activeIndex: number,
    removedPostIds: ReadonlySet<VibeItemId>,
  ): VibeItem | undefined {
    if (activeIndex < 0) return undefined
    return this.options.state.items
      .slice(activeIndex + 1)
      .find(({ postId }) => !removedPostIds.has(postId))
  }

  private serialize(operation: () => Promise<void>): Promise<void> {
    const pending = this.pending.then(operation, operation)
    this.pending = pending.catch(() => undefined)
    return pending
  }
}
