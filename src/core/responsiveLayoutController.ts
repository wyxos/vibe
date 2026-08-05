import type {
  VibeLayout,
  VibeLayoutMode,
} from '../types'
import {
  resolvePhoneModeForElement,
  resolveResponsiveLayoutForElement,
} from './responsiveLayout'
import type { VibeRuntimeState } from './runtime'

export class ResponsiveLayoutController {
  private layoutMode: VibeLayoutMode
  private resizeObserver: ResizeObserver | null = null
  private target: Element | null = null

  constructor(
    layoutMode: VibeLayoutMode,
    private readonly state: VibeRuntimeState,
    private readonly onFeedLayout: () => void,
  ) {
    this.layoutMode = layoutMode
  }

  mount(target: Element): void {
    this.target = target
    this.handleResponsiveLayout()

    const view = target.ownerDocument.defaultView
    view?.addEventListener('resize', this.handleResponsiveLayout)

    const ResizeObserverConstructor = view?.ResizeObserver ?? globalThis.ResizeObserver
    if (typeof ResizeObserverConstructor === 'undefined') return

    this.resizeObserver = new ResizeObserverConstructor(this.handleResponsiveLayout)
    this.resizeObserver.observe(target)
  }

  destroy(): void {
    this.target?.ownerDocument.defaultView
      ?.removeEventListener('resize', this.handleResponsiveLayout)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.target = null
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
      this.onFeedLayout()
    }
    this.state.reelOrigin = null
    this.state.layout = layout
  }

  private readonly handleResponsiveLayout = (): void => {
    if (!this.target) return

    const responsiveLayout = resolveResponsiveLayoutForElement(this.target)
    this.state.phoneMode = resolvePhoneModeForElement(this.target)
    this.state.reelInfoSheetOverlay = this.state.phoneMode
    this.state.reelMediaSource = responsiveLayout === 'reel' ? 'preview' : 'original'
    if (this.layoutMode === 'responsive') this.applyLayout(responsiveLayout)
  }
}
