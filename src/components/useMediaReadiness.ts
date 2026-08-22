import {
  computed,
  nextTick,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'

import type { MediaPreviewState } from '../core/mediaPreview'

interface MediaReadinessOptions {
  identity: () => string
  mediaIndex: () => number
  onError: (mediaIndex: number) => void
  onReady: (mediaIndex: number) => void
  previewState: () => MediaPreviewState
}

export function useMediaReadiness(options: MediaReadinessOptions) {
  const imageElement = shallowRef<HTMLImageElement | null>(null)
  const mediaElement = shallowRef<HTMLMediaElement | null>(null)
  const sourceGeneration = shallowRef(0)
  const sourceRetry = shallowRef(0)
  const sourcePending = shallowRef(true)
  const terminalError = shallowRef(false)
  const retrying = shallowRef(false)
  let watchdog: ReturnType<typeof setTimeout> | null = null
  let initialized = false

  const effectivePreviewState = computed<MediaPreviewState>(() => {
    if (retrying.value) return 'error'
    if (terminalError.value) return 'error'
    if (sourcePending.value) return 'loading'
    return options.previewState()
  })

  function clearWatchdog(): void {
    if (watchdog !== null) clearTimeout(watchdog)
    watchdog = null
  }

  function eventIsCurrent(event: Event): boolean {
    return Number((event.currentTarget as HTMLElement).dataset.sourceGeneration)
      === sourceGeneration.value
  }

  function armWatchdog(): void {
    clearWatchdog()
    watchdog = setTimeout(() => failSourceAttempt(), 15_000)
  }

  function markSourceReady(event?: Event): void {
    if (event && !eventIsCurrent(event)) return
    clearWatchdog()
    sourcePending.value = false
    terminalError.value = false
    retrying.value = false
    options.onReady(options.mediaIndex())
  }

  function reconcileCachedSource(): void {
    const image = imageElement.value
    if (image?.complete) {
      if (image.naturalWidth > 0) markSourceReady()
      else failSourceAttempt()
      return
    }
    const media = mediaElement.value
    if (media && media.readyState >= HTMLMediaElement.HAVE_METADATA) {
      markSourceReady()
      return
    }
    armWatchdog()
  }

  function failSourceAttempt(event?: Event): void {
    if (event && !eventIsCurrent(event)) return
    clearWatchdog()
    if (!event && sourceRetry.value === 0) {
      sourceRetry.value = 1
      sourceGeneration.value += 1
      sourcePending.value = true
      void nextTick(reconcileCachedSource)
      return
    }
    sourcePending.value = false
    terminalError.value = true
    retrying.value = false
    options.onError(options.mediaIndex())
  }

  function retrySource(): void {
    if (retrying.value || effectivePreviewState.value !== 'error') return

    sourceRetry.value = 0
    terminalError.value = true
    sourcePending.value = true
    retrying.value = true
    sourceGeneration.value += 1
    void nextTick(reconcileCachedSource)
  }

  function noteSourceActivity(event: Event): void {
    if (eventIsCurrent(event) && sourcePending.value) armWatchdog()
  }

  watch(options.identity, () => {
    clearWatchdog()
    sourceGeneration.value += 1
    sourceRetry.value = 0
    sourcePending.value = initialized || options.previewState() === 'loading'
    terminalError.value = false
    retrying.value = false
    initialized = true
    void nextTick(reconcileCachedSource)
  }, { immediate: true })

  onBeforeUnmount(clearWatchdog)

  return {
    effectivePreviewState,
    failSourceAttempt,
    imageElement,
    markSourceReady,
    noteSourceActivity,
    retrySource,
    retrying,
    sourceGeneration,
    mediaElement,
  }
}
