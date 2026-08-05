import { createApp, nextTick, reactive, watch, type App, type WatchHandle } from 'vue'
import VibeSurface from '../components/VibeSurface.vue'
import {
  collectFrontendAutofill,
  createAutofillState,
  isAutofillActive,
} from './autofill'
import { VibeAutofillController } from './autofillController'
import { VibeAutoScrollController } from './autoScroll'
import {
  applyBackendAutofillUpdate,
  restoreBackendAutofillSession,
  startBackendAutofill,
} from './backendAutofill'
import { autofillInitialPage } from './initialAutofill'
import { VibeFillController } from './fillController'
import type { VibeSurfaceExpose } from './feed'
import { createFeedFooterActions } from './feedFooter'
import { createInitialRuntimeState } from './initialRuntimeState'
import { resolveVibeTarget, validateOptions } from './options'
import { appendUniqueItems, validatePage } from './page'
import { createRemovalControllers, type RemovalControllers } from './removalControllers'
import { ResponsiveLayoutController } from './responsiveLayoutController'
import { updateReelAutoAdvanceState } from './reelAutoAdvance'
import { setReelInfoSheetEnabled } from './reelInfoSheet'
import { VibeRouteSync } from './vibeRouting'
import { snapshotState, type VibeRuntimeState } from './runtime'
import type {
  CreateVibeOptions,
  VibeAutofillSessionSnapshot,
  VibeBackendAutofillUpdate,
  VibeBackendFillUpdate,
  VibeCursor,
  VibeFillSessionSnapshot,
  VibeFillTarget,
  VibeInstance,
  VibeItemId,
  VibeItemPlacement,
  VibeLayoutMode,
  VibeMediaRemoval,
  VibeMediaTarget,
  VibeRemoval,
  VibeReelAutoAdvanceOptions,
  VibeReelItemTarget,
  VibeReelNavigationResult,
  VibeState,
} from '../types'
class VibeController implements VibeInstance {
  private app: App<Element> | null = null
  private readonly autoScroll: VibeAutoScrollController
  private readonly autofillController: VibeAutofillController
  private abortController: AbortController | null = null
  private pendingRequest: Promise<void> | null = null
  private requestVersion = 0
  private readonly responsiveLayout: ResponsiveLayoutController
  private readonly routing: VibeRouteSync
  private readonly fillController: VibeFillController
  private readonly exactMediaRemoval: RemovalControllers['exactMediaRemoval']
  private readonly itemRemoval: RemovalControllers['itemRemoval']
  private readonly reelForward: RemovalControllers['reelForward']
  private readonly reelRemoval: RemovalControllers['reelRemoval']
  private surface: VibeSurfaceExpose | null = null
  private stopStateWatcher: WatchHandle | null = null
  private lastLoadedCursor: VibeCursor = null
  private readonly state: VibeRuntimeState

