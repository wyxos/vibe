import { computed, nextTick, watch, type ShallowRef } from 'vue'

import { isTimedMedia } from '../core/mediaType'
import type { VibeLayout, VibeMediaType } from '../types'
import { emitMediaPlaybackDiagnostic } from './mediaPlaybackDiagnostic'

interface MediaLoadingOptions {
  active: () => boolean | undefined
  fetchPriority: () => 'high' | 'low'
  layout: () => VibeLayout
  mediaSource: () => string
  mediaType: () => VibeMediaType | undefined
  mediaElement: ShallowRef<HTMLMediaElement | null>
}

export function useMediaLoading(options: MediaLoadingOptions) {
  const mediaIsTimed = computed(() => isTimedMedia(options.mediaType(), options.mediaSource()))
  const imageLoading = computed(() => (
    options.layout() === 'masonry' && options.fetchPriority() === 'low'
      ? 'lazy' as const
      : 'eager' as const
  ))
  const timedMediaPreload = computed(() => {
    if (options.layout() === 'reel' && !options.active()) return 'none' as const
    if (options.fetchPriority() === 'high') return 'auto' as const
    return options.layout() === 'masonry' ? 'none' as const : 'metadata' as const
  })

  watch(timedMediaPreload, (preload, previous) => {
    if (previous !== 'none' || preload === 'none') return
    void nextTick(() => {
      const media = options.mediaElement.value
      if (!media) return
      emitMediaPlaybackDiagnostic(media, 'load-requested')
      media.load()
    })
  })

  return { imageLoading, mediaIsTimed, timedMediaPreload }
}
