import { computed, inject, onBeforeUnmount, onMounted, provide, shallowRef, type InjectionKey } from 'vue'
import { updateReelAutoAdvanceState } from '../core/reelAutoAdvance'
import type { VibeReelAutoAdvanceOptions, VibeReelAutoAdvanceState } from '../types'

const key: InjectionKey<ReturnType<typeof createPlaybackOptions>> = Symbol('reel-playback-options')

function createPlaybackOptions(element: () => HTMLElement | null, autoAdvance: () => VibeReelAutoAdvanceState) {
  const fullscreenElement = shallowRef<Element | null>(null)
  const fullscreen = computed(() => {
    const surface = element()
    const current = fullscreenElement.value
    return !!surface && !!current && (current.contains(surface) || surface.contains(current))
  })
  const canFullscreen = computed(() => fullscreen.value || (
    typeof document !== 'undefined' && document.fullscreenEnabled === true
    && typeof element()?.requestFullscreen === 'function'
  ))
  function syncFullscreen() { fullscreenElement.value = document.fullscreenElement }
  async function toggleFullscreen() {
    try {
      syncFullscreen()
      if (fullscreen.value) await document.exitFullscreen()
      else if (canFullscreen.value) await element()?.requestFullscreen()
    } catch {
      // Browsers can deny a request even when the API is available.
    }
  }
  onMounted(() => {
    syncFullscreen()
    document.addEventListener('fullscreenchange', syncFullscreen)
  })
  onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen))
  return {
    fullscreen, canFullscreen, toggleFullscreen,
    autoAdvance: computed(autoAdvance),
    setAutoAdvance: (update: VibeReelAutoAdvanceOptions) => updateReelAutoAdvanceState(autoAdvance(), update),
  }
}

export function provideReelPlaybackOptions(element: () => HTMLElement | null, autoAdvance: () => VibeReelAutoAdvanceState) {
  const options = createPlaybackOptions(element, autoAdvance)
  provide(key, options)
  return options
}

export function useReelPlaybackOptions() {
  return inject(key, null)
}

export function useReelFullscreenGesture(onSingleClick: () => void, identity: () => string, active: () => boolean) {
  const options = useReelPlaybackOptions()
  let first: { time: number; x: number; y: number; identity: string } | undefined
  let pending: ReturnType<typeof setTimeout> | undefined
  const delay = 300
  function cancel() {
    clearTimeout(pending)
    pending = undefined
    first = undefined
  }
  function click(event: MouseEvent, timed: boolean) {
    if (timed) event.stopPropagation()
    if (!options?.canFullscreen.value || event.detail === 0) {
      onSingleClick()
      return
    }
    const current = { time: performance.now(), x: event.clientX, y: event.clientY, identity: identity() }
    const double = first && first.identity === current.identity && current.time - first.time <= delay
      && Math.hypot(current.x - first.x, current.y - first.y) <= 32
    if (double) {
      cancel()
      void options.toggleFullscreen()
      return
    }
    cancel()
    first = current
    // A single tap must wait for the double-tap window before changing playback.
    pending = setTimeout(() => {
      cancel()
      if (active() && identity() === current.identity) onSingleClick()
    }, delay)
  }
  onBeforeUnmount(cancel)
  return click
}
