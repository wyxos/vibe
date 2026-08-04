import { onBeforeUnmount, onMounted } from 'vue'

import type { FeedRendererExpose } from '../core/feed'
import {
  isTopmostActiveReel,
  registerReelEscapeParticipant,
  type ReelEscapeParticipant,
} from '../core/reelEscapeStack'
import type { VibeRuntimeState } from '../core/runtime'

interface ReelKeyboardOptions {
  closeMasonryReel: () => void
  element: () => HTMLElement | null
  isReelLeaving: () => boolean
  reelRenderer: () => FeedRendererExpose | null
  setReelInfoSheet: (enabled: boolean) => void
  state: VibeRuntimeState
}

export function useReelKeyboard(options: ReelKeyboardOptions): void {
  const participant: ReelEscapeParticipant = {
    element: options.element,
    isActive: () => options.state.layout === 'reel' || options.state.reelOrigin === 'masonry',
  }
  let unregister: (() => void) | null = null

  function onKeydown(event: KeyboardEvent): void {
    const reelActive = participant.isActive()
    if (event.key === 'Escape' && reelActive && !isTopmostActiveReel(participant)) return

    if (event.key === 'Escape' && options.state.reelOrigin === 'masonry') {
      event.preventDefault()
      if (options.state.reelInfoSheetOverlay && options.state.reelInfoSheet.enabled) {
        options.setReelInfoSheet(false)
      }
      options.closeMasonryReel()
      return
    }
    if (event.key === 'Escape' && reelActive && options.state.reelInfoSheet.enabled) {
      event.preventDefault()
      options.setReelInfoSheet(false)
      return
    }
    if (
      event.defaultPrevented
      || event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
      || options.isReelLeaving()
      || !reelActive
    ) return

    const target = event.target
    if (
      target instanceof HTMLElement
      && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
    ) return

    const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    if (direction !== 0 && options.reelRenderer()?.changeActiveMedia?.(direction)) {
      event.preventDefault()
    }
  }

  onMounted(() => {
    unregister = registerReelEscapeParticipant(participant)
    window.addEventListener('keydown', onKeydown)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    unregister?.()
    unregister = null
  })
}
