import {
  applyBackendFillUpdate,
  restoreBackendFillSession,
  startBackendFill,
} from './backendFill'
import {
  collectFrontendFill,
  createFillState,
  isFillActive,
  validateFillTarget,
} from './fill'
import { appendUniqueItems } from './page'
import type { LoadedPageRecord } from './page'
import { RequestDelayCountdown } from './requestDelay'
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
  onLastCursor: (cursor: VibeCursor) => void
  onPages: (pages: readonly LoadedPageRecord[]) => void
  state: VibeRuntimeState
}

export class VibeFillController {
  private abortController: AbortController | null = null
  private cycle = 0
  private readonly delayCountdown: RequestDelayCountdown
  private requestVersion = 0

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

  async start(targetValue: VibeFillTarget): Promise<void> {
    const fillOptions = this.options.fill
    if (!fillOptions) throw new Error('Vibe fill is not configured.')
    if (this.isActive()) throw new Error('Vibe fill is already active.')

    const target = validateFillTarget(targetValue)
    const cycleId = `vibe-fill-${Date.now().toString(36)}-${++this.cycle}`
    this.options.state.fill = {
      ...createFillState(fillOptions, undefined, false),
      cycleId,
      status: 'filling',
      target,
    }

    if (this.options.state.next === null) {
      this.options.state.fill.status = 'pages' in target ? 'exhausted' : 'complete'
      return
    }

    const requestVersion = ++this.requestVersion
    const controller = new AbortController()
    this.abortController = controller

    try {
      if (fillOptions.strategy === 'frontend') {
        await this.startFrontend(fillOptions, target, controller, requestVersion)
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

  reset(): void {
    this.abortLocalRequest()
    this.delayCountdown.clear()
    this.options.state.fill = createFillState(this.options.fill, undefined, false)
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
  ): Promise<void> {
    const loadPage = this.options.loadPage
    if (!loadPage) throw new Error('Vibe frontend fill requires loadPage.')

    const state = this.options.state
    state.isLoadingMore = true
    const result = await collectFrontendFill({
      existingItems: state.items,
      initialCursor: state.next,
      loadPage,
      onDelayChange: (delay) => {
        if (this.isCurrent(requestVersion)) Object.assign(state.fill, delay)
      },
      onProgress: (progress) => {
        if (this.isCurrent(requestVersion)) Object.assign(state.fill, progress)
      },
      options,
      signal: controller.signal,
      target,
    })
    if (!this.isCurrent(requestVersion)) return

    state.items = appendUniqueItems(state.items, result.items)
    state.next = result.next
    if (result.total !== undefined) state.total = result.total
    this.options.onLastCursor(result.lastCursor)
    this.options.onPages(result.pages)
    Object.assign(state.fill, {
      completedPages: result.completedPages,
      received: result.received,
      status: result.status,
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
