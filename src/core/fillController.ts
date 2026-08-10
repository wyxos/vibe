import {
  applyBackendFillUpdate,
  restoreBackendFillSession,
  startBackendFill,
} from './backendFill'
import {
  collectFrontendFill,
  createFillState,
  isFillActive,
  type FrontendFillCollection,
  type FrontendFillProgress,
  validateFillTarget,
} from './fill'
import { appendUniqueItems } from './page'
import type { LoadedPageRecord } from './page'
import { RequestDelayCountdown, type RequestDelaySnapshot } from './requestDelay'
import type { VibeRuntimeState } from './runtime'
import type {
  VibeBackendFillUpdate,
  VibeCursor,
  VibeFillOptions,
  VibeFrontendFillOptions,
  VibeFillSessionSnapshot,
  VibeFillTarget,
  VibePageLoader,
} from '../types'

interface FillControllerOptions {
  fill?: VibeFillOptions
  loadPage?: VibePageLoader
  needsFrontendPreparation?: () => boolean
  onLastCursor: (cursor: VibeCursor) => void
  onPages: (pages: readonly LoadedPageRecord[]) => void
  prepareFrontend?: (context: {
    isCurrent: () => boolean
    onDelayChange: (snapshot: RequestDelaySnapshot) => void
    signal: AbortSignal
  }) => Promise<'complete' | 'paused' | 'skipped'>
  state: VibeRuntimeState
}

interface FillStartOptions {
  cycleId?: string
  prepareFrontend?: boolean
  progressOffset?: Pick<FrontendFillProgress, 'completedPages' | 'received'>
  target?: VibeFillTarget
}

export class VibeFillController {
  private abortController: AbortController | null = null
  private cycle = 0
  private readonly delayCountdown: RequestDelayCountdown
  private requestVersion = 0
  private collection: FrontendFillCollection | null = null

  constructor(private readonly options: FillControllerOptions) {
    this.delayCountdown = new RequestDelayCountdown((delay) => {
      Object.assign(this.options.state.fill, delay)
    })
    this.syncBackendCountdown()
  }

  isActive(): boolean {
    return isFillActive(this.options.state.fill)
  }

  applyUpdate(update: VibeBackendFillUpdate): boolean {
    const applied = applyBackendFillUpdate(
      this.options.fill,
      this.options.state,
      update,
      this.options.onLastCursor,
    )
    if (applied) this.syncBackendCountdown()
    return applied
  }

  restoreSession(snapshot: VibeFillSessionSnapshot): boolean {
    const restored = restoreBackendFillSession(
      this.options.fill,
      this.options.state,
      snapshot,
      this.options.onLastCursor,
    )
    if (restored) this.syncBackendCountdown()
    return restored
  }

  async start(
    targetValue: VibeFillTarget,
    startOptions: FillStartOptions = {},
  ): Promise<void> {
    const fillOptions = this.options.fill
    if (!fillOptions) throw new Error('Vibe fill is not configured.')
    if (this.isActive()) throw new Error('Vibe fill is already active.')

    const target = validateFillTarget(targetValue)
    const stateTarget = validateFillTarget(startOptions.target ?? target)
    const progressOffset = startOptions.progressOffset ?? { completedPages: 0, received: 0 }
    const cycleId = startOptions.cycleId
      ?? `vibe-fill-${Date.now().toString(36)}-${++this.cycle}`
    this.options.state.fill = {
      ...createFillState(fillOptions, undefined, false),
      completedPages: progressOffset.completedPages,
      cycleId,
      received: progressOffset.received,
      status: 'filling',
      target: stateTarget,
    }

    if (fillOptions.strategy === 'backend' && this.options.state.next === null) {
      this.options.state.fill.status = 'until' in target ? 'complete' : 'exhausted'
      return
    }

    const requestVersion = ++this.requestVersion
    const controller = new AbortController()
    this.abortController = controller

    try {
      if (fillOptions.strategy === 'frontend') {
        await this.startFrontend(
          fillOptions,
          target,
          controller,
          requestVersion,
          startOptions.prepareFrontend !== false,
          progressOffset,
        )
      } else {
        await startBackendFill(fillOptions, this.options.state, {
          cycleId,
          feedKey: fillOptions.feedKey,
          items: [...this.options.state.items],
          next: this.options.state.next,
          signal: controller.signal,
          target,
          total: this.options.state.total,
        }, () => this.isCurrent(requestVersion))
        this.syncBackendCountdown()
      }
    } catch (error: unknown) {
      if (controller.signal.aborted || !this.isCurrent(requestVersion)) return
      this.commitCollection()
      this.options.state.fill.error = error
      this.options.state.fill.status = 'error'
      throw error
    } finally {
      if (this.isCurrent(requestVersion)) {
        this.abortController = null
        this.options.state.isLoadingMore = false
      }
    }
  }

  async cancel(): Promise<void> {
    const { fill, state } = this.options
    if (!isFillActive(state.fill) || !state.fill.cycleId) return

    const context = {
      cycleId: state.fill.cycleId,
      feedKey: state.fill.feedKey ?? '',
      sessionId: state.fill.sessionId,
    }
    state.fill.status = 'cancelling'
    this.delayCountdown.clear()
    this.abortController?.abort()
    this.requestVersion += 1
    this.abortController = null
    state.isLoadingMore = false
    this.commitCollection()

    try {
      if (fill?.strategy === 'backend') await fill.onCancel(context)
      state.fill.error = null
      state.fill.status = 'cancelled'
    } catch (error: unknown) {
      state.fill.error = error
      state.fill.status = 'error'
      throw error
    }
  }