  constructor(private readonly options: CreateVibeOptions) {
    validateOptions(options)
    const layoutMode = options.layout ?? 'masonry'
    this.state = reactive(createInitialRuntimeState(options, layoutMode))
    this.autoScroll = new VibeAutoScrollController({
      getScrollElement: () => this.surface?.getAutoScrollElement() ?? null,
      state: this.state.autoScroll,
    })
    this.autofillController = new VibeAutofillController({
      cancelRequest: () => this.cancelRequest(),
      onLastCursor: (cursor) => { this.lastLoadedCursor = cursor },
      options: options.autofill,
      state: this.state,
    })
    this.fillController = new VibeFillController({
      fill: options.fill,
      loadPage: options.loadPage,
      onLastCursor: (cursor) => { this.lastLoadedCursor = cursor },
      state: this.state,
    })
    this.routing = new VibeRouteSync(options.routing, this.state)
    const removals = createRemovalControllers({
      historyLimit: options.removalHistoryLimit,
      loadNext: () => this.loadNext(),
      onActivate: (postId) => this.setActiveReelPost(postId),
      retryEnd: () => this.retryEnd(),
      state: this.state,
      surface: () => this.surface,
    })
    this.exactMediaRemoval = removals.exactMediaRemoval
    this.itemRemoval = removals.itemRemoval
    this.reelForward = removals.reelForward
    this.reelRemoval = removals.reelRemoval
    this.responsiveLayout = new ResponsiveLayoutController(layoutMode, this.state, () => {
      this.routing.syncFeed()
    })
    this.startStateNotifications()
  }
  async mount(): Promise<void> {
    if (this.app) throw new Error('Vibe is already mounted.')

    this.startStateNotifications()
    const target = resolveVibeTarget(this.options.target)
    this.responsiveLayout.mount(target)
    this.app = createApp(VibeSurface, {
      canRetryEnd: Boolean(this.options.loadPage),
      cardFooter: this.options.cardFooter,
      cardHeader: this.options.cardHeader,
      feedFooter: this.options.feedFooter,
      feedFooterActions: createFeedFooterActions(this),
      mediaCard: this.options.mediaCard,
      onMediaReady: this.options.onMediaReady,
      onReelMediaChange: this.options.onReelMediaChange,
      reelInfoSheet: this.options.reelInfoSheet,
      state: this.state,
      onActiveReelChange: (postId: VibeItemId) => {
        if (this.state.reelForward.status === 'idle') this.setActiveReelPost(postId)
      },
      onCloseReel: () => this.closeMasonryReel(),
      onLoadMore: () => { void this.loadNext() },
      onOpenReel: (postId: VibeItemId) => this.openMasonryReel(postId),
      onReelInfoSheetChange: (enabled: boolean) => this.setReelInfoSheet(enabled),
      onRetryEnd: () => { void this.retryEnd() },
      onRetryForward: () => { void this.retryReelForward() },
    })
    this.surface = this.app.mount(target) as unknown as VibeSurfaceExpose
    this.autoScroll.mount()

    if (!this.options.initialPage) await this.reload()
    else if (this.options.autofill && this.state.autofill.status === 'idle'
      && !this.fillController.isActive()) {
      await this.startInitialAutofill()
    }
  }
  destroy(): void {
    this.autoScroll.destroy()
    this.fillController.destroy()
    this.cancelRequest()
    this.reelForward.reset()
    this.reelRemoval.reset()
    this.exactMediaRemoval.reset()
    this.itemRemoval.destroy()
    this.responsiveLayout.destroy()
    this.stopStateWatcher?.()
    this.stopStateWatcher = null
    this.app?.unmount()
    this.app = null
    this.surface = null
  }
  getState(): VibeState {
    return snapshotState(this.state)
  }
  removeMedia(target: VibeMediaTarget): VibeMediaRemoval | null {
    return this.exactMediaRemoval.remove(target)
  }
  removeMediaAnimated(target: VibeMediaTarget): Promise<VibeMediaRemoval | null> {
    return this.reelRemoval.prepareMedia(target).then(() => this.exactMediaRemoval.remove(target))
  }
  removeItems(postIds: readonly VibeItemId[]): Promise<VibeRemoval> {
    return this.itemRemoval.remove(postIds)
  }

  restoreItems(placements: readonly VibeItemPlacement[]): void { this.itemRemoval.restoreItems(placements) }
  restoreMediaRemoval(removal: VibeMediaRemoval): boolean {
    return this.exactMediaRemoval.restore(removal)
  }
  restoreRemoval(removal: VibeRemoval): boolean { return this.itemRemoval.restoreRemoval(removal) }
  retryReelForward(): Promise<void> { return this.reelForward.retry() }
  undoLastRemoval(): VibeRemoval | null { return this.itemRemoval.undoLast() }
  nextReelMediaItem(): boolean { return this.surface?.changeActiveReelMedia(1) ?? false }
  previousReelMediaItem(): boolean { return this.surface?.changeActiveReelMedia(-1) ?? false }
  nextReelPost(): boolean { return this.surface?.moveActiveReelPost(1) ?? false }
  previousReelPost(): boolean { return this.surface?.moveActiveReelPost(-1) ?? false }
  navigateToReelItem(target: VibeReelItemTarget): VibeReelNavigationResult {
    return this.surface?.navigateToReelItem(target) ?? 'reel-inactive'
  }
  pauseAutoScroll(): void { this.autoScroll.setPaused(true) }
  resumeAutoScroll(): void { this.autoScroll.setPaused(false) }
  setAutoScroll(enabled: boolean, speedPxPerSecond?: number): void {
    this.autoScroll.setEnabled(enabled, speedPxPerSecond)
  }
  setAutoScrollSpeed(speedPxPerSecond: number): void {
    this.autoScroll.setSpeed(speedPxPerSecond)
  }
  applyAutofillUpdate(update: VibeBackendAutofillUpdate): boolean {
    const applied = applyBackendAutofillUpdate(this.options.autofill, this.state, update)
    if (applied) this.autofillController.syncCountdown()
    return applied
  }

  cancelAutofill(): Promise<void> { return this.autofillController.cancel() }
  applyFillUpdate(update: VibeBackendFillUpdate): boolean {
    return this.fillController.applyUpdate(update)
  }

