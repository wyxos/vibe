import { mediaAssets } from './mediaAsset'
import type { ReelForwardController } from './reelForwardController'
import type { VibeRuntimeState } from './runtime'
import type {
  VibeItem,
  VibeItemId,
  VibeMediaAsset,
  VibeMediaRemoval,
  VibeMediaTarget,
} from '../types'

interface ExactMediaRemovalControllerOptions {
  onActivate: (postId: VibeItemId) => void
  onPostRemoved: (postId: VibeItemId) => void
  onPostRestored: (postId: VibeItemId) => void
  reelForward: ReelForwardController
  state: VibeRuntimeState
}

interface RemovalMetadata {
  generation: number
  originalItem: VibeItem
  restored: boolean
}

function itemWithMedia(item: VibeItem, assets: readonly VibeMediaAsset[]): VibeItem {
  const [primary, ...items] = assets
  if (!primary) throw new Error('Vibe items must contain at least one media asset.')
  return { ...item, ...primary, items }
}

function assertMediaTarget(target: VibeMediaTarget): void {
  if (!Number.isInteger(target.mediaIndex) || target.mediaIndex < 0) {
    throw new TypeError('Vibe mediaIndex must be a non-negative integer.')
  }
}

export class ExactMediaRemovalController {
  private generation = 0
  private readonly metadata = new WeakMap<VibeMediaRemoval, RemovalMetadata>()
  private readonly state: VibeRuntimeState

  constructor(private readonly options: ExactMediaRemovalControllerOptions) {
    this.state = options.state
  }

  remove(target: VibeMediaTarget): VibeMediaRemoval | null {
    assertMediaTarget(target)
    const postIndex = this.state.items.findIndex(({ postId }) => postId === target.postId)
    const item = this.state.items[postIndex]
    if (!item) return null

    const assets = [...mediaAssets(item)]
    const media = assets[target.mediaIndex]
    if (!media) return null

    const removal = Object.freeze({
      media,
      mediaIndex: target.mediaIndex,
      postId: target.postId,
      postIndex,
    }) as VibeMediaRemoval
    this.metadata.set(removal, {
      generation: this.generation,
      originalItem: item,
      restored: false,
    })

    const activeMediaIndex = this.state.mediaIndices.get(item.postId) ?? 0
    const isActivePost = this.isReelOpen() && this.state.activeReelPostId === item.postId
    const isActiveMedia = isActivePost && activeMediaIndex === target.mediaIndex
    assets.splice(target.mediaIndex, 1)

    if (assets.length > 0) {
      this.state.items[postIndex] = itemWithMedia(item, assets)
      this.updateMediaIndexAfterRemoval(item.postId, target.mediaIndex, isActiveMedia)
      return removal
    }

    this.state.items.splice(postIndex, 1)
    this.options.onPostRemoved(item.postId)
    this.state.mediaIndices.delete(item.postId)
    if (isActivePost) this.advanceFromRemovedPost(removal, item)
    return removal
  }

  reset(): void {
    this.generation += 1
  }

  restore(removal: VibeMediaRemoval): boolean {
    const metadata = this.metadata.get(removal)
    if (!metadata) throw new TypeError('Vibe media removal does not belong to this instance.')
    if (metadata.generation !== this.generation || metadata.restored) return false
    metadata.restored = true
    this.options.onPostRestored(removal.postId)

    const postIndex = this.state.items.findIndex(({ postId }) => postId === removal.postId)
    if (postIndex >= 0) this.restoreIntoPost(postIndex, removal)
    else this.state.items.splice(
      Math.min(removal.postIndex, this.state.items.length),
      0,
      metadata.originalItem,
    )

    if (this.options.reelForward.cancel(removal)) {
      this.state.mediaIndices.set(removal.postId, removal.mediaIndex)
      this.options.onActivate(removal.postId)
    }
    return true
  }

  private advanceFromRemovedPost(removal: VibeMediaRemoval, item: VibeItem): void {
    const replacement = this.state.items[removal.postIndex]
    if (replacement) {
      this.options.onActivate(replacement.postId)
      return
    }

    this.options.reelForward.start(removal, removal.postIndex, item)
  }

  private isReelOpen(): boolean {
    return this.state.layout === 'reel' || this.state.reelOrigin === 'masonry'
  }

  private restoreIntoPost(postIndex: number, removal: VibeMediaRemoval): void {
    const item = this.state.items[postIndex]!
    const assets = [...mediaAssets(item)]
    const insertAt = Math.min(removal.mediaIndex, assets.length)
    assets.splice(insertAt, 0, removal.media)
    this.state.items[postIndex] = itemWithMedia(item, assets)

    if (this.state.activeReelPostId !== removal.postId) return
    const activeIndex = this.state.mediaIndices.get(removal.postId) ?? 0
    if (activeIndex >= insertAt) {
      this.state.mediaIndices.set(removal.postId, activeIndex + 1)
    }
  }

  private updateMediaIndexAfterRemoval(
    postId: VibeItemId,
    removedIndex: number,
    removedActiveMedia: boolean,
  ): void {
    const item = this.state.items.find((candidate) => candidate.postId === postId)
    if (!item) return
    const mediaCount = mediaAssets(item).length
    const currentIndex = this.state.mediaIndices.get(postId) ?? 0
    let nextIndex = currentIndex
    if (removedActiveMedia) nextIndex = removedIndex < mediaCount ? removedIndex : 0
    else if (removedIndex < currentIndex) nextIndex = currentIndex - 1
    this.state.mediaIndices.set(postId, Math.min(nextIndex, mediaCount - 1))
  }
}
