<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  shallowRef,
  watch,
  type CSSProperties,
} from 'vue'

import {
  calculateScrollbarGeometry,
  type ScrollbarGeometry,
} from '../core/scrollbar'

const MINIMUM_THUMB_SIZE = 32
const SCROLL_STEP = 40
const INTERACTION_RELEASE_MS = 120

const props = defineProps<{
  contentSize: number
  controlsId: string
  scrollElement: HTMLElement | null
  suspended?: boolean
}>()

const emptyGeometry: ScrollbarGeometry = {
  maximumScrollPosition: 0,
  scrollable: false,
  thumbOffset: 0,
  thumbSize: 0,
  thumbTravel: 0,
}

const trackElement = shallowRef<HTMLElement | null>(null)
const geometry = shallowRef<ScrollbarGeometry>(emptyGeometry)
const isDragging = shallowRef(false)
const isInteracting = shallowRef(false)
const isReady = shallowRef(false)
let dragPointerId: number | null = null
let dragStartPosition = 0
let dragStartScrollPosition = 0
let interactionTimer: ReturnType<typeof setTimeout> | null = null
let readyFrame: number | null = null
let contentMutationObserver: MutationObserver | null = null
let contentResizeObserver: ResizeObserver | null = null
let pendingMeasurement = false
let viewportResizeObserver: ResizeObserver | null = null
let measurementFrame: number | null = null
let disposed = false
let sizesDirty = true
let sizes: { contentSize: number, trackSize: number, viewportSize: number } | null = null
const movingContent = new Map<Element, Map<string, number>>()

const isVisible = computed(() => geometry.value.scrollable && !props.suspended)

const thumbStyle = computed<CSSProperties>(() => ({
  height: `${geometry.value.thumbSize}px`,
  transform: `translate3d(0, ${geometry.value.thumbOffset}px, 0)`,
}))

function releaseInteractionSoon(): void {
  if (interactionTimer !== null) clearTimeout(interactionTimer)
  interactionTimer = setTimeout(() => {
    interactionTimer = null
    if (!isDragging.value) isInteracting.value = false
  }, INTERACTION_RELEASE_MS)
}

function markInteraction(): void {
  isInteracting.value = true
  releaseInteractionSoon()
}

function cancelMeasurement(): void {
  if (measurementFrame === null) return
  cancelAnimationFrame(measurementFrame)
  measurementFrame = null
}

function invalidate(reason: 'content' | 'resize'): void {
  if (disposed) return
  sizesDirty = true
  if (isDragging.value) { pendingMeasurement = true; return }
  if (measurementFrame !== null) return
  measurementFrame = -1
  const frame = requestAnimationFrame(() => {
    measurementFrame = null
    if (sizesDirty) measure(reason)
  })
  if (measurementFrame !== null) measurementFrame = frame
}

function acceptMutations(records: MutationRecord[], element: HTMLElement): void {
  if (records.some(record => record.type === 'childList' && record.target === element)) observeContent(element)
  if (records.length > 0) sizesDirty = true
}

function calculateGeometry(refresh: boolean): ScrollbarGeometry {
  const scrollElement = props.scrollElement
  const track = trackElement.value
  if (!scrollElement || !track) return emptyGeometry

  if (refresh || !sizes) {
    sizes = {
      contentSize: scrollElement.scrollHeight,
      trackSize: track.clientHeight,
      viewportSize: scrollElement.clientHeight,
    }
    sizesDirty = false
    pendingMeasurement = false
    cancelMeasurement()
  }
  return calculateScrollbarGeometry({
    ...sizes,
    minimumThumbSize: MINIMUM_THUMB_SIZE,
    scrollPosition: scrollElement.scrollTop,
  })
}

function measure(reason: 'content' | 'resize' | 'scroll'): void {
  if (disposed) return
  const element = props.scrollElement
  if (element) acceptMutations(contentMutationObserver?.takeRecords() ?? [], element)
  for (const target of movingContent.keys()) if (!element?.contains(target)) movingContent.delete(target)
  if (isDragging.value && reason !== 'scroll') {
    pendingMeasurement = true
    return
  }

  if (isDragging.value) {
    const scrollElement = props.scrollElement
    if (!scrollElement || geometry.value.maximumScrollPosition <= 0) return
    const progress = Math.min(
      1,
      Math.max(0, scrollElement.scrollTop / geometry.value.maximumScrollPosition),
    )
    geometry.value = {
      ...geometry.value,
      thumbOffset: geometry.value.thumbTravel * progress,
    }
    return
  }

  // Size reuse is safe only with both observer types. Missing observers retain
  // the previous live-size read on every scroll, including overflow changes.
  const observed = contentMutationObserver && contentResizeObserver && viewportResizeObserver && movingContent.size === 0
  geometry.value = calculateGeometry(reason !== 'scroll' || sizesDirty || !observed)
  if (isReady.value || readyFrame !== null) return
  readyFrame = requestAnimationFrame(() => {
    readyFrame = null
    isReady.value = true
  })
}

