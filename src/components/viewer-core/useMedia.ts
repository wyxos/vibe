import { computed, nextTick, ref, watch, type Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'
import type { VibeAssetErrorReporter, VibeAssetLoadReporter } from './assetErrors'
import { createMediaUiState, DEFAULT_MEDIA_UI_STATE, isImageElementReady, syncMediaUiState, type MediaUiState } from './assetState'
import { getVibeOccurrenceKey } from './itemIdentity'
import { canRetryVibeAssetError, getVibeAssetErrorLabel, resolveVibeAssetErrorKind, type VibeAssetErrorKind } from './loadError'
import { playMediaElement } from './mediaPlayback'

export function useMedia(options: {
  activeItem: Ref<VibeViewerItem | null>
  activeMediaItem: Ref<VibeViewerItem | null>
  isEnabled: Ref<boolean>
  itemCount: Ref<number>
  onAssetError?: VibeAssetErrorReporter
  onAssetLoad?: VibeAssetLoadReporter
}) {
  const imageReadyStates = ref<Record<string, boolean>>({})
  const imageErrorKinds = ref<Record<string, VibeAssetErrorKind | null>>({})
  const mediaStates = ref<Record<string, MediaUiState>>({})
  const assetRenderVersions = ref<Record<string, number>>({})

  const videoElements = new Map<string, HTMLVideoElement>()
  const audioElements = new Map<string, HTMLAudioElement>()
  const reportedLoadKeys = new Set<string>()
  const activeItemKey = computed(() => options.activeItem.value ? getVibeOccurrenceKey(options.activeItem.value) : null)
  const activeMediaItemKey = computed(() => options.activeMediaItem.value ? getVibeOccurrenceKey(options.activeMediaItem.value) : null)

  const activeMediaState = computed(() => {
    if (!activeMediaItemKey.value) {
      return DEFAULT_MEDIA_UI_STATE
    }

    return mediaStates.value[activeMediaItemKey.value] ?? DEFAULT_MEDIA_UI_STATE
  })
  const activeMediaDuration = computed(() => {
    if (!activeMediaItemKey.value) {
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
  const activeAssetErrorKind = computed(() => activeItemKey.value ? getAssetErrorKind(activeItemKey.value) : null)

  watch(
    () => activeItemKey.value,
    async () => {
      await syncMediaPlayback()
    },
  )

  watch(
    () => options.itemCount.value,
    async () => {
      await syncMediaPlayback()
    },
  )

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
      imageErrorKinds.value[id] = null
      reportAssetLoad(id, element.currentSrc || element.src || resolveActiveImageUrl())
    }
  }

  function resetMediaState() {
    pauseAndResetAllMedia()
    assetRenderVersions.value = {}
    imageErrorKinds.value = {}
    imageReadyStates.value = {}
    mediaStates.value = {}
    reportedLoadKeys.clear()
  }

  async function syncMediaPlayback() {
    if (!options.isEnabled.value) {
      pauseAndResetAllMedia()
      return
    }

    await nextTick()

    const activeId = activeItemKey.value

    for (const [id, element] of videoElements.entries()) {
      if (id !== activeId || mediaStates.value[id]?.errorKind) {
        pauseAndReset(element, id)
        continue
      }

      element.muted = true
      element.loop = false
      element.playsInline = true
      playMediaElement(element)
      updateMediaState(id, element)
    }

    for (const [id, element] of audioElements.entries()) {
      if (id !== activeId || mediaStates.value[id]?.errorKind) {
        pauseAndReset(element, id)
        continue
      }

      playMediaElement(element)
      updateMediaState(id, element)
    }
  }

  function onMediaEvent(id: string, event: Event) {
    const media = event.currentTarget instanceof HTMLMediaElement ? event.currentTarget : event.target instanceof HTMLMediaElement ? event.target : null

    if (media) {
      const previousReady = mediaStates.value[id]?.ready ?? false
      updateMediaState(id, media, event.type)
      const nextReady = mediaStates.value[id]?.ready ?? false

      if (!previousReady && nextReady) {
        reportAssetLoad(id, media.currentSrc || media.src || resolveActiveMediaUrl())
      }
    }
  }

  function onImageLoad(id: string, url: string) {
    imageReadyStates.value[id] = true
    imageErrorKinds.value[id] = null
    reportAssetLoad(id, url)
  }

  async function onImageError(id: string, url: string) {
    const failedItem = options.activeItem.value

    imageReadyStates.value[id] = false
    imageErrorKinds.value[id] = 'generic'
    const resolvedKind = await resolveVibeAssetErrorKind(url)
    imageErrorKinds.value[id] = resolvedKind

    if (failedItem) {
      options.onAssetError?.({
        item: failedItem,
        occurrenceKey: id,
        url,
        kind: resolvedKind,
        surface: 'fullscreen',
      })
    }
  }

  async function onMediaError(id: string, url: string) {
    const media = getMediaElementById(id)
    const state = ensureMediaState(id)
    const failedItem = options.activeMediaItem.value ?? options.activeItem.value

    if (media) {
      media.pause()
      try {
        media.currentTime = 0
      }
      catch {
        // Ignore reset failures for streams or not-yet-ready media elements.
      }
    }

    state.currentTime = 0
    state.duration = 0
    state.paused = true
    state.ready = false
    state.errorKind = 'generic'
    const resolvedKind = await resolveVibeAssetErrorKind(url)
    state.errorKind = resolvedKind

    if (failedItem) {
      options.onAssetError?.({
        item: failedItem,
        occurrenceKey: id,
        url,
        kind: resolvedKind,
        surface: 'fullscreen',
      })
    }
  }

  function onVideoClick(event: MouseEvent, id: string, suppressMediaToggleUntil: number) {
    if (event.button !== 0 || Date.now() < suppressMediaToggleUntil) {
      return
    }

    toggleMediaPlayback(videoElements.get(id) ?? null)
  }

  function onAudioCoverClick(event: MouseEvent, id: string, suppressMediaToggleUntil: number) {
    if (event.button !== 0 || Date.now() < suppressMediaToggleUntil) {
      return
    }

    toggleMediaPlayback(getMediaElementById(id))
  }

  function onMediaSeekInput(event: Event) {
    const media = getActiveMediaElement()
    const activeId = activeMediaItemKey.value

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

  function isImageReady(id: string) {
    return Boolean(imageReadyStates.value[id]) && !imageErrorKinds.value[id]
  }

  function isMediaReady(id: string) {
    return (mediaStates.value[id]?.ready ?? false) && !(mediaStates.value[id]?.errorKind)
  }

  function getImageSource(item: VibeViewerItem) {
    return item.url
  }

  function getAssetErrorKind(id: string) {
    return imageErrorKinds.value[id] ?? mediaStates.value[id]?.errorKind ?? null
  }

  function getAssetErrorLabel(id: string) {
    const errorKind = getAssetErrorKind(id)
    return errorKind ? getVibeAssetErrorLabel(errorKind) : null
  }

  function canRetryAsset(id: string) {
    return canRetryVibeAssetError(getAssetErrorKind(id))
  }

  function getAssetRenderKey(id: string) {
    return `${id}:${assetRenderVersions.value[id] ?? 0}`
  }

  async function retryAsset(id: string) {
    if (!canRetryAsset(id)) {
      return
    }

    imageReadyStates.value[id] = false
    imageErrorKinds.value[id] = null

    const state = ensureMediaState(id)
    state.currentTime = 0
    state.duration = 0
    state.paused = true
    state.ready = false
    state.errorKind = null

    const media = getMediaElementById(id)
    if (media) {
      pauseAndReset(media, id)
    }

    reportedLoadKeys.forEach((loadKey) => {
      if (loadKey.startsWith(`${id}|`)) {
        reportedLoadKeys.delete(loadKey)
      }
    })

    assetRenderVersions.value[id] = (assetRenderVersions.value[id] ?? 0) + 1

    await nextTick()
    await syncMediaPlayback()
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

  function getMediaElementById(id: string) {
    return videoElements.get(id) ?? audioElements.get(id) ?? null
  }

  function getActiveMediaElement() {
    return activeMediaItemKey.value ? getMediaElementById(activeMediaItemKey.value) : null
  }

  function toggleMediaPlayback(media: HTMLMediaElement | null) {
    if (!media) {
      return
    }

    if (media.paused) {
      playMediaElement(media)
      return
    }

    media.pause()
  }

  function reportAssetLoad(id: string, url: string | null) {
    const item = options.activeMediaItem.value ?? options.activeItem.value

    if (!item || !url) {
      return
    }

    const loadKey = `${id}|${url}`
    if (reportedLoadKeys.has(loadKey)) {
      return
    }

    reportedLoadKeys.add(loadKey)
    options.onAssetLoad?.({
      item,
      occurrenceKey: id,
      surface: 'fullscreen',
      url,
    })
  }

  function resolveActiveImageUrl() {
    return options.activeItem.value?.url ?? null
  }

  function resolveActiveMediaUrl() {
    return options.activeMediaItem.value?.url ?? options.activeItem.value?.url ?? null
  }

  return {
    activeAssetErrorKind,
    activeMediaDuration,
    activeMediaProgress,
    activeMediaState,
    getAssetErrorKind,
    getAssetErrorLabel,
    getAssetRenderKey,
    getImageSource,
    isImageReady,
    isMediaReady,
    canRetryAsset,
    mediaStates,
    onAudioCoverClick,
    onImageError,
    onImageLoad,
    onMediaError,
    onMediaEvent,
    onMediaSeekInput,
    onVideoClick,
    registerAudioElement,
    registerImageElement,
    registerVideoElement,
    resetMediaState,
    retryAsset,
    syncMediaPlayback,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
