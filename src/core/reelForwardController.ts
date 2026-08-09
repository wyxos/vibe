import type { VibeRuntimeState } from './runtime'
import type { VibeItem, VibeItemId } from '../types'

interface ReelForwardControllerOptions {
  onActivate: (postId: VibeItemId) => void
  replenishAfterRemoval: () => Promise<void>
  state: VibeRuntimeState
}

interface ForwardTarget {
  item: VibeItem
  postIndex: number
  token: object
  version: number
}

export class ReelForwardController {
  private forward: ForwardTarget | null = null
  private forwardPromise: Promise<void> | null = null
  private forwardVersion = 0
  private readonly state: VibeRuntimeState

  constructor(private readonly options: ReelForwardControllerOptions) {
    this.state = options.state
  }

  start(token: object, postIndex: number, item: VibeItem): void {
    this.forward = {
      item,
      postIndex,
      token,
      version: ++this.forwardVersion,
    }
    this.state.reelForward = { error: null, status: 'loading' }
    this.state.reelForwardIndex = postIndex
    this.state.reelForwardItem = item
    void this.startForwardRequest()
  }

  cancel(token: object): VibeItem | null {
    if (this.forward?.token !== token || this.state.reelForward.status === 'idle') {
      return null
    }

    const item = this.forward.item
    this.forwardVersion += 1
    this.forward = null
    this.clearState()
    return item
  }

  reset(): void {
    this.forwardVersion += 1
    this.forward = null
    this.forwardPromise = null
    this.clearState()
  }

  retry(): Promise<void> {
    if (!this.forward || this.state.reelForward.status === 'idle') return Promise.resolve()
    this.state.nextPageError = null
    this.state.reelForward = { error: null, status: 'loading' }
    return this.startForwardRequest()
  }

  private clearState(): void {
    this.state.reelForward = { error: null, status: 'idle' }
    this.state.reelForwardIndex = null
    this.state.reelForwardItem = null
  }

  private startForwardRequest(): Promise<void> {
    if (this.forwardPromise) return this.forwardPromise
    const request = this.loadForward()
    this.forwardPromise = request
    return request.finally(() => {
      if (this.forwardPromise !== request) return
      this.forwardPromise = null
      if (this.forward && this.state.reelForward.status === 'loading') {
        void this.startForwardRequest()
      }
    })
  }

  private async loadForward(): Promise<void> {
    const target = this.forward
    if (!target) return

    while (this.forward === target && target.version === this.forwardVersion) {
      const replacement = this.state.items[target.postIndex]
      if (replacement) {
        this.forward = null
        this.clearState()
        this.options.onActivate(replacement.postId)
        return
      }
      if (this.state.nextPageError) {
        this.state.reelForward = { error: this.state.nextPageError, status: 'error' }
        return
      }
      const previousCursor = this.state.next
      const previousLength = this.state.items.length
      await this.options.replenishAfterRemoval()
      if (this.state.nextPageError) {
        this.state.reelForward = { error: this.state.nextPageError, status: 'error' }
        return
      }
      if (this.state.items[target.postIndex]) continue
      if (this.state.next === null) {
        this.state.reelForward = { error: null, status: 'end' }
        return
      }
      if (
        this.state.next === previousCursor
        && this.state.items.length === previousLength
      ) {
        this.state.reelForward = {
          error: new Error('Vibe could not advance while page loading is unavailable.'),
          status: 'error',
        }
        return
      }
    }
  }
}
