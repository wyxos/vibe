import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { VibeViewerItem } from '../vibeViewer'
import { formatDate, formatFileSize, formatPlaybackTime } from './format'
import { getRenderedItems, getRenderedRange, getVirtualSlideStyle } from './virtualization'

interface MediaUiState {
  currentTime: number
  duration: number
  paused: boolean
}

export interface VibeRootProps {
  items: VibeViewerItem[]
  activeIndex?: number
  loading?: boolean
  hasNextPage?: boolean
  paginationDetail?: string | null
}

type VibeRootEmit = (event: 'update:activeIndex', value: number) => void

const DEFAULT_MEDIA_UI_STATE: MediaUiState = {
  currentTime: 0,
  duration: 0,
  paused: true,
}

export function useVibeRoot(props: Readonly<VibeRootProps>, emit: VibeRootEmit) {
  const stageRef = ref<HTMLElement | null>(null)
  const dragOffset = ref(0)
  const isDragging = ref(false)
  const viewportHeight = ref(1)
  const mediaStates = ref<Record<string, MediaUiState>>({})

  const videoElements = new Map<string, HTMLVideoElement>()
  const audioElements = new Map<string, HTMLAudioElement>()

  let activePointerId: number | null = null
  let dragStartY = 0
  let wheelLockedUntil = 0
  let suppressMediaToggleUntil = 0

  const resolvedActiveIndex = computed(() => {
    if (props.items.length === 0) {
      return 0
    }

    return clamp(props.activeIndex ?? 0, 0, props.items.length - 1)
  })

  const activeItem = computed(() => props.items[resolvedActiveIndex.value] ?? null)
  const activeMediaItem = computed(() => {
    if (activeItem.value?.type === 'audio' || activeItem.value?.type === 'video') {
      return activeItem.value
    }

    return null
  })
  const activeMediaState = computed(() => {
    if (!activeMediaItem.value) {
      return DEFAULT_MEDIA_UI_STATE
    }

    return mediaStates.value[activeMediaItem.value.id] ?? DEFAULT_MEDIA_UI_STATE
  })
  const activeMediaDuration = computed(() => {
    if (!activeMediaItem.value) {
      return 0
    }

    return activeMediaState.value.duration || ((activeMediaItem.value.durationMs ?? 0) / 1000)
  })
  const activeMediaProgress = computed(() => {
    if (activeMediaDuration.value <= 0) {
      return 0
    }

    return clamp((activeMediaState.value.currentTime / activeMediaDuration.value) * 100, 0, 100)
  })
  const isAtEnd = computed(() => props.items.length > 0 && resolvedActiveIndex.value === props.items.length - 1)
  const statusMessage = computed(() => {
    if (props.items.length === 0 && props.loading) {
      return 'Loading the first page'
    }

    if (props.loading && props.hasNextPage) {
      return 'Loading more items'
    }

    if (isAtEnd.value && !props.hasNextPage && !props.loading) {
      return 'End of feed'
    }

    return null
  })
  const dragThreshold = computed(() => Math.min(96, viewportHeight.value * 0.15 || 96))
  const renderedRange = computed(() => getRenderedRange(resolvedActiveIndex.value, props.items.length))
  const renderedItems = computed(() => getRenderedItems(props.items, resolvedActiveIndex.value))

  watch(resolvedActiveIndex, async () => {
    await syncMediaPlayback()
  })

  watch(
    () => props.items.length,
    async () => {
      await syncMediaPlayback()
    },
  )

  onMounted(() => {
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('keydown', onKeydown)
    void syncMediaPlayback()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateViewportHeight)
    window.removeEventListener('keydown', onKeydown)
    pauseAndResetAllMedia()
  })

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function updateViewportHeight() {
    viewportHeight.value = stageRef.value?.clientHeight || window.innerHeight || 1
  }

  function canNavigate(direction: -1 | 1) {
    if (props.items.length === 0) {
      return false
    }

    return clamp(resolvedActiveIndex.value + direction, 0, props.items.length - 1) !== resolvedActiveIndex.value
  }

  function navigate(direction: -1 | 1) {
    if (props.items.length === 0) {
      return
    }

    const nextIndex = clamp(resolvedActiveIndex.value + direction, 0, props.items.length - 1)

    if (nextIndex !== resolvedActiveIndex.value) {
      emit('update:activeIndex', nextIndex)
    }
  }

  function applyEdgeResistance(deltaY: number) {
    const wantsPrevious = deltaY > 0
    const wantsNext = deltaY < 0

    if ((wantsPrevious && !canNavigate(-1)) || (wantsNext && !canNavigate(1))) {
      return deltaY * 0.24
    }

    return deltaY
  }

  function onPointerDown(event: PointerEvent) {
    if (props.items.length === 0 || event.pointerType === 'mouse' || isInteractiveTarget(event.target)) {
      return
    }

    activePointerId = event.pointerId
    dragStartY = event.clientY
    dragOffset.value = 0
    isDragging.value = true
    stageRef.value?.setPointerCapture?.(event.pointerId)
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging.value || activePointerId !== event.pointerId) {
      return
    }

    dragOffset.value = applyEdgeResistance(event.clientY - dragStartY)
  }

  function onPointerUp(event: PointerEvent) {
    if (activePointerId !== event.pointerId) {
      return
    }

    stageRef.value?.releasePointerCapture?.(event.pointerId)
    finalizeDrag()
  }

  function onPointerCancel(event: PointerEvent) {
    if (activePointerId !== event.pointerId) {
      return
    }

    stageRef.value?.releasePointerCapture?.(event.pointerId)
    resetDragState()
  }

  function finalizeDrag() {
    if (Math.abs(dragOffset.value) >= dragThreshold.value) {
      suppressMediaToggleUntil = Date.now() + 250
      navigate(dragOffset.value < 0 ? 1 : -1)
    }

    resetDragState()
  }

  function resetDragState() {
    dragOffset.value = 0
    isDragging.value = false
    activePointerId = null
  }

  function onWheel(event: WheelEvent) {
    if (props.items.length === 0 || isDragging.value || isInteractiveTarget(event.target)) {
      return
    }

    if (Math.abs(event.deltaY) < Math.max(Math.abs(event.deltaX), 24)) {
      return
    }

    event.preventDefault()

    const now = Date.now()
    if (now < wheelLockedUntil) {
      return
    }

    wheelLockedUntil = now + 400
    navigate(event.deltaY > 0 ? 1 : -1)
  }

  function onKeydown(event: KeyboardEvent) {
    if (props.items.length === 0 || isEditableTarget(event.target)) {
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault()
      navigate(1)
    }

    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault()
      navigate(-1)
    }
  }

  function isEditableTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  }

  function isInteractiveTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && Boolean(target.closest('[data-swipe-lock], input, textarea, select, a'))
  }

  function registerVideoElement(id: string, element: unknown) {
    if (element instanceof HTMLVideoElement) {
      videoElements.set(id, element)
      updateMediaState(id, element)
      return
    }

    videoElements.delete(id)
  }

  function registerAudioElement(id: string, element: unknown) {
    if (element instanceof HTMLAudioElement) {
      audioElements.set(id, element)
      updateMediaState(id, element)
      return
    }

    audioElements.delete(id)
  }

  function pauseAndReset(media: HTMLMediaElement, id: string) {
    media.pause()

    try {
      media.currentTime = 0
    }
    catch {
      // Ignore reset failures for streams or not-yet-ready elements.
    }

    updateMediaState(id, media)
  }

  function pauseAndResetAllMedia() {
    for (const [id, media] of videoElements.entries()) {
      pauseAndReset(media, id)
    }

    for (const [id, media] of audioElements.entries()) {
      pauseAndReset(media, id)
    }
  }

  async function syncMediaPlayback() {
    await nextTick()

    const activeId = activeItem.value?.id ?? null

    for (const [id, element] of videoElements.entries()) {
      if (id !== activeId) {
        pauseAndReset(element, id)
        continue
      }

      element.muted = true
      element.loop = true
      element.playsInline = true
      void element.play().catch(() => {})
      updateMediaState(id, element)
    }

    for (const [id, element] of audioElements.entries()) {
      if (id !== activeId) {
        pauseAndReset(element, id)
        continue
      }

      void element.play().catch(() => {})
      updateMediaState(id, element)
    }
  }

  function ensureMediaState(id: string) {
    if (!mediaStates.value[id]) {
      mediaStates.value[id] = { ...DEFAULT_MEDIA_UI_STATE }
    }

    return mediaStates.value[id]
  }

  function updateMediaState(id: string, media: HTMLMediaElement) {
    const state = ensureMediaState(id)

    state.currentTime = Number.isFinite(media.currentTime) ? media.currentTime : 0
    state.duration = Number.isFinite(media.duration) ? media.duration : 0
    state.paused = media.paused
  }

  function setMediaUiState(id: string, currentTime: number, media: HTMLMediaElement) {
    const state = ensureMediaState(id)

    state.currentTime = currentTime
    state.duration = Number.isFinite(media.duration) ? media.duration : state.duration
    state.paused = media.paused
  }

  function onMediaEvent(id: string, event: Event) {
    if (event.currentTarget instanceof HTMLMediaElement) {
      updateMediaState(id, event.currentTarget)
    }
  }

  function getMediaElementById(id: string) {
    return videoElements.get(id) ?? audioElements.get(id) ?? null
  }

  function getActiveMediaElement() {
    return activeMediaItem.value ? getMediaElementById(activeMediaItem.value.id) : null
  }

  function toggleMediaPlayback(media: HTMLMediaElement | null) {
    if (!media) {
      return
    }

    if (media.paused) {
      void media.play().catch(() => {})
      return
    }

    media.pause()
  }

  function onVideoClick(event: MouseEvent, id: string) {
    if (event.button !== 0 || Date.now() < suppressMediaToggleUntil) {
      return
    }

    toggleMediaPlayback(videoElements.get(id) ?? null)
  }

  function onAudioCoverClick(event: MouseEvent, id: string) {
    if (event.button !== 0 || Date.now() < suppressMediaToggleUntil) {
      return
    }

    toggleMediaPlayback(getMediaElementById(id))
  }

  function onMediaSeekInput(event: Event) {
    const media = getActiveMediaElement()
    const activeId = activeMediaItem.value?.id

    if (!media || !activeId || !(event.target instanceof HTMLInputElement)) {
      return
    }

    const nextTime = Number.parseFloat(event.target.value)

    if (!Number.isFinite(nextTime)) {
      return
    }

    const clampedTime = clamp(nextTime, 0, activeMediaDuration.value || 0)

    setMediaUiState(activeId, clampedTime, media)
    media.currentTime = clampedTime
  }

  function isVisual(item: VibeViewerItem) {
    return item.type === 'image' || item.type === 'video'
  }

  function isAudio(item: VibeViewerItem) {
    return item.type === 'audio'
  }

  function getImageSource(item: VibeViewerItem) {
    return item.original.url
  }

  function getSlideStyle(index: number) {
    return getVirtualSlideStyle(index, resolvedActiveIndex.value, viewportHeight.value, dragOffset.value, isDragging.value)
  }

  return {
    activeItem,
    activeMediaDuration,
    activeMediaItem,
    activeMediaProgress,
    activeMediaState,
    formatDate,
    formatFileSize,
    formatPlaybackTime,
    getImageSource,
    getSlideStyle,
    isAtEnd,
    isAudio,
    isVisual,
    mediaStates,
    onAudioCoverClick,
    onMediaEvent,
    onMediaSeekInput,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onVideoClick,
    onWheel,
    registerAudioElement,
    registerVideoElement,
    renderedItems,
    renderedRange,
    resolvedActiveIndex,
    stageRef,
    statusMessage,
  }
}