  cancelFill(): Promise<void> {
    return this.fillController.cancel()
  }
  async fill(target: VibeFillTarget): Promise<void> {
    if (this.pendingRequest || isAutofillActive(this.state.autofill)) {
      throw new Error('Vibe cannot fill while another page operation is active.')
    }
    await this.fillController.start(target)
  }

  restoreAutofillSession(snapshot: VibeAutofillSessionSnapshot): boolean {
    const restored = restoreBackendAutofillSession(this.options.autofill, this.state, snapshot)
    if (restored) this.autofillController.syncCountdown()
    return restored
  }
  restoreFillSession(snapshot: VibeFillSessionSnapshot): boolean {
    return this.fillController.restoreSession(snapshot)
  }

  async loadNext(): Promise<void> {
    if (this.pendingRequest) return this.pendingRequest
    if (this.state.loadMoreLocked) return
    if (isAutofillActive(this.state.autofill) || this.fillController.isActive()) return
    if (this.state.next === null || !this.options.loadPage) return

    this.state.isLoadingMore = true
    this.state.nextPageError = null
    return this.startRequest(this.state.next, true)
  }

  async refresh(): Promise<void> { return this.replaceFeed(this.state.next ?? this.lastLoadedCursor, 'refresh') }
  async reload(): Promise<void> { return this.replaceFeed(null, 'reload') }

  private async replaceFeed(cursor: VibeCursor, action: 'refresh' | 'reload'): Promise<void> {
    if (!this.options.loadPage) throw new Error(`Vibe cannot ${action} without loadPage.`)

    if (isAutofillActive(this.state.autofill)) await this.cancelAutofill()
    if (this.fillController.isActive()) await this.cancelFill()
    this.cancelRequest()
    this.state.autofill = createAutofillState(this.options.autofill, undefined, false)
    this.fillController.reset()
    this.reelForward.reset()
    this.reelRemoval.reset()
    this.exactMediaRemoval.reset()
    this.itemRemoval.reset()
    this.state.error = null
    this.state.isLoading = true
    this.state.items = []
    this.state.next = null
    this.state.nextPageError = null
    this.state.total = null
    return this.startRequest(cursor, false)
  }

  async retryEnd(): Promise<void> {
    if (this.pendingRequest) return this.pendingRequest
    if (this.state.loadMoreLocked) return
    if (isAutofillActive(this.state.autofill) || this.fillController.isActive()) return
    if (this.state.next !== null || !this.options.loadPage) return

    this.state.isLoadingMore = true
    this.state.nextPageError = null
    return this.startRequest(this.lastLoadedCursor, true)
  }

  setInfiniteScroll(enabled: boolean): void {
    this.state.infiniteScroll = enabled
    if (enabled) {
      void nextTick(() => this.surface?.loadIfNearBottom())
    }
  }

  setLoadMoreLocked(locked: boolean): void {
    if (this.state.loadMoreLocked === locked) return
    this.state.loadMoreLocked = locked
    if (!locked && this.state.infiniteScroll) {
      void nextTick(() => this.surface?.loadIfNearBottom())
    }
  }

  setReelAutoAdvance(update: boolean | VibeReelAutoAdvanceOptions): void {
    updateReelAutoAdvanceState(this.state.reelAutoAdvance, update)
  }

  setReelInfoSheet(enabled: boolean): void {
    setReelInfoSheetEnabled(this.state.reelInfoSheet, this.options.reelInfoSheet, enabled)
  }

  setLayout(layout: VibeLayoutMode): void {
    this.responsiveLayout.setLayout(layout)
  }

  private closeMasonryReel(): void {
    if (this.state.reelOrigin !== 'masonry') return

    this.state.activeReelPostId = null
    this.state.reelOrigin = null
    this.routing.syncFeed()
  }

  private openMasonryReel(postId: VibeItemId): void {
    if (this.state.layout !== 'masonry') return
    if (!this.state.items.some((item) => item.postId === postId)) return

    this.state.activeReelPostId = postId
    this.state.reelOrigin = 'masonry'
    this.routing.syncReel(postId)
  }

