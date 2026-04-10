import { computed, ref, type Ref } from 'vue'

import type { VibeAssetErrorReporter, VibeAssetLoadReporter } from './assetErrors'
import { isEditableTarget, isInteractiveTarget } from './dom'
import { formatPlaybackTime } from './format'
import { useActivation } from './useActivation'
import { useDataSource, type VibeProps } from './useDataSource'
import { useMedia } from './useMedia'
import { getRenderedItems, getRenderedRange, getVirtualSlideStyle } from './virtualization'

export type {
  VibeResolveParams,
  VibeResolveResult,
  VibeAutoProps,
  VibeControlledProps,
  VibeEmit,
  VibeFeedMode,
  VibeHandle,
  VibeInitialState,
  VibeLoadPhase,
  VibeProps,
} from './useDataSource'
export type { VibeAssetErrorKind } from './loadError'
export type { VibeStatus, VibeSurfaceMode } from './removalState'
export type { VibeAssetLoadQueueLimits } from './useAssetLoadQueue'
export type { VibeAssetErrorEvent, VibeAssetErrorReporter, VibeAssetErrorSurface, VibeAssetLoadEvent, VibeAssetLoadReporter, VibeAssetLoadSurface } from './assetErrors'

export function useViewer(
  props: Readonly<VibeProps>,
  emit: (event: 'update:activeIndex', value: number) => void,
  options: {
    enabled?: Ref<boolean>
    onAssetError?: VibeAssetErrorReporter
    onAssetLoad?: VibeAssetLoadReporter
  } = {},
) {
  const dataSource = useDataSource(props, emit)
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
  const media = useMedia({
    items,
    activeItem,
    activeMediaItem,
    isEnabled,
    itemCount: computed(() => items.value.length),
    onAssetError: options.onAssetError,
    onAssetLoad: options.onAssetLoad,
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

  useActivation({
    enabled: isEnabled,
    onDisable() {
      resetDragState()
      media.resetMediaState()
    },
    onEnable() {
      return media.syncMediaPlayback()
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

  function onVideoClick(event: MouseEvent, id: string) {
    media.onVideoClick(event, id, suppressMediaToggleUntil)
  }

  function onAudioCoverClick(event: MouseEvent, id: string) {
    media.onAudioCoverClick(event, id, suppressMediaToggleUntil)
  }

  function onMediaSeekInput(event: Event) {
    media.onMediaSeekInput(event)
  }

  function isVisual(item: (typeof items.value)[number]) {
    return item.type === 'image' || item.type === 'video'
  }

  function isAudio(item: (typeof items.value)[number]) {
    return item.type === 'audio'
  }

  function getSlideStyle(index: number) {
    return getVirtualSlideStyle(index, resolvedActiveIndex.value, viewportHeight.value, dragOffset.value, isDragging.value)
  }
  return {
    activeItem,
    activeAssetErrorKind: media.activeAssetErrorKind,
    activeMediaDuration: media.activeMediaDuration,
    activeMediaItem,
    activeMediaProgress: media.activeMediaProgress,
    activeMediaState: media.activeMediaState,
    canRetryAsset: media.canRetryAsset,
    canRetryInitialLoad,
    errorMessage,
    getAssetErrorKind: media.getAssetErrorKind,
    getAssetErrorLabel: media.getAssetErrorLabel,
    getAssetRenderKey: media.getAssetRenderKey,
    formatPlaybackTime,
    getImageSource: media.getImageSource,
    getSlideStyle,
    hasNextPage,
    isAtEnd,
    isAudio,
    isVisual,
    items,
    loading,
    mediaStates: media.mediaStates,
    isImageReady: media.isImageReady,
    isMediaReady: media.isMediaReady,
    onAudioCoverClick,
    onImageError: media.onImageError,
    onImageLoad: media.onImageLoad,
    onMediaEvent: media.onMediaEvent,
    onMediaError: media.onMediaError,
    onMediaSeekInput,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onVideoClick,
    onWheel,
    registerAudioElement: media.registerAudioElement,
    registerImageElement: media.registerImageElement,
    registerVideoElement: media.registerVideoElement,
    renderedItems,
    renderedRange,
    resolvedActiveIndex,
    retryInitialLoad,
    retryAsset: media.retryAsset,
    stageRef,
    statusMessage,
    paginationDetail,
  }
}
