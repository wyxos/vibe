import { mediaAssets } from './mediaAsset'
import type { VibeRuntimeState } from './runtime'
import type {
  VibeItem,
  VibeItemId,
  VibeMediaAsset,
  VibeMediaRemoval,
  VibeMediaTarget,
} from '../types'

interface ExactMediaRemovalControllerOptions {
  loadNext: () => Promise<void>
  onActivate: (postId: VibeItemId) => void
  retryEnd: () => Promise<void>
  state: VibeRuntimeState
}

interface RemovalMetadata {
  generation: number
  originalItem: VibeItem
  restored: boolean
}

interface ForwardTarget {
  postIndex: number
  removal: VibeMediaRemoval
  version: number
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
  private forward: ForwardTarget | null = null
  private forwardPromise: Promise<void> | null = null
  private forwardVersion = 0
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
    this.state.mediaIndices.delete(item.postId)
    if (isActivePost) this.advanceFromRemovedPost(removal, item)
    return removal
  }

  reset(): void {
    this.generation += 1
    this.forwardVersion += 1
    this.forward = null
    this.forwardPromise = null
    this.clearForwardState()
  }

  restore(removal: VibeMediaRemoval): boolean {
    const metadata = this.metadata.get(removal)
    if (!metadata) throw new TypeError('Vibe media removal does not belong to this instance.')
    if (metadata.generation !== this.generation || metadata.restored) return false
    metadata.restored = true

    const postIndex = this.state.items.findIndex(({ postId }) => postId === removal.postId)
    if (postIndex >= 0) this.restoreIntoPost(postIndex, removal)
    else this.state.items.splice(
      Math.min(removal.postIndex, this.state.items.length),
      0,
      metadata.originalItem,
    )

    if (this.forward?.removal === removal && this.state.reelForward.status !== 'idle') {
      this.forwardVersion += 1
      this.forward = null
      this.clearForwardState()
      this.state.mediaIndices.set(removal.postId, removal.mediaIndex)
      this.options.onActivate(removal.postId)
    }
    return true
  }

  retryForward(): Promise<void> {
    if (!this.forward || this.state.reelForward.status === 'idle') return Promise.resolve()
    this.state.nextPageError = null
    this.state.reelForward = { error: null, status: 'loading' }
    return this.startForwardRequest(this.state.next === null)
  }

  private advanceFromRemovedPost(removal: VibeMediaRemoval, item: VibeItem): void {
    const replacement = this.state.items[removal.postIndex]
    if (replacement) {
      this.options.onActivate(replacement.postId)
      return
    }

    this.forward = {
      postIndex: removal.postIndex,
      removal,
      version: ++this.forwardVersion,
    }
    this.state.reelForward = { error: null, status: 'loading' }
    this.state.reelForwardIndex = removal.postIndex
    this.state.reelForwardItem = item
    void this.startForwardRequest(false)
  }

  private clearForwardState(): void {
    this.state.reelForward = { error: null, status: 'idle' }
    this.state.reelForwardIndex = null
    this.state.reelForwardItem = null
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

  private startForwardRequest(retryExhausted: boolean): Promise<void> {
    if (this.forwardPromise) return this.forwardPromise
    const request = this.loadForward(retryExhausted)
    this.forwardPromise = request
    return request.finally(() => {
      if (this.forwardPromise !== request) return
      this.forwardPromise = null
      if (this.forward && this.state.reelForward.status === 'loading') {
        void this.startForwardRequest(false)
      }
    })
  }

  private async loadForward(retryExhausted: boolean): Promise<void> {
    const target = this.forward
    if (!target) return
    if (retryExhausted) await this.options.retryEnd()

    while (this.forward === target && target.version === this.forwardVersion) {
      const replacement = this.state.items[target.postIndex]
      if (replacement) {
        this.forward = null
        this.clearForwardState()
        this.options.onActivate(replacement.postId)
        return
      }
      if (this.state.nextPageError) {
        this.state.reelForward = { error: this.state.nextPageError, status: 'error' }
        return
      }
      if (this.state.next === null) {
        this.state.reelForward = { error: null, status: 'end' }
        return
      }

      const previousCursor = this.state.next
      await this.options.loadNext()
      if (
        this.state.next === previousCursor
        && !this.state.nextPageError
        && !this.state.items[target.postIndex]
      ) {
        this.state.reelForward = {
          error: new Error('Vibe could not advance while page loading is unavailable.'),
          status: 'error',
        }
        return
      }
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