  private setActiveReelPost(postId: VibeItemId): void {
    if (this.state.layout !== 'reel' && this.state.reelOrigin !== 'masonry') return
    this.state.activeReelPostId = postId
    this.routing.syncReel(postId)
  }
  private cancelRequest(): void {
    this.autofillController.clearCountdown()
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
    const autofillOptions = this.options.autofill
    const cycleId = autofillOptions ? this.autofillController.beginCycle() : null
    let pageCommitted = false
    this.abortController = abortController

    try {
      if (autofillOptions?.strategy === 'frontend') {
        const result = await collectFrontendAutofill({
          existingItems: append ? this.state.items : [],
          initialCursor: cursor,
          loadPage,
          onCollection: (collection) => this.autofillController.captureCollection(
            collection, requestVersion === this.requestVersion,
          ),
          onDelayChange: (delay) => {
            if (requestVersion === this.requestVersion) {
              Object.assign(this.state.autofill, delay)
            }
          },
          onProgress: (progress) => {
            if (requestVersion !== this.requestVersion) return
            Object.assign(this.state.autofill, progress, { status: 'filling' })
          },
          options: autofillOptions,
          signal: abortController.signal,
        })
        if (requestVersion !== this.requestVersion) return

        this.state.items = append
          ? appendUniqueItems(this.state.items, result.items)
          : [...result.items]
        this.lastLoadedCursor = result.lastCursor
        this.state.next = result.next
        if (result.total !== undefined) this.state.total = result.total
        Object.assign(this.state.autofill, {
          missing: result.missing,
          received: result.received,
          requests: result.requests,
          status: result.status,
        })
        this.autofillController.clearCollection()
        return
      }

      const page = validatePage(await loadPage({ cursor, signal: abortController.signal }))
      if (requestVersion !== this.requestVersion) return

      const currentItems = append ? this.state.items : []
      const items = appendUniqueItems(currentItems, page.items)
      const received = items.length - currentItems.length
      this.state.items = items
      this.lastLoadedCursor = cursor
      this.state.next = page.next
      if (page.total !== undefined) this.state.total = page.total
      pageCommitted = true

      if (autofillOptions?.strategy === 'backend' && cycleId) {
        Object.assign(this.state.autofill, {
          missing: Math.max(0, autofillOptions.pageSize - received),
          received,
          requests: 1,
        })

        if (received >= autofillOptions.pageSize) {
          this.state.autofill.status = 'complete'
          return
        }

        await startBackendAutofill(autofillOptions, this.state, {
          cycleId,
          feedKey: autofillOptions.feedKey,
          items: items.slice(currentItems.length),
          missing: autofillOptions.pageSize - received,
          next: page.next,
          pageSize: autofillOptions.pageSize,
          received,
          signal: abortController.signal,
          total: this.state.total,
        }, () => requestVersion === this.requestVersion)
        this.autofillController.syncCountdown()
      }
    } catch (error: unknown) {
      if (abortController.signal.aborted || requestVersion !== this.requestVersion) return

      if (autofillOptions) {
        this.state.autofill.error = error
        this.state.autofill.status = 'error'
      }
      if (!pageCommitted) {
        if (append) this.state.nextPageError = error
        else this.state.error = error
      }
    } finally {
      if (requestVersion === this.requestVersion) {
        this.autofillController.clearCollection()
        this.abortController = null
        this.state.isLoading = false
        this.state.isLoadingMore = false
      }
    }
  }

  private startRequest(cursor: VibeCursor, append: boolean): Promise<void> {
    const request = this.fetchPage(cursor, append)
    this.pendingRequest = request

    return request.finally(() => {
      if (this.pendingRequest === request) this.pendingRequest = null
    })
  }

  private startInitialAutofill(): Promise<void> {
    const requestVersion = ++this.requestVersion
    const abortController = new AbortController()
    const cycleId = this.autofillController.beginCycle()
    this.abortController = abortController
    this.state.isLoadingMore = true

    const request = autofillInitialPage({
      cycleId,
      isCurrent: () => requestVersion === this.requestVersion,
      onCollection: (collection) => this.autofillController.captureCollection(
        collection, requestVersion === this.requestVersion,
      ),
      onLastCursor: (cursor) => { this.lastLoadedCursor = cursor },
      options: this.options,
      signal: abortController.signal,
      state: this.state,
    }).catch((error: unknown) => {
      if (abortController.signal.aborted || requestVersion !== this.requestVersion) return
      this.state.autofill.error = error
      this.state.autofill.status = 'error'
      this.state.nextPageError = error
    }).finally(() => {
      if (requestVersion !== this.requestVersion) return
      this.autofillController.clearCollection()
      this.autofillController.syncCountdown()
      this.abortController = null
      this.state.isLoadingMore = false
      if (this.pendingRequest === request) this.pendingRequest = null
    })
    this.pendingRequest = request
    return request
  }

  private startStateNotifications(): void {
    const onStateChange = this.options.onStateChange
    if (!onStateChange || this.stopStateWatcher) return

    onStateChange(this.getState())
    this.stopStateWatcher = watch(
      this.state,
      () => onStateChange(this.getState()),
      { deep: true, flush: 'post' },
    )
  }
}
export function createVibe(options: CreateVibeOptions): VibeInstance {
  return new VibeController(options)
}
