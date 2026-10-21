<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  shallowRef,
  watch,
  type CSSProperties,
} from 'vue'

import type { ScrollbarGeometry } from '../core/scrollbar'
import { scrollbarCommentMutation, scrollbarMotionMask, scrollbarPlaybackMutation, type PlaybackMutation } from './scrollbarPlaybackMutation'
import { cancelScrollFrame, emptyScrollFrameGeometry as emptyGeometry, hasScrollFrameWriter, readScrollFrameGeometry, requestScrollFrame, type ScrollFrameContext } from '../core/scrollFrame'

const MINIMUM_THUMB_SIZE = 32
const SCROLL_STEP = 40
const INTERACTION_RELEASE_MS = 120
const MAX_PENDING_MUTATIONS = 512

const props = defineProps<{
  contentSize: number
  controlsId: string
  scrollElement: HTMLElement | null
  suspended?: boolean
}>()

const trackElement = shallowRef<HTMLElement | null>(null)
const geometry = shallowRef<ScrollbarGeometry>(emptyGeometry)
const scrollPosition = shallowRef(0)
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
let measurementReason: 'content' | 'resize' | 'mutation' | 'scroll' = 'mutation'
let disposed = false
let sizesDirty = true
let sizes: { contentSize: number, trackSize: number, viewportSize: number } | null = null
const movingContent = new Map<Element, Map<string, number>>()
const playbackResizeTargets = new Set<HTMLElement>()
let clippedPlaybackCards = new WeakMap<HTMLElement, boolean>()
let previousPlaybackStyle: CSSStyleDeclaration | undefined
let pendingMutations: MutationRecord[] = []
let mutationOverflow = false
let reconnectContent = false
let prunePlaybackTargets = false

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
  cancelScrollFrame(measurementFrame)
  measurementFrame = null
  measurementReason = 'mutation'
}

function invalidate(reason: 'content' | 'resize'): void {
  if (disposed) return
  sizesDirty = true
  clippedPlaybackCards = new WeakMap()
  scheduleMeasurement(reason)
}

function scheduleMeasurement(reason: 'content' | 'resize' | 'mutation' | 'scroll'): void {
  if (disposed || props.suspended) return
  if (isDragging.value) { pendingMeasurement = true; return }
  if (reason !== 'mutation') measurementReason = reason
  if (measurementFrame !== null) return
  measurementFrame = -1
  const frame = requestScrollFrame((_timestamp, context) => {
    measurementFrame = null
    const currentReason = measurementReason
    measurementReason = 'mutation'
    if (currentReason === 'scroll' || sizesDirty || pendingMutations.length || mutationOverflow) return measure(currentReason, context)
  })
  if (measurementFrame !== null) measurementFrame = frame
}

function clipsContent(node: HTMLElement): boolean {
  let clipped = clippedPlaybackCards.get(node)
  if (clipped === undefined) {
    const style = node.ownerDocument.defaultView?.getComputedStyle(node)
    const clips = (value: string | undefined) => value === 'hidden' || value === 'clip'
    clipped = !!style && clips(style.overflowX || style.overflow) && clips(style.overflowY || style.overflow)
    clippedPlaybackCards.set(node, clipped)
  }
  return clipped
}

function observePlayback(nodes: readonly HTMLElement[]): void {
  for (const node of nodes) if (!playbackResizeTargets.has(node)) {
    playbackResizeTargets.add(node)
    contentResizeObserver?.observe(node, { box: 'border-box' })
  }
}

function playbackPaintOnly({ target, card }: PlaybackMutation): boolean {
  if (!contentResizeObserver || !clipsContent(card)) return false
  observePlayback([target, card])
  return true
}

function motionNeedsLiveSizes(): boolean {
  for (const [target, active] of movingContent) {
    const mask = scrollbarMotionMask(target, active.keys())
    if (!mask || !contentResizeObserver || !clipsContent(mask)) return true
    observePlayback([mask])
  }
  return false
}

function queueMutations(records: MutationRecord[], element: HTMLElement): void {
  for (const record of records) {
    if (scrollbarCommentMutation(record)) continue
    if (record.type === 'childList') {
      prunePlaybackTargets = true
      if (record.target === element) reconnectContent = true
    }
    if (mutationOverflow) continue
    if (pendingMutations.length === MAX_PENDING_MUTATIONS) {
      mutationOverflow = true
      pendingMutations = []
    } else pendingMutations.push(record)
  }
}

function drainMutations(element: HTMLElement): void {
  queueMutations(contentMutationObserver?.takeRecords() ?? [], element)
  if (reconnectContent) observeContent(element)
  if (prunePlaybackTargets) for (const target of playbackResizeTargets) {
    if (!element.contains(target)) { contentResizeObserver?.unobserve(target); playbackResizeTargets.delete(target) }
  }
  const records = pendingMutations, overflow = mutationOverflow
  pendingMutations = []; mutationOverflow = reconnectContent = prunePlaybackTargets = false
  if (!records.length && !overflow) return
  const candidates: PlaybackMutation[] = []
  let changed = overflow || sizesDirty || !contentResizeObserver
  // An unknown record already requires geometry. Check every cheap candidate
  // first, avoiding computed clipping reads for earlier neutral records.
  for (const record of records) {
    if (changed) break
    const candidate = scrollbarPlaybackMutation(record, element,
      () => previousPlaybackStyle ??= document.createElement('span').style)
    if (candidate === false) changed = true
    else if (candidate) candidates.push(candidate)
  }
  if (!changed) changed = candidates.some(candidate => !playbackPaintOnly(candidate))
  if (changed) { sizesDirty = true; clippedPlaybackCards = new WeakMap() }
}

