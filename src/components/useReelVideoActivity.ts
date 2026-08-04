import {
  computed,
  nextTick,
  watch,
  type Ref,
} from 'vue'

import type { VibeLayout } from '../types'

interface ReelVideoActivityOptions {
  active: () => boolean | undefined
  layout: () => VibeLayout
  videoElement: Ref<HTMLVideoElement | null>
  videoIsMuted: Ref<boolean>
  videoIsPlaying: Ref<boolean>
}

export function useReelVideoActivity(options: ReelVideoActivityOptions) {
  const playbackAllowed = computed(() => (
    options.layout() !== 'reel' || options.active() === true
  ))
  const effectiveMuted = computed(() => (
    playbackAllowed.value ? options.videoIsMuted.value : true
  ))

  function onPlaying(): void {
    if (!playbackAllowed.value) {
      options.videoElement.value?.pause()
      options.videoIsPlaying.value = false
      return
    }

    options.videoIsPlaying.value = true
  }

  watch(playbackAllowed, (allowed) => {
    const video = options.videoElement.value
    if (!allowed) {
      video?.pause()
      if (video) video.muted = true
      options.videoIsPlaying.value = false
      return
    }

    void nextTick().then(async () => {
      const activeVideo = options.videoElement.value
      if (!activeVideo || !playbackAllowed.value) return

      activeVideo.muted = options.videoIsMuted.value
      try {
        await activeVideo.play()
      } catch {
        options.videoIsPlaying.value = false
      }
    })
  })

  return {
    effectiveMuted,
    onPlaying,
    playbackAllowed,
  }
}
