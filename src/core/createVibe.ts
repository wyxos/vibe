import { createApp, nextTick, reactive, watch, type App, type WatchHandle } from 'vue'

import VibeSurface from '../components/VibeSurface.vue'
import {
  cancelAutofill,
  collectFrontendAutofill,
  createAutofillState,
  isAutofillActive,
} from './autofill'
import { VibeAutoScrollController } from './autoScroll'
import {
  applyBackendAutofillUpdate,
  restoreBackendAutofillSession,
  startBackendAutofill,
} from './backendAutofill'
import { resolvePhoneModeForElement, resolveResponsiveLayoutForElement } from './responsiveLayout'
import { autofillInitialPage } from './initialAutofill'
import { VibeFillController } from './fillController'
import type { VibeSurfaceExpose } from './feed'
import { createInitialRuntimeState } from './initialRuntimeState'
import { resolveVibeTarget, validateOptions } from './options'
import { appendUniqueItems, validatePage } from './page'
import { RequestDelayCountdown } from './requestDelay'
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
  VibeLayout,
  VibeLayoutMode,
  VibeReelAutoAdvanceOptions,
  VibeState,
} from '../types'

class VibeController implements VibeInstance {
  private app: App<Element> | null = null
  private readonly autoScroll: VibeAutoScrollController
  private readonly autofillDelayCountdown: RequestDelayCountdown
  private autofillCycle = 0
  private abortController: AbortController | null = null
  private pendingRequest: Promise<void> | null = null
  private requestVersion = 0
  private resizeObserver: ResizeObserver | null = null
  private readonly routing: VibeRouteSync
  private readonly fillController: VibeFillController
  private surface: VibeSurfaceExpose | null = null
  private stopStateWatcher: WatchHandle | null = null
  private target: Element | null = null
  private layoutMode: VibeLayoutMode
  private lastLoadedCursor: VibeCursor = null
  private readonly state: VibeRuntimeState

  constructor(private readonly options: CreateVibeOptions) {
    validateOptions(options)
    this.layoutMode = options.layout ?? 'masonry'
    this.state = reactive(createInitialRuntimeState(options, this.layoutMode))
    this.autoScroll = new VibeAutoScrollController({
      getScrollElement: () => this.surface?.getAutoScrollElement() ?? null,
      state: this.state.autoScroll,
    })
    this.autofillDelayCountdown = new RequestDelayCountdown(
      (delay) => Object.assign(this.state.autofill, delay),
    )
    this.syncAutofillCountdown()
    this.fillController = new VibeFillController({
      fill: options.fill,
      loadPage: options.loadPage,
      onLastCursor: (cursor) => { this.lastLoadedCursor = cursor },
      state: this.state,
    })
    this.routing = new VibeRouteSync(options.routing, this.state)
    this.startStateNotifications()
  }

