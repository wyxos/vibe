import { clampMediaIndex } from './mediaAsset'
import { validatePage } from './page'
import type { VibeSurfaceExpose } from './feed'
import type { VibeRuntimeState } from './runtime'
import type { VibeItem, VibePage } from '../types'

export interface VibePageReplacementOptions {
  /** Scroll masonry to its beginning after the outgoing cards leave. */
  resetScroll?: boolean
}

interface PageReplacementOptions {
  commit: (page: VibePage) => void
  prepare: () => Promise<void>
  state: VibeRuntimeState
  surface: () => VibeSurfaceExpose | null
}

export class PageReplacementController {
  private controller: AbortController | null = null

  constructor(private readonly options: PageReplacementOptions) {}

  isActive(): boolean { return this.controller !== null }

  cancel(): void {
    this.controller?.abort()
    this.controller = null
    this.options.surface()?.cancelItemRemoval()
  }

  async replace(pageValue: VibePage, options?: VibePageReplacementOptions): Promise<void> {
    const page = validatePage(pageValue)
    this.cancel()
    const controller = new AbortController()
    this.controller = controller
    try {
      await this.options.prepare()
      if (controller.signal.aborted) return
      const state = this.options.state
      const current = new Map(state.items.map((item) => [String(item.postId), item]))
      const items: VibeItem[] = []
      const incomingIds = new Set<string>()
      for (const item of page.items) {
        const id = String(item.postId)
        if (incomingIds.has(id)) continue
        incomingIds.add(id)
        // Retain the stored key's type so matching Vue cards keep their DOM.
        items.push({ ...item, postId: current.get(id)?.postId ?? item.postId })
      }
      const outgoing = state.items
        .filter((item) => !incomingIds.has(String(item.postId)))
        .map((item) => item.postId)
      await this.options.surface()?.animateItemRemoval(outgoing, controller.signal)
      if (controller.signal.aborted) return
      if (options?.resetScroll) {
        const scroller = this.options.surface()?.getAutoScrollElement()
        if (scroller) scroller.scrollTop = 0
      }
      state.mediaIndices = new Map(items.map((item) => [
        item.postId, clampMediaIndex(item, state.mediaIndices.get(item.postId) ?? 0),
      ]))
      if (state.activeReelPostId !== null && !incomingIds.has(String(state.activeReelPostId))) {
        state.activeReelPostId = null
        state.reelOrigin = null
      }
      state.items = items
      state.next = page.next
      state.total = page.total ?? null
      state.error = null
      state.nextPageError = null
      this.options.commit({ ...page, items })
    } finally {
      if (this.controller === controller) {
        this.controller = null
        this.options.surface()?.cancelItemRemoval()
      }
    }
  }
}
