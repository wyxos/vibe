import { shallowRef, watch, type Ref } from 'vue'

const SCROLL_IDLE_MS = 160
const navigationKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

export function useMasonryScrollMedia(
  gallery: Ref<HTMLElement | null>,
  onSettled: () => void,
) {
  const scrolling = shallowRef(false)
  let scrollbarHeld = false
  let input: 'wheel' | 'touch' | 'navigation' | null = null
  let touchHeld = false
  let touchScrolled = false
  let touchListeners: AbortController | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  function settle(): void {
    clearTimeout(timer)
    touchListeners?.abort()
    touchHeld = false
    input = null
    if (!scrolling.value) return
    scrolling.value = false
    onSettled()
  }

  function waitForIdle(): void {
    // Wheel notches and custom thumb updates can emit scrollend mid-gesture.
    // Older browsers also lack scrollend for touch momentum.
    clearTimeout(timer)
    timer = setTimeout(settle, SCROLL_IDLE_MS)
  }

  function onScrollbarDragChange(held: boolean): void {
    scrollbarHeld = held
    if (held) {
      scrolling.value = true
      waitForIdle()
    } else if (!input) {
      settle()
    }
  }

  function onScrollIntent(): void {
    input = 'navigation'
    waitForIdle()
  }

  function recordScroll(): void {
    if (!input && !scrollbarHeld) return
    scrolling.value = true
    if (input === 'touch') touchScrolled = true
    if (!touchHeld || !gallery.value || !('onscrollend' in gallery.value)) waitForIdle()
  }

  watch(gallery, (element, _, onCleanup) => {
    if (!element) return
    const controller = new AbortController()
    const options = { passive: true, signal: controller.signal }

    element.addEventListener('wheel', (event) => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      input = 'wheel'
      scrolling.value = true
      waitForIdle()
    }, options)
    element.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey
        || !navigationKeys.has(event.key)) return
      const target = event.target
      if (target instanceof Element && target.closest('input, select, textarea, [contenteditable], [role="slider"]')) return
      onScrollIntent()
    }, options)
    element.addEventListener('touchstart', (event) => {
      if (touchHeld) return
      const target = event.target
      if (!(target instanceof Element)) return
      touchHeld = true
      touchScrolled = false
      input = 'touch'
      clearTimeout(timer)
      // The touch target can be unmounted as the virtualized feed moves.
      touchListeners?.abort()
      touchListeners = new AbortController()
      const end = (event: Event) => {
        if (event.type === 'touchend' && (event as TouchEvent).targetTouches.length) return
        touchListeners?.abort()
        touchHeld = false
        if (touchScrolled) waitForIdle()
        else settle()
      }
      const touchOptions = { passive: true, signal: touchListeners.signal }
      target.addEventListener('touchend', end, touchOptions)
      target.addEventListener('touchcancel', end, touchOptions)
    }, options)
    element.addEventListener('scrollend', () => {
      if (input !== 'touch') return
      // The browser can end the scroll after virtualization removes the touch target.
      settle()
    }, options)
    onCleanup(() => {
      controller.abort()
      touchListeners?.abort()
      clearTimeout(timer)
      input = null
      scrollbarHeld = false
      touchHeld = false
      scrolling.value = false
    })
  })
  return { scrolling, onScrollbarDragChange, onScrollIntent, recordScroll }
}
