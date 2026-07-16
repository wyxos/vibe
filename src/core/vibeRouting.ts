import type { VibeRuntimeState } from './runtime'
import type { VibeItemId, VibeRoutingOptions } from '../types'

export class VibeRouteSync {
  private routedReelPostId: VibeItemId | null = null
  private reelRouteIsActive = false

  constructor(
    private readonly options: VibeRoutingOptions | undefined,
    private readonly state: VibeRuntimeState,
  ) {}

  syncFeed(): void {
    if (!this.options || !this.reelRouteIsActive) return

    this.reelRouteIsActive = false
    this.routedReelPostId = null
    const location = typeof this.options.feed === 'function'
      ? this.options.feed()
      : this.options.feed
    void this.options.router.replace(location)
  }

  syncReel(postId: VibeItemId): void {
    if (!this.options) return

    const index = this.state.items.findIndex((item) => item.postId === postId)
    const item = this.state.items[index]
    if (!item) return
    if (this.reelRouteIsActive && this.routedReelPostId === postId) return

    const location = this.options.reel({
      index,
      item,
      loadedCount: this.state.items.length,
      origin: this.state.reelOrigin ?? 'reel',
      total: this.state.total,
    })
    if (location === null) return

    const method = this.reelRouteIsActive ? 'replace' : 'push'
    this.reelRouteIsActive = true
    this.routedReelPostId = postId
    void this.options.router[method](location)
  }
}