function clearMutations(): void {
  pendingMutations = []; mutationOverflow = reconnectContent = prunePlaybackTargets = false
}
function calculateGeometry(refresh: boolean, frame?: ScrollFrameContext) {
  const scrollElement = props.scrollElement
  const track = trackElement.value
  if (!scrollElement || !track) return () => ({ geometry: emptyGeometry, position: 0 })
  const measured = readScrollFrameGeometry(scrollElement, track, refresh ? null : sizes, MINIMUM_THUMB_SIZE, frame)
  if (refresh || !sizes) {
    sizes = measured.sizes
    sizesDirty = false
    pendingMeasurement = false
    cancelMeasurement()
  }
  return measured.sample
}
function measure(reason: 'content' | 'resize' | 'scroll' | 'mutation', frame?: ScrollFrameContext) {
  if (disposed) return
  const element = props.scrollElement
  if (!contentMutationObserver) prunePlaybackTargets = true
  if (element) drainMutations(element)
  // Playback-only batches do not change the thumb. onScroll owns position;
  // even a redundant scrollTop read can flush otherwise pending styles.
  if (reason === 'mutation' && !sizesDirty) return
  for (const target of movingContent.keys()) if (!element?.contains(target)) movingContent.delete(target)
  if (isDragging.value && reason !== 'scroll') {
    pendingMeasurement = true
    return
  }

  if (isDragging.value) {
    const scrollElement = props.scrollElement
    if (!scrollElement || geometry.value.maximumScrollPosition <= 0) return
    const position = frame?.position(scrollElement) ?? scrollElement.scrollTop
    const progress = Math.min(
      1,
      Math.max(0, position / geometry.value.maximumScrollPosition),
    )
    geometry.value = {
      ...geometry.value,
      thumbOffset: geometry.value.thumbTravel * progress,
    }
    scrollPosition.value = position
    return
  }

  // Size reuse is safe only with both observer types. Missing observers retain
  // the previous live-size read on every scroll, including overflow changes.
  const observed = contentMutationObserver && contentResizeObserver && viewportResizeObserver
  const refresh = reason !== 'scroll' || sizesDirty || !observed
  const measured = calculateGeometry(refresh || motionNeedsLiveSizes(), frame)
  // Prime mask checks after a required size read, while styles are already clean.
  if (refresh) motionNeedsLiveSizes()
  const publish = () => {
    if (disposed || element !== props.scrollElement || frame && props.suspended) return
    const current = measured()
    geometry.value = current.geometry
    scrollPosition.value = current.position
    if (isReady.value || readyFrame !== null) return
    readyFrame = requestAnimationFrame(() => {
      readyFrame = null
      isReady.value = true
    })
  }
  if (frame) return { publish }
  publish()
}

function onScroll(): void {
  markInteraction()
  if (props.scrollElement && hasScrollFrameWriter(props.scrollElement) && !isDragging.value) scheduleMeasurement('scroll')
  else measure('scroll')
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
  for (const target of playbackResizeTargets) if (element.contains(target)) contentResizeObserver.observe(target, { box: 'border-box' })
}

function onResourceLoad(): void { invalidate('content') }

function motionKey(event: Event): string {
  const name = event.type.startsWith('animation')
    ? (event as AnimationEvent).animationName : (event as TransitionEvent).propertyName
  return `${event.type.startsWith('animation') ? 'a' : 't'}:${name}:${(event as AnimationEvent).pseudoElement ?? ''}`
}

function onMotionStart(event: Event): void {
  if (event.type.startsWith('transition') && (event as TransitionEvent).propertyName === 'opacity') return
  const target = event.target
  if (!(target instanceof Element) || !props.scrollElement?.contains(target)) return
  const active = movingContent.get(target) ?? new Map<string, number>()
  const key = motionKey(event)
  active.set(key, (active.get(key) ?? 0) + 1)
  movingContent.set(target, active)
  invalidate('content')
}

function onMotionEnd(event: Event): void {
  if (event.type.startsWith('transition') && (event as TransitionEvent).propertyName === 'opacity') return
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
    playbackResizeTargets.clear()
    clearMutations()
    clippedPlaybackCards = new WeakMap()
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
        queueMutations(records, element)
        scheduleMeasurement('mutation')
      })
      contentMutationObserver.observe(element, { childList: true, subtree: true, attributes: true, attributeOldValue: true, characterData: true })
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
watch(() => props.suspended, suspended => {
  if (suspended) cancelMeasurement()
  else invalidate('resize')
})

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
  playbackResizeTargets.clear()
  clearMutations()
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
      :aria-valuenow="Math.round(scrollPosition)"
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
