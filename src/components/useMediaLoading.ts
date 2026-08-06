import { computed, nextTick, watch, type ShallowRef } from 'vue'

import { isTimedMediaSource } from '../core/mediaType'
import type { VibeLayout } from '../types'

interface MediaLoadingOptions {
  fetchPriority: () => 'high' | 'low'
  layout: () => VibeLayout
  mediaSource: () => string
  videoElement: ShallowRef<HTMLVideoElement | null>
}

export function useMediaLoading(options: MediaLoadingOptions) {
  const mediaIsTimed = computed(() => isTimedMediaSource(options.mediaSource()))
  const imageLoading = computed(() => (
    options.layout() === 'masonry' && options.fetchPriority() === 'low'
      ? 'lazy' as const
      : 'eager' as const
  ))
  const videoPreload = computed(() => {
    if (options.fetchPriority() === 'high') return 'auto' as const
    return options.layout() === 'masonry' ? 'none' as const : 'metadata' as const
  })

  watch(videoPreload, (preload, previous) => {
    if (previous !== 'none' || preload === 'none') return
    void nextTick(() => options.videoElement.value?.load())
  })

  return { imageLoading, mediaIsTimed, videoPreload }
}