function onScroll(): void {
  markInteraction()
  measure('scroll')
}

function setScrollPosition(value: number): void {
  const scrollElement = props.scrollElement
  if (!scrollElement) return
  scrollElement.scrollTop = Math.min(
    geometry.value.maximumScrollPosition,
    Math.max(0, value),
  )
  measure('scroll')
}

function onTrackPointerDown(event: PointerEvent): void {
  if (event.target !== event.currentTarget) return
  measure('resize')
  if (!isVisible.value) return
  const track = trackElement.value
  if (!track || geometry.value.thumbTravel <= 0) return

  event.preventDefault()
  markInteraction()
  const targetOffset = event.clientY
    - track.getBoundingClientRect().top
    - geometry.value.thumbSize / 2
  const progress = Math.min(1, Math.max(0, targetOffset / geometry.value.thumbTravel))
  setScrollPosition(progress * geometry.value.maximumScrollPosition)
}

function onThumbPointerDown(event: PointerEvent): void {
  measure('resize')
  if (!isVisible.value) return
  event.preventDefault()
  event.stopPropagation()
  const thumb = event.currentTarget as HTMLElement
  thumb.setPointerCapture?.(event.pointerId)
  dragPointerId = event.pointerId
  dragStartPosition = event.clientY
  dragStartScrollPosition = props.scrollElement?.scrollTop ?? 0
  isDragging.value = true
  isInteracting.value = true
  if (interactionTimer !== null) clearTimeout(interactionTimer)
  interactionTimer = null
}

function onThumbPointerMove(event: PointerEvent): void {
  if (!isDragging.value || event.pointerId !== dragPointerId) return
  event.preventDefault()
  if (geometry.value.thumbTravel <= 0) return

  const scrollDelta = (event.clientY - dragStartPosition)
    / geometry.value.thumbTravel
    * geometry.value.maximumScrollPosition
  setScrollPosition(dragStartScrollPosition + scrollDelta)
}

function finishDragging(event: PointerEvent): void {
  if (!isDragging.value || event.pointerId !== dragPointerId) return
  const thumb = event.currentTarget as HTMLElement
  thumb.releasePointerCapture?.(event.pointerId)
  dragPointerId = null
  isDragging.value = false
  if (pendingMeasurement) {
    pendingMeasurement = false
    measure('content')
  }
  releaseInteractionSoon()
}

function onKeydown(event: KeyboardEvent): void {
  measure('resize')
  if (!isVisible.value) return
  const viewportSize = isDragging.value ? props.scrollElement?.clientHeight ?? 0 : sizes?.viewportSize ?? 0
  const current = props.scrollElement?.scrollTop ?? 0
  const next = event.key === 'ArrowUp' ? current - SCROLL_STEP
    : event.key === 'ArrowDown' ? current + SCROLL_STEP
      : event.key === 'PageUp' ? current - viewportSize
        : event.key === 'PageDown' ? current + viewportSize
          : event.key === 'Home' ? 0
            : event.key === 'End' ? geometry.value.maximumScrollPosition
              : null
  if (next === null) return

  event.preventDefault()
  markInteraction()
  setScrollPosition(next)
}

function observeContent(element: HTMLElement): void {
  contentResizeObserver?.disconnect()
  if (typeof ResizeObserver === 'undefined') return

  contentResizeObserver = new ResizeObserver(() => {
    if (element === props.scrollElement) invalidate('content')
  })
  for (const child of element.children) contentResizeObserver.observe(child)
}

function onResourceLoad(): void { invalidate('content') }

function motionKey(event: Event): string {
  const name = event.type.startsWith('animation')
    ? (event as AnimationEvent).animationName : (event as TransitionEvent).propertyName
  return `${event.type.startsWith('animation') ? 'a' : 't'}:${name}:${(event as AnimationEvent).pseudoElement ?? ''}`
}

function onMotionStart(event: Event): void {
  const target = event.target
  if (!(target instanceof Element) || !props.scrollElement?.contains(target)) return
  const active = movingContent.get(target) ?? new Map<string, number>()
  const key = motionKey(event)
  active.set(key, (active.get(key) ?? 0) + 1)
  movingContent.set(target, active)
  invalidate('content')
}

