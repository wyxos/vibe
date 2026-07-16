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
import type { VibeRuntimeState } from './runtime'
import type {
  VibeBackendFillUpdate,
  VibeCursor,
  VibeFillOptions,
  VibeFillSessionSnapshot,
  VibeFillTarget,
  VibePageLoader,
} from '../types'

interface FillControllerOptions {
  fill?: VibeFillOptions
  loadPage?: VibePageLoader
  onLastCursor: (cursor: VibeCursor) => void
  state: VibeRuntimeState
}

export class VibeFillController {
  private abortController: AbortController | null = null
  private cycle = 0
  private requestVersion = 0

  constructor(private readonly options: FillControllerOptions) {}

  isActive(): boolean {
    return isFillActive(this.options.state.fill)
  }

  applyUpdate(update: VibeBackendFillUpdate): boolean {
    return applyBackendFillUpdate(
      this.options.fill,
      this.options.state,
      update,
      this.options.onLastCursor,
    )
  }

  restoreSession(snapshot: VibeFillSessionSnapshot): boolean {
    return restoreBackendFillSession(
      this.options.fill,
      this.options.state,
      snapshot,
      this.options.onLastCursor,
    )
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
        await this.startFrontend(target, controller, requestVersion)
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
    this.options.state.fill = createFillState(this.options.fill, undefined, false)
  }

  destroy(): void {
    this.abortLocalRequest()
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
      onProgress: (progress) => {
        if (this.isCurrent(requestVersion)) Object.assign(state.fill, progress)
      },
      signal: controller.signal,
      target,
    })
    if (!this.isCurrent(requestVersion)) return

    state.items = appendUniqueItems(state.items, result.items)
    state.next = result.next
    if (result.total !== undefined) state.total = result.total
    this.options.onLastCursor(result.lastCursor)
    Object.assign(state.fill, {
      completedPages: result.completedPages,
      received: result.received,
      status: result.status,
    })
  }
}