  resume(prepareFrontend: boolean): Promise<void> {
    const { fill } = this.options.state
    if (fill.status !== 'paused' || !fill.target) return Promise.resolve()

    const target = fill.target
    const remaining = 'pages' in target ? target.pages - fill.completedPages : null
    if (remaining !== null && remaining <= 0) {
      fill.status = 'complete'
      return Promise.resolve()
    }
    const continuation = remaining === null ? target : { pages: remaining }
    if (fill.strategy === 'backend') return this.start(continuation)
    return this.start(
      continuation,
      {
        cycleId: fill.cycleId ?? undefined,
        prepareFrontend,
        progressOffset: {
          completedPages: fill.completedPages,
          received: fill.received,
        },
        target,
      },
    )
  }

  retry(prepareFrontend: boolean): Promise<void> {
    const { fill } = this.options.state
    if (fill.status !== 'error' || !fill.target) return Promise.resolve()
    const target = fill.target
    const remainingPages = 'pages' in target ? target.pages - fill.completedPages : null
    if (remainingPages !== null && remainingPages <= 0) {
      fill.status = 'complete'
      return Promise.resolve()
    }
    return this.start(
      remainingPages === null ? target : { pages: remainingPages },
      {
        cycleId: fill.cycleId ?? undefined,
        prepareFrontend,
        progressOffset: {
          completedPages: fill.completedPages,
          received: fill.received,
        },
        target,
      },
    )
  }

  reset(): void {
    this.abortLocalRequest()
    this.delayCountdown.clear()
    this.options.state.fill = createFillState(this.options.fill, undefined, false)
    this.collection = null
  }

  destroy(): void {
    this.abortLocalRequest()
    this.delayCountdown.clear()
  }

  private abortLocalRequest(): void {
    this.requestVersion += 1
    this.abortController?.abort()
    this.abortController = null
    this.options.state.isLoadingMore = false
  }

  private isCurrent(requestVersion: number): boolean {
    return requestVersion === this.requestVersion
      && !['cancelled', 'cancelling'].includes(this.options.state.fill.status)
  }

  private async startFrontend(
    options: VibeFrontendFillOptions,
    target: VibeFillTarget,
    controller: AbortController,
    requestVersion: number,
    prepareFrontend: boolean,
    progressOffset: Pick<FrontendFillProgress, 'completedPages' | 'received'>,
  ): Promise<void> {
    const loadPage = this.options.loadPage
    if (!loadPage) throw new Error('Vibe frontend fill requires loadPage.')

    const state = this.options.state
    state.isLoadingMore = true
    if (prepareFrontend && this.options.prepareFrontend
      && (this.options.needsFrontendPreparation?.() ?? true)) {
      state.fill.status = 'restoring'
      const preparation = await this.options.prepareFrontend({
        isCurrent: () => this.isCurrent(requestVersion),
        onDelayChange: (delay) => {
          if (this.isCurrent(requestVersion)) Object.assign(state.fill, delay)
        },
        signal: controller.signal,
      })
      if (!this.isCurrent(requestVersion)) return
      if (preparation === 'paused' || state.loadMoreLocked) {
        state.fill.status = 'paused'
        return
      }
      state.fill.status = 'filling'
    }
    if (state.next === null) {
      state.fill.status = 'until' in target ? 'complete' : 'exhausted'
      return
    }
    const result = await collectFrontendFill({
      existingItems: state.items,
      initialCursor: state.next,
      loadPage,
      onCollection: (collection) => {
        if (this.isCurrent(requestVersion)) {
          this.collection = {
            ...collection,
            completedPages: progressOffset.completedPages + collection.completedPages,
            received: progressOffset.received + collection.received,
          }
          this.commitCollection()
        }
      },
      onDelayChange: (delay) => {
        if (this.isCurrent(requestVersion)) Object.assign(state.fill, delay)
      },
      onProgress: (progress) => {
        if (this.isCurrent(requestVersion)) {
          Object.assign(state.fill, {
            ...progress,
            completedPages: progressOffset.completedPages + progress.completedPages,
            received: progressOffset.received + progress.received,
          })
        }
      },
      options,
      shouldPause: () => state.loadMoreLocked,
      signal: controller.signal,
      target,
    })
    if (!this.isCurrent(requestVersion)) return

    state.items = appendUniqueItems(state.items, result.items)
    state.next = result.next
    if (result.total !== undefined) state.total = result.total
    this.options.onLastCursor(result.lastCursor)
    Object.assign(state.fill, {
      completedPages: progressOffset.completedPages + result.completedPages,
      received: progressOffset.received + result.received,
      status: result.status,
    })
    this.collection = null
  }

  private commitCollection(): void {
    const collection = this.collection
    this.collection = null
    if (!collection || this.options.fill?.strategy !== 'frontend') return

    const state = this.options.state
    state.items = appendUniqueItems(state.items, collection.items)
    state.next = collection.next
    if (collection.total !== undefined) state.total = collection.total
    this.options.onLastCursor(collection.lastCursor)
    this.options.onPages(collection.pages)
    Object.assign(state.fill, {
      completedPages: collection.completedPages,
      received: collection.received,
    })
  }

  private syncBackendCountdown(): void {
    const fill = this.options.state.fill
    this.delayCountdown.sync(
      fill.strategy === 'backend' && fill.status === 'waiting'
        ? fill.nextRequestAt
        : null,
    )
  }
}