function onMotionEnd(event: Event): void {
  const target = event.target
  if (!(target instanceof Element)) return
  const active = movingContent.get(target)
  const key = motionKey(event)
  const remaining = (active?.get(key) ?? 0) - 1
  if (remaining > 0) active?.set(key, remaining)
  else active?.delete(key)
  if (active?.size === 0) movingContent.delete(target)
  invalidate('content')
}

function contentListeners(element: HTMLElement | null | undefined, add: boolean): void {
  const events: Array<[string, EventListener]> = [
    ['load', onResourceLoad], ['loadedmetadata', onResourceLoad],
    ['transitionrun', onMotionStart], ['animationstart', onMotionStart],
    ['transitionend', onMotionEnd], ['transitioncancel', onMotionEnd],
    ['animationend', onMotionEnd], ['animationcancel', onMotionEnd],
  ]
  for (const [name, handler] of events) {
    if (add) element?.addEventListener(name, handler, true)
    else element?.removeEventListener(name, handler, true)
  }
}

watch(
  () => props.scrollElement,
  (element, previous) => {
    previous?.removeEventListener('scroll', onScroll)
    contentListeners(previous, false)
    movingContent.clear()
    cancelMeasurement()
    sizes = null
    sizesDirty = true
    contentMutationObserver?.disconnect()
    contentMutationObserver = null
    contentResizeObserver?.disconnect()
    contentResizeObserver = null
    viewportResizeObserver?.disconnect()
    viewportResizeObserver = null
    element?.addEventListener('scroll', onScroll, { passive: true })
    contentListeners(element, true)
    if (element && typeof ResizeObserver !== 'undefined') {
      viewportResizeObserver = new ResizeObserver(() => {
        if (disposed || element !== props.scrollElement) return
        markInteraction()
        invalidate('resize')
      })
      viewportResizeObserver.observe(element)
      if (trackElement.value) viewportResizeObserver.observe(trackElement.value)
      observeContent(element)
    }
    if (element && typeof MutationObserver !== 'undefined') {
      contentMutationObserver = new MutationObserver(records => {
        if (element !== props.scrollElement || disposed) return
        acceptMutations(records, element)
        invalidate('content')
      })
      contentMutationObserver.observe(element, { childList: true, subtree: true, attributes: true, characterData: true })
    }
    void nextTick(() => measure('resize'))
  },
  { immediate: true },
)

watch(trackElement, (element, previous) => {
  if (previous) viewportResizeObserver?.unobserve(previous)
  if (element) viewportResizeObserver?.observe(element)
  invalidate('resize')
}, { flush: 'post' })

watch(
  () => props.contentSize,
  () => {
    sizesDirty = true
    void nextTick(() => { if (sizesDirty) measure('content') })
  },
)

onBeforeUnmount(() => {
  disposed = true
  cancelMeasurement()
  props.scrollElement?.removeEventListener('scroll', onScroll)
  contentListeners(props.scrollElement, false)
  movingContent.clear()
  contentMutationObserver?.disconnect()
  contentResizeObserver?.disconnect()
  viewportResizeObserver?.disconnect()
  if (interactionTimer !== null) clearTimeout(interactionTimer)
  if (readyFrame !== null) cancelAnimationFrame(readyFrame)
})
</script>

<template>
  <div
    ref="trackElement"
    class="gallery-scrollbar"
    :class="{
      'gallery-scrollbar--dragging': isDragging,
      'gallery-scrollbar--interacting': isInteracting,
      'gallery-scrollbar--ready': isReady,
      'gallery-scrollbar--visible': isVisible,
    }"
    :aria-hidden="!isVisible || undefined"
    @pointerdown="onTrackPointerDown"
  >
    <div
      class="gallery-scrollbar-thumb"
      :aria-controls="controlsId"
      aria-label="Media gallery scroll position"
      aria-orientation="vertical"
      :aria-valuemax="Math.round(geometry.maximumScrollPosition)"
      aria-valuemin="0"
      :aria-valuenow="Math.round(scrollElement?.scrollTop ?? 0)"
      role="scrollbar"
      :style="thumbStyle"
      :tabindex="isVisible ? 0 : -1"
      @keydown="onKeydown"
      @pointercancel="finishDragging"
      @pointerdown="onThumbPointerDown"
      @pointermove="onThumbPointerMove"
      @pointerup="finishDragging"
    />
  </div>
</template>