  async mount(): Promise<void> {
    if (this.app) throw new Error('Vibe is already mounted.')

    this.startStateNotifications()
    const target = resolveVibeTarget(this.options.target)
    this.target = target
    this.startResponsiveLayout()
    this.app = createApp(VibeSurface, {
      canRetryEnd: Boolean(this.options.loadPage),
      cardFooter: this.options.cardFooter,
      cardHeader: this.options.cardHeader,
      reelInfoSheet: this.options.reelInfoSheet,
      state: this.state,
      onActiveReelChange: (postId: VibeItemId) => this.setActiveReelPost(postId),
      onCloseReel: () => this.closeMasonryReel(),
      onLoadMore: () => { void this.loadNext() },
      onOpenReel: (postId: VibeItemId) => this.openMasonryReel(postId),
      onReelInfoSheetChange: (enabled: boolean) => this.setReelInfoSheet(enabled),
      onRetryEnd: () => { void this.retryEnd() },
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
    this.stopResponsiveLayout()
    this.stopStateWatcher?.()
    this.stopStateWatcher = null
    this.app?.unmount()
    this.app = null
    this.surface = null
    this.target = null
  }

  getState(): VibeState {
    return snapshotState(this.state)
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
    if (applied) this.syncAutofillCountdown()
    return applied
  }

  async cancelAutofill(): Promise<void> {
    await cancelAutofill(this.options.autofill, this.state, () => this.cancelRequest())
  }

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
    if (restored) this.syncAutofillCountdown()
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

  async reload(): Promise<void> {
    if (!this.options.loadPage) {
      throw new Error('Vibe cannot reload without loadPage.')
    }

    if (isAutofillActive(this.state.autofill)) await this.cancelAutofill()
    if (this.fillController.isActive()) await this.cancelFill()
    this.cancelRequest()
    this.state.autofill = createAutofillState(this.options.autofill, undefined, false)
    this.fillController.reset()
    this.state.error = null
    this.state.isLoading = true
    this.state.items = []
    this.state.next = null
    this.state.nextPageError = null
    this.state.total = null
    return this.startRequest(null, false)
  }

  private async retryEnd(): Promise<void> {
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
    if (layout === this.layoutMode) return

    this.layoutMode = layout
    if (layout === 'responsive') this.handleResponsiveLayout()
    else this.applyLayout(layout)
  }

  private applyLayout(layout: VibeLayout): void {
    if (layout === this.state.layout) return

    if (layout === 'masonry') {
      this.state.activeReelPostId = null
      this.routing.syncFeed()
    }
    this.state.reelOrigin = null
    this.state.layout = layout
  }

  private readonly handleResponsiveLayout = (): void => {
    if (!this.target) return

    const responsiveLayout = resolveResponsiveLayoutForElement(this.target)
    this.state.reelInfoSheetOverlay = resolvePhoneModeForElement(this.target)
    this.state.reelMediaSource = responsiveLayout === 'reel' ? 'preview' : 'original'
    if (this.layoutMode === 'responsive') this.applyLayout(responsiveLayout)
  }

  private startResponsiveLayout(): void {
    if (!this.target) return

    this.handleResponsiveLayout()
    const view = this.target.ownerDocument.defaultView
    view?.addEventListener('resize', this.handleResponsiveLayout)

    const ResizeObserverConstructor = view?.ResizeObserver ?? globalThis.ResizeObserver
    if (typeof ResizeObserverConstructor === 'undefined') return

    this.resizeObserver = new ResizeObserverConstructor(this.handleResponsiveLayout)
    this.resizeObserver.observe(this.target)
  }

  private stopResponsiveLayout(): void {
    this.target?.ownerDocument.defaultView
      ?.removeEventListener('resize', this.handleResponsiveLayout)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
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
    this.autofillDelayCountdown.clear()
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
    const cycleId = autofillOptions ? this.beginAutofillCycle() : null
    let pageCommitted = false
    this.abortController = abortController

    try {
      if (autofillOptions?.strategy === 'frontend') {
        const result = await collectFrontendAutofill({
          existingItems: append ? this.state.items : [],
          initialCursor: cursor,
          loadPage,
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
        this.syncAutofillCountdown()
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
        this.abortController = null
        this.state.isLoading = false
        this.state.isLoadingMore = false
      }
    }
  }

  private beginAutofillCycle(): string {
    const options = this.options.autofill
    if (!options) return ''

    this.autofillDelayCountdown.clear()
    const cycleId = `vibe-autofill-${Date.now().toString(36)}-${++this.autofillCycle}`
    this.state.autofill = {
      ...createAutofillState(options, undefined, false),
      cycleId,
      status: 'filling',
    }
    return cycleId
  }

  private syncAutofillCountdown(): void {
    const autofill = this.state.autofill
    this.autofillDelayCountdown.sync(
      autofill.strategy === 'backend' && autofill.status === 'waiting'
        ? autofill.nextRequestAt
        : null,
    )
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
    const cycleId = this.beginAutofillCycle()
    this.abortController = abortController
    this.state.isLoadingMore = true

    const request = autofillInitialPage({
      cycleId,
      isCurrent: () => requestVersion === this.requestVersion,
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
      this.syncAutofillCountdown()
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
