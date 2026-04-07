import { computed, nextTick, ref, watch, type Ref } from 'vue'

import type { VibeViewerItem } from '../vibeViewer'
import { createMediaUiState, DEFAULT_MEDIA_UI_STATE, isImageElementReady, syncMediaUiState, type MediaUiState } from './assetState'
import { getVibeAssetErrorLabel, resolveVibeAssetErrorKind, type VibeAssetErrorKind } from './loadError'
import { playMediaElement } from './mediaPlayback'

export function useVibeRootMedia(options: {
  activeItem: Ref<VibeViewerItem | null>
  activeMediaItem: Ref<VibeViewerItem | null>
  isEnabled: Ref<boolean>
  itemCount: Ref<number>
}) {
  const imageReadyStates = ref<Record<string, boolean>>({})
  const imageErrorKinds = ref<Record<string, VibeAssetErrorKind | null>>({})
  const mediaStates = ref<Record<string, MediaUiState>>({})

  const videoElements = new Map<string, HTMLVideoElement>()
  const audioElements = new Map<string, HTMLAudioElement>()

  const activeMediaState = computed(() => {
    if (!options.activeMediaItem.value) {
      return DEFAULT_MEDIA_UI_STATE
    }

    return mediaStates.value[options.activeMediaItem.value.id] ?? DEFAULT_MEDIA_UI_STATE
  })
  const activeMediaDuration = computed(() => {
    if (!options.activeMediaItem.value) {
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
  const activeAssetErrorKind = computed(() => options.activeItem.value ? getAssetErrorKind(options.activeItem.value.id) : null)

  watch(
    () => options.activeItem.value?.id ?? null,
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
    }
  }

  function resetMediaState() {
    pauseAndResetAllMedia()
    imageErrorKinds.value = {}
    imageReadyStates.value = {}
    mediaStates.value = {}
  }

  async function syncMediaPlayback() {
    if (!options.isEnabled.value) {
      pauseAndResetAllMedia()
      return
    }

    await nextTick()

    const activeId = options.activeItem.value?.id ?? null

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
      updateMediaState(id, media, event.type)
    }
  }

  function onImageLoad(id: string) {
    imageReadyStates.value[id] = true
    imageErrorKinds.value[id] = null
  }

  async function onImageError(id: string, url: string) {
    imageReadyStates.value[id] = false
    imageErrorKinds.value[id] = 'generic'
    imageErrorKinds.value[id] = await resolveVibeAssetErrorKind(url)
  }

  async function onMediaError(id: string, url: string) {
    const media = getMediaElementById(id)
    const state = ensureMediaState(id)

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
    state.errorKind = await resolveVibeAssetErrorKind(url)
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
    const activeId = options.activeMediaItem.value?.id

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
    return options.activeMediaItem.value ? getMediaElementById(options.activeMediaItem.value.id) : null
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

  return {
    activeAssetErrorKind,
    activeMediaDuration,
    activeMediaProgress,
    activeMediaState,
    getAssetErrorKind,
    getAssetErrorLabel,
    getImageSource,
    isImageReady,
    isMediaReady,
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
    syncMediaPlayback,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
