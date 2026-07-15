import {
  createApp,
  nextTick,
  reactive,
  type App,
} from 'vue'

import VibeSurface from '../components/VibeSurface.vue'
import type { VibeRuntimeState } from './runtime'
import type {
  CreateVibeOptions,
  VibeCursor,
  VibeInstance,
  VibeItem,
  VibeItemId,
  VibeLayout,
  VibePage,
  VibeState,
} from '../types'

interface VibeSurfaceExpose {
  loadIfNearBottom: () => Promise<void>
}

function validateOptions(options: CreateVibeOptions): void {
  if (!options.initialPage && !options.loadPage) {
    throw new TypeError('Vibe requires either initialPage or loadPage.')
  }

  if (options.initialPage?.next !== null && !options.loadPage) {
    throw new TypeError('Vibe requires loadPage when initialPage has a next cursor.')
  }
}

function validatePage(page: VibePage): VibePage {
  if (!page || typeof page !== 'object' || !Array.isArray(page.items)) {
    throw new TypeError('Vibe loadPage must resolve to a page with an items array.')
  }

  if (page.next !== null && typeof page.next !== 'string' && typeof page.next !== 'number') {
    throw new TypeError('Vibe page next must be a string, number, or null.')
  }

  if (page.total !== undefined && (!Number.isFinite(page.total) || page.total < 0)) {
    throw new TypeError('Vibe page total must be a non-negative number when provided.')
  }

  return page
}

function appendUniqueItems(current: VibeItem[], incoming: VibeItem[]): VibeItem[] {
  const postIds = new Set(current.map((item) => item.postId))

  return [
    ...current,
    ...incoming.filter((item) => {
      if (postIds.has(item.postId)) return false
      postIds.add(item.postId)
      return true
    }),
  ]
}

class VibeController implements VibeInstance {
  private app: App<Element> | null = null
  private abortController: AbortController | null = null
  private pendingRequest: Promise<void> | null = null
  private requestVersion = 0
  private surface: VibeSurfaceExpose | null = null
  private readonly state: VibeRuntimeState

  constructor(private readonly options: CreateVibeOptions) {
    validateOptions(options)
    const initialPage = options.initialPage

    this.state = reactive({
      activeReelPostId: null,
      error: null,
      infiniteScroll: options.infiniteScroll ?? true,
      isLoading: !initialPage,
      isLoadingMore: false,
      items: initialPage ? [...initialPage.items] : [],
      layout: options.layout ?? 'masonry',
      next: initialPage?.next ?? null,
      nextPageError: null,
      reelOrigin: null,
      total: initialPage?.total ?? null,
    })
  }

  async mount(): Promise<void> {
    if (this.app) throw new Error('Vibe is already mounted.')

    const target = this.resolveTarget()
    this.app = createApp(VibeSurface, {
      state: this.state,
      onActiveReelChange: (postId: VibeItemId) => this.setActiveReelPost(postId),
      onCloseReel: () => this.closeMasonryReel(),
      onLoadMore: () => { void this.loadNext() },
      onOpenReel: (postId: VibeItemId) => this.openMasonryReel(postId),
    })
    this.surface = this.app.mount(target) as unknown as VibeSurfaceExpose

    if (!this.options.initialPage) await this.reload()
  }

  destroy(): void {
    this.cancelRequest()
    this.app?.unmount()
    this.app = null
    this.surface = null
  }

  getState(): VibeState {
    return {
      activeReelPostId: this.state.activeReelPostId,
      error: this.state.error,
      infiniteScroll: this.state.infiniteScroll,
      isLoading: this.state.isLoading,
      isLoadingMore: this.state.isLoadingMore,
      items: [...this.state.items],
      layout: this.state.layout,
      next: this.state.next,
      nextPageError: this.state.nextPageError,
      reelOrigin: this.state.reelOrigin,
      total: this.state.total,
    }
  }

  async loadNext(): Promise<void> {
    if (this.pendingRequest) return this.pendingRequest
    if (this.state.next === null || !this.options.loadPage) return

    this.state.isLoadingMore = true
    this.state.nextPageError = null
    return this.startRequest(this.state.next, true)
  }

  async reload(): Promise<void> {
    if (!this.options.loadPage) {
      throw new Error('Vibe cannot reload without loadPage.')
    }

    this.cancelRequest()
    this.state.error = null
    this.state.isLoading = true
    this.state.items = []
    this.state.next = null
    this.state.nextPageError = null
    this.state.total = null
    return this.startRequest(null, false)
  }

  setInfiniteScroll(enabled: boolean): void {
    this.state.infiniteScroll = enabled

    if (enabled) {
      void nextTick(() => this.surface?.loadIfNearBottom())
    }
  }

  setLayout(layout: VibeLayout): void {
    if (layout === this.state.layout) return

    if (layout === 'masonry') this.state.activeReelPostId = null
    this.state.reelOrigin = null
    this.state.layout = layout
  }

  private closeMasonryReel(): void {
    if (this.state.reelOrigin !== 'masonry') return

    this.state.activeReelPostId = null
    this.state.reelOrigin = null
  }

  private openMasonryReel(postId: VibeItemId): void {
    if (this.state.layout !== 'masonry') return
    if (!this.state.items.some((item) => item.postId === postId)) return

    this.state.activeReelPostId = postId
    this.state.reelOrigin = 'masonry'
  }

  private setActiveReelPost(postId: VibeItemId): void {
    if (this.state.layout !== 'reel' && this.state.reelOrigin !== 'masonry') return
    this.state.activeReelPostId = postId
  }

  private cancelRequest(): void {
    this.requestVersion += 1
    this.abortController?.abort()
    this.abortController = null
    this.pendingRequest = null
    this.state.isLoading = false
    this.state.isLoadingMore = false
  }

  private async fetchPage(cursor: VibeCursor, append: boolean): Promise<void> {
    const loadPage = this.options.loadPage
    if (!loadPage) return

    const requestVersion = ++this.requestVersion
    const abortController = new AbortController()
    this.abortController = abortController

    try {
      const page = validatePage(await loadPage({
        cursor,
        signal: abortController.signal,
      }))
      if (requestVersion !== this.requestVersion) return

      this.state.items = append
        ? appendUniqueItems(this.state.items, page.items)
        : [...page.items]
      this.state.next = page.next
      if (page.total !== undefined) this.state.total = page.total
    } catch (error: unknown) {
      if (abortController.signal.aborted || requestVersion !== this.requestVersion) return

      if (append) this.state.nextPageError = error
      else this.state.error = error
    } finally {
      if (requestVersion === this.requestVersion) {
        this.abortController = null
        this.state.isLoading = false
        this.state.isLoadingMore = false
      }
    }
  }

  private resolveTarget(): Element {
    if (typeof this.options.target !== 'string') return this.options.target
    if (typeof document === 'undefined') {
      throw new Error('Vibe cannot resolve a selector without a document.')
    }

    const target = document.querySelector(this.options.target)
    if (!target) throw new Error(`Vibe target not found: ${this.options.target}`)

    return target
  }

  private startRequest(cursor: VibeCursor, append: boolean): Promise<void> {
    const request = this.fetchPage(cursor, append)
    this.pendingRequest = request

    return request.finally(() => {
      if (this.pendingRequest === request) this.pendingRequest = null
    })
  }
}

export function createVibe(options: CreateVibeOptions): VibeInstance {
  return new VibeController(options)
}
