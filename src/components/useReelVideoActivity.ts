import {
  computed,
  nextTick,
  watch,
  type Ref,
} from 'vue'

import type { VibeLayout } from '../types'

interface ReelTimedMediaActivityOptions {
  active: () => boolean | undefined
  inViewport: () => boolean
  layout: () => VibeLayout
  mediaElement: Ref<HTMLMediaElement | null>
  mediaIsMuted: Ref<boolean>
  mediaIsPlaying: Ref<boolean>
}

export function useReelTimedMediaActivity(options: ReelTimedMediaActivityOptions) {
  const playbackAllowed = computed(() => (
    options.layout() === 'reel'
      ? options.active() === true
      : options.inViewport()
  ))
  const effectiveMuted = computed(() => (
    playbackAllowed.value ? options.mediaIsMuted.value : true
  ))

  function onPlaying(): void {
    if (!playbackAllowed.value) {
      options.mediaElement.value?.pause()
      options.mediaIsPlaying.value = false
      return
    }

    options.mediaIsPlaying.value = true
  }

  watch(playbackAllowed, (allowed) => {
    const media = options.mediaElement.value
    if (!allowed) {
      media?.pause()
      if (media) media.muted = true
      options.mediaIsPlaying.value = false
      return
    }

    void nextTick().then(async () => {
      const activeMedia = options.mediaElement.value
      if (!activeMedia || !playbackAllowed.value) return

      activeMedia.muted = options.mediaIsMuted.value
      try {
        await activeMedia.play()
      } catch {
        options.mediaIsPlaying.value = false
      }
    })
  })

  return {
    effectiveMuted,
    onPlaying,
    playbackAllowed,
  }
}
