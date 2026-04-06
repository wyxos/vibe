import { computed, nextTick, ref, watch, type Ref } from 'vue'

import { createMediaUiState, DEFAULT_MEDIA_UI_STATE, isImageElementReady, syncMediaUiState, type MediaUiState } from './assetState'
import { isEditableTarget, isInteractiveTarget } from './dom'
import { formatPlaybackTime } from './format'
import { useVibeRootActivation } from './useVibeRootActivation'
import { useVibeRootDataSource, type VibeRootProps } from './useVibeRootDataSource'
import { getRenderedItems, getRenderedRange, getVirtualSlideStyle } from './virtualization'

export type {
  VibeGetItemsParams,
  VibeGetItemsResult,
  VibeRootAutoProps,
  VibeRootControlledProps,
  VibeRootEmit,
  VibeRootProps,
} from './useVibeRootDataSource'

export function useVibeRoot(
  props: Readonly<VibeRootProps>,
  emit: (event: 'update:activeIndex', value: number) => void,
  options: {
    enabled?: Ref<boolean>
  } = {},
) {
  const dataSource = useVibeRootDataSource(props, emit)
  const {
    activeIndex,
    canRetryInitialLoad,
    errorMessage,
    hasNextPage,
    items,
    loading,
    paginationDetail,
    retryInitialLoad,
    setActiveIndex,
  } = dataSource

  const stageRef = ref<HTMLElement | null>(null)
  const dragOffset = ref(0)
  const isDragging = ref(false)
  const viewportHeight = ref(1)
  const imageReadyStates = ref<Record<string, boolean>>({})
  const mediaStates = ref<Record<string, MediaUiState>>({})

  const videoElements = new Map<string, HTMLVideoElement>()
  const audioElements = new Map<string, HTMLAudioElement>()
  const isEnabled = options.enabled ?? computed(() => true)

  let activePointerId: number | null = null
  let dragStartY = 0
  let wheelLockedUntil = 0
  let suppressMediaToggleUntil = 0

  const resolvedActiveIndex = computed(() => {
    if (items.value.length === 0) {
      return 0
    }

    return clamp(activeIndex.value, 0, items.value.length - 1)
  })

  const activeItem = computed(() => items.value[resolvedActiveIndex.value] ?? null)
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

    return activeMediaState.value.duration
  })
  const activeMediaProgress = computed(() => {
    if (activeMediaDuration.value <= 0) {
      return 0
    }

    return clamp((activeMediaState.value.currentTime / activeMediaDuration.value) * 100, 0, 100)
  })
  const isAtEnd = computed(() => items.value.length > 0 && resolvedActiveIndex.value === items.value.length - 1)
  const statusMessage = computed(() => {
    if (items.value.length === 0 && loading.value) {
      return 'Loading the first page'
    }

    if (loading.value && hasNextPage.value) {
      return 'Loading more items'
    }

    if (isAtEnd.value && !hasNextPage.value && !loading.value) {
      return 'End of feed'
    }

    return null
  })
  const dragThreshold = computed(() => Math.min(96, viewportHeight.value * 0.15 || 96))
  const renderedRange = computed(() => getRenderedRange(resolvedActiveIndex.value, items.value.length))
  const renderedItems = computed(() => getRenderedItems(items.value, resolvedActiveIndex.value))

  watch(resolvedActiveIndex, async () => {
    await syncMediaPlayback()
  })

  watch(
    () => items.value.length,
    async () => {
      await syncMediaPlayback()
    },
  )

  useVibeRootActivation({
    enabled: isEnabled,
    onDisable() {
      resetDragState()
      pauseAndResetAllMedia()
      imageReadyStates.value = {}
      mediaStates.value = {}
    },
    onEnable() {
      return syncMediaPlayback()
    },
    onKeydown,
    onResize: updateViewportHeight,
  })

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function updateViewportHeight() {
    viewportHeight.value = stageRef.value?.clientHeight || window.innerHeight || 1
  }

  function canNavigate(direction: -1 | 1) {
    if (items.value.length === 0) {
      return false
    }

    return clamp(resolvedActiveIndex.value + direction, 0, items.value.length - 1) !== resolvedActiveIndex.value
  }

  function navigate(direction: -1 | 1) {
    if (items.value.length === 0) {
      return
    }

    const nextIndex = clamp(resolvedActiveIndex.value + direction, 0, items.value.length - 1)

    if (nextIndex !== resolvedActiveIndex.value) {
      setActiveIndex(nextIndex)
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
    if (!isEnabled.value || items.value.length === 0 || event.pointerType === 'mouse' || isInteractiveTarget(event.target)) {
      return
    }

    activePointerId = event.pointerId
    dragStartY = event.clientY
    dragOffset.value = 0
    isDragging.value = true
    stageRef.value?.setPointerCapture?.(event.pointerId)
  }

  function onPointerMove(event: PointerEvent) {
    if (!isEnabled.value || !isDragging.value || activePointerId !== event.pointerId) {
      return
    }

    dragOffset.value = applyEdgeResistance(event.clientY - dragStartY)
  }

  function onPointerUp(event: PointerEvent) {
    if (!isEnabled.value || activePointerId !== event.pointerId) {
      return
    }

    stageRef.value?.releasePointerCapture?.(event.pointerId)
    finalizeDrag()
  }

  function onPointerCancel(event: PointerEvent) {
    if (!isEnabled.value || activePointerId !== event.pointerId) {
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
    if (!isEnabled.value || items.value.length === 0 || isDragging.value || isInteractiveTarget(event.target)) {
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
    if (!isEnabled.value || items.value.length === 0 || isEditableTarget(event.target)) {
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

  function registerImageElement(id: string, element: unknown) {
    if (element instanceof HTMLImageElement && isImageElementReady(element)) {
      imageReadyStates.value[id] = true
    }
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
    if (!isEnabled.value) {
      pauseAndResetAllMedia()
      return
    }

    await nextTick()

    const activeId = activeItem.value?.id ?? null

    for (const [id, element] of videoElements.entries()) {
      if (id !== activeId) {
        pauseAndReset(element, id)
        continue
      }

      element.muted = true
      element.loop = false
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
      mediaStates.value[id] = createMediaUiState()
    }
    return mediaStates.value[id]
  }

  function updateMediaState(id: string, media: HTMLMediaElement, eventType?: string) {
    syncMediaUiState(ensureMediaState(id), media, eventType)
  }

  function setMediaUiState(id: string, currentTime: number, media: HTMLMediaElement) {
    const state = ensureMediaState(id)

    state.currentTime = currentTime
    state.duration = Number.isFinite(media.duration) ? media.duration : state.duration
    state.paused = media.paused
  }

  function onMediaEvent(id: string, event: Event) {
    const media = event.currentTarget instanceof HTMLMediaElement ? event.currentTarget : event.target instanceof HTMLMediaElement ? event.target : null
    if (media) {
      updateMediaState(id, media, event.type)
    }
  }

  function onImageLoad(id: string) { imageReadyStates.value[id] = true }

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

  function isVisual(item: (typeof items.value)[number]) {
    return item.type === 'image' || item.type === 'video'
  }

  function isAudio(item: (typeof items.value)[number]) {
    return item.type === 'audio'
  }

  function isImageReady(id: string) {
    return Boolean(imageReadyStates.value[id])
  }

  function isMediaReady(id: string) {
    return mediaStates.value[id]?.ready ?? false
  }

  function getImageSource(item: (typeof items.value)[number]) {
    return item.url
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
    canRetryInitialLoad,
    errorMessage,
    formatPlaybackTime,
    getImageSource,
    getSlideStyle,
    hasNextPage,
    isAtEnd,
    isAudio,
    isVisual,
    items,
    loading,
    mediaStates,
    isImageReady,
    isMediaReady,
    onAudioCoverClick,
    onImageLoad,
    onMediaEvent,
    onMediaSeekInput,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onVideoClick,
    onWheel,
    registerAudioElement,
    registerImageElement,
    registerVideoElement,
    renderedItems,
    renderedRange,
    resolvedActiveIndex,
    retryInitialLoad,
    stageRef,
    statusMessage,
    paginationDetail,
  }
}
