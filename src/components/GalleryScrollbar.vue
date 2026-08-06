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
const thumbOffset = shallowRef(0)
const isDragging = shallowRef(false)
const isInteracting = shallowRef(false)
const isReady = shallowRef(false)
let dragPointerId: number | null = null
let dragStartPosition = 0
let dragStartScrollPosition = 0
let interactionTimer: ReturnType<typeof setTimeout> | null = null
let lastInteractionAt = 0
let readyFrame: number | null = null
let contentMutationObserver: MutationObserver | null = null
let contentResizeObserver: ResizeObserver | null = null
let pendingMeasurement = false
let viewportResizeObserver: ResizeObserver | null = null

const isVisible = computed(() => geometry.value.scrollable && !props.suspended)

const thumbStyle = computed<CSSProperties>(() => ({
  height: `${geometry.value.thumbSize}px`,
  transform: `translate3d(0, ${thumbOffset.value}px, 0)`,
}))

function releaseInteractionSoon(): void {
  if (interactionTimer !== null || isDragging.value) return
  const release = (): void => {
    interactionTimer = null
    if (isDragging.value) return
    const remaining = INTERACTION_RELEASE_MS - (Date.now() - lastInteractionAt)
    if (remaining > 0) {
      interactionTimer = setTimeout(release, remaining)
      return
    }
    isInteracting.value = false
  }
  interactionTimer = setTimeout(release, INTERACTION_RELEASE_MS)
}

function markInteraction(): void {
  lastInteractionAt = Date.now()
  isInteracting.value = true
  releaseInteractionSoon()
}

function calculateGeometry(): ScrollbarGeometry {
  const scrollElement = props.scrollElement
  const track = trackElement.value
  if (!scrollElement || !track) return emptyGeometry

  return calculateScrollbarGeometry({
    contentSize: scrollElement.scrollHeight,
    minimumThumbSize: MINIMUM_THUMB_SIZE,
    scrollPosition: scrollElement.scrollTop,
    trackSize: track.clientHeight,
    viewportSize: scrollElement.clientHeight,
  })
}

function updateThumbOffset(): void {
  const scrollElement = props.scrollElement
  const current = geometry.value
  if (!scrollElement || current.maximumScrollPosition <= 0) {
    if (thumbOffset.value !== 0) thumbOffset.value = 0
    return
  }
  const progress = Math.min(
    1,
    Math.max(0, scrollElement.scrollTop / current.maximumScrollPosition),
  )
  const nextOffset = current.thumbTravel * progress
  if (thumbOffset.value !== nextOffset) thumbOffset.value = nextOffset
}

function measure(reason: 'content' | 'resize' | 'scroll'): void {
  if (isDragging.value && reason !== 'scroll') {
    pendingMeasurement = true
    return
  }

  if (reason === 'scroll') {
    updateThumbOffset()
    return
  }

  const nextGeometry = calculateGeometry()
  geometry.value = nextGeometry
  thumbOffset.value = nextGeometry.thumbOffset
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
  if (!isVisible.value || event.target !== event.currentTarget) return
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
  if (!isVisible.value) return
  event.preventDefault()
  event.stopPropagation()
  const thumb = event.currentTarget as HTMLElement
  thumb.setPointerCapture?.(event.pointerId)
  dragPointerId = event.pointerId
  dragStartPosition = event.clientY
  dragStartScrollPosition = props.scrollElement?.scrollTop ?? 0
  isDragging.value = true
  markInteraction()
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
  lastInteractionAt = Date.now()
  releaseInteractionSoon()
}

function onKeydown(event: KeyboardEvent): void {
  if (!isVisible.value) return
  const viewportSize = props.scrollElement?.clientHeight ?? 0
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

  contentResizeObserver = new ResizeObserver(() => measure('content'))
  for (const child of element.children) contentResizeObserver.observe(child)
}

watch(
  () => props.scrollElement,
  (element, previous) => {
    previous?.removeEventListener('scroll', onScroll)
    contentMutationObserver?.disconnect()
    contentMutationObserver = null
    contentResizeObserver?.disconnect()
    contentResizeObserver = null
    viewportResizeObserver?.disconnect()
    viewportResizeObserver = null
    element?.addEventListener('scroll', onScroll, { passive: true })
    if (element && typeof ResizeObserver !== 'undefined') {
      viewportResizeObserver = new ResizeObserver(() => {
        markInteraction()
        measure('resize')
      })
      viewportResizeObserver.observe(element)
      observeContent(element)
    }
    if (element && typeof MutationObserver !== 'undefined') {
      contentMutationObserver = new MutationObserver(() => {
        observeContent(element)
        measure('content')
      })
      contentMutationObserver.observe(element, { childList: true })
    }
    void nextTick(() => measure('resize'))
  },
  { immediate: true },
)

watch(
  () => props.contentSize,
  () => { void nextTick(() => measure('content')) },
)

onBeforeUnmount(() => {
  props.scrollElement?.removeEventListener('scroll', onScroll)
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
