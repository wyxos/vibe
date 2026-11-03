import { computed, shallowRef, watch } from 'vue'

interface Point { x: number; y: number }
const origin = { x: 0, y: 0 }

export function useReelZoom(
  enabled: () => boolean,
  identity: () => string,
  carousel: { onWheel: (event: WheelEvent) => void; onTouchStart: (event: TouchEvent) => void; onTouchEnd: (event: TouchEvent) => void },
) {
  const scale = shallowRef(1)
  const offset = shallowRef<Point>(origin)
  const zoomed = computed(() => scale.value > 1)
  let touch: { center: Point; distance: number } | undefined
  let dragging: { id: number; x: number; y: number } | undefined
  let suppressClick = false

  function fit(event?: MouseEvent) {
    scale.value = 1
    offset.value = origin
    if (event?.detail === 0) (event.currentTarget as HTMLElement).parentElement?.focus({ preventScroll: true })
  }
  watch([enabled, identity], () => {
    fit()
    touch = undefined
    dragging = undefined
    suppressClick = false
  })

  function update(next: number, delta: Point, element: HTMLElement) {
    scale.value = Math.max(1, Math.min(5, next))
    const clamp = (value: number, size: number) => {
      const limit = size * (scale.value - 1) / 2
      return Math.max(-limit, Math.min(limit, value))
    }
    offset.value = { x: clamp(offset.value.x + delta.x, element.clientWidth), y: clamp(offset.value.y + delta.y, element.clientHeight) }
  }
  function zoomAt(next: number, before: Point, after: Point, element: HTMLElement) {
    const box = element.getBoundingClientRect()
    const ratio = Math.max(1, Math.min(5, next)) / scale.value
    const localX = before.x - box.left - box.width / 2
    const localY = before.y - box.top - box.height / 2
    update(next, {
      x: after.x - before.x + (localX - offset.value.x) * (1 - ratio),
      y: after.y - before.y + (localY - offset.value.y) * (1 - ratio),
    }, element)
  }

  function touchGeometry(touches: TouchList) {
    const first = touches[0]!
    const second = touches[1]
    return second ? {
      center: { x: (first.clientX + second.clientX) / 2, y: (first.clientY + second.clientY) / 2 },
      distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY),
    } : { center: { x: first.clientX, y: first.clientY }, distance: 0 }
  }
  function start(event: TouchEvent) {
    if (zoomed.value && event.target instanceof Element && !event.target.closest('.media-preview')) return
    if (enabled() && (zoomed.value || event.touches.length >= 2)) {
      touch = touchGeometry(event.touches)
      event.preventDefault()
    } else carousel.onTouchStart(event)
  }
  function move(event: TouchEvent) {
    if (!enabled() || (!touch && event.touches.length < 2)) return
    const next = touchGeometry(event.touches)
    const previous = touch
    touch = next
    event.preventDefault()
    if (!previous) return
    const ratio = next.distance && previous.distance ? next.distance / previous.distance : 1
    zoomAt(scale.value * ratio, previous.center, next.center, event.currentTarget as HTMLElement)
  }
  function end(event: TouchEvent) {
    if (!touch) {
      if (!zoomed.value) carousel.onTouchEnd(event)
      return
    }
    event.preventDefault()
    touch = event.touches.length ? touchGeometry(event.touches) : undefined
  }

  const listeners = {
    wheel(event: WheelEvent) {
      if (!enabled() || (!event.ctrlKey && !event.metaKey)) {
        if (!zoomed.value) carousel.onWheel(event)
        return
      }
      event.preventDefault()
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1)
      const point = { x: event.clientX, y: event.clientY }
      zoomAt(scale.value * Math.exp(-delta / 240), point, point, event.currentTarget as HTMLElement)
    },
    touchstart: start,
    touchmove: move,
    touchend: end,
    touchcancel() { touch = undefined },
    dragstart(event: DragEvent) { if (enabled()) event.preventDefault() },
    pointerdown(event: PointerEvent) {
      suppressClick = false
      if (!zoomed.value || event.pointerType === 'touch' || event.button !== 0
        || (event.target instanceof Element && !event.target.closest('.media-preview'))) return
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY }
    },
    pointermove(event: PointerEvent) {
      if (!dragging || dragging.id !== event.pointerId) return
      const delta = { x: event.clientX - dragging.x, y: event.clientY - dragging.y }
      if (!suppressClick && Math.hypot(delta.x, delta.y) < 4) return
      const element = event.currentTarget as HTMLElement
      if (!suppressClick) element.setPointerCapture(event.pointerId)
      suppressClick = true
      update(scale.value, delta, element)
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY }
    },
    pointerup() { dragging = undefined },
    pointercancel() { dragging = undefined },
    pointerleave() { dragging = undefined },
  }
  function guardClick(event: MouseEvent) {
    if (!suppressClick) return
    suppressClick = false
    event.preventDefault()
    event.stopPropagation()
  }
  const style = computed(() => zoomed.value ? {
    '--vibe-media-zoom': scale.value,
    '--vibe-media-pan-x': `${offset.value.x}px`,
    '--vibe-media-pan-y': `${offset.value.y}px`,
  } : undefined)
  return { zoomed, fit, style, listeners, guardClick }
}
