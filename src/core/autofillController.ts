import {
  cancelAutofill,
  createAutofillState,
  type FrontendAutofillCollection,
} from './autofill'
import { appendUniqueItems } from './page'
import { RequestDelayCountdown } from './requestDelay'
import type { VibeRuntimeState } from './runtime'
import type { VibeAutofillOptions, VibeCursor } from '../types'

interface AutofillControllerContext {
  cancelRequest: () => void
  onLastCursor: (cursor: VibeCursor) => void
  options?: VibeAutofillOptions
  state: VibeRuntimeState
}

export class VibeAutofillController {
  private collection: FrontendAutofillCollection | null = null
  private cycle = 0
  private readonly delayCountdown: RequestDelayCountdown

  constructor(private readonly context: AutofillControllerContext) {
    this.delayCountdown = new RequestDelayCountdown(
      (delay) => Object.assign(context.state.autofill, delay),
    )
    this.syncCountdown()
  }

  beginCycle(): string {
    const { options, state } = this.context
    if (!options) return ''

    this.clear()
    const cycleId = `vibe-autofill-${Date.now().toString(36)}-${++this.cycle}`
    state.autofill = {
      ...createAutofillState(options, undefined, false),
      cycleId,
      status: 'filling',
    }
    return cycleId
  }

  async cancel(): Promise<void> {
    const { cancelRequest, options, state } = this.context
    await cancelAutofill(options, state, cancelRequest)
    this.commitCollection()
  }

  captureCollection(collection: FrontendAutofillCollection, isCurrent: boolean): void {
    if (isCurrent) this.collection = collection
  }

  private clear(): void {
    this.delayCountdown.clear()
    this.collection = null
  }

  clearCountdown(): void {
    this.delayCountdown.clear()
  }

  clearCollection(): void {
    this.collection = null
  }

  syncCountdown(): void {
    const { autofill } = this.context.state
    this.delayCountdown.sync(
      autofill.strategy === 'backend' && autofill.status === 'waiting'
        ? autofill.nextRequestAt
        : null,
    )
  }

  private commitCollection(): void {
    const { onLastCursor, options, state } = this.context
    if (options?.strategy !== 'frontend') return

    const collection = this.collection
    this.collection = null
    if (!collection) return

    state.items = appendUniqueItems(state.items, collection.items)
    onLastCursor(collection.lastCursor)
    state.next = collection.next
    if (collection.total !== undefined) state.total = collection.total
    Object.assign(state.autofill, {
      missing: collection.missing,
      received: collection.received,
      requests: collection.requests,
    })
  }
}
