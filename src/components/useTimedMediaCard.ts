import { shallowRef, watch, type Ref } from 'vue'

import type {
  VibeLayout,
  VibeMediaCardOptions,
  VibeReelAudioState,
} from '../types'
import { useMediaCardAudio } from './useMediaCardAudio'
import { useReelTimedMediaActivity } from './useReelVideoActivity'

interface TimedMediaCardOptions {
  active: () => boolean | undefined
  layout: () => VibeLayout
  mediaCard: () => VibeMediaCardOptions | undefined
  mediaElement: Ref<HTMLMediaElement | null>
  onAudioChange: (state: VibeReelAudioState) => void
  onEnded: () => void
  onReady: (event: Event) => void
  reelAudioState: () => VibeReelAudioState | undefined
}

function finiteMediaValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function useTimedMediaCard(options: TimedMediaCardOptions) {
  const currentTime = shallowRef(0)
  const duration = shallowRef(0)
  const isPlaying = shallowRef(false)
  const {
    apply: applyAudioState,
    setVolume,
    sync: syncAudioState,
    toggleMute,
    videoIsMuted: isMuted,
    videoVolume: volume,
  } = useMediaCardAudio({
    active: options.active,
    layout: options.layout,
    mediaCard: options.mediaCard,
    mediaElement: options.mediaElement,
    onChange: options.onAudioChange,
    reelAudioState: options.reelAudioState,
  })
  const {
    effectiveMuted,
    onPlaying,
    playbackAllowed,
  } = useReelTimedMediaActivity({
    active: options.active,
    layout: options.layout,
    mediaElement: options.mediaElement,
    mediaIsMuted: isMuted,
    mediaIsPlaying: isPlaying,
  })

  function sync(event?: Event): void {
    const media = (event?.currentTarget as HTMLMediaElement | null)
      ?? options.mediaElement.value
    if (!media) return
    currentTime.value = finiteMediaValue(media.currentTime)
    duration.value = finiteMediaValue(media.duration)
    syncAudioState(media, playbackAllowed.value)
  }

  function onLoadedMetadata(event: Event): void {
    applyAudioState()
    sync(event)
    options.onReady(event)
  }

  function onEnded(): void {
    isPlaying.value = false
    options.onEnded()
  }

  function seek(time: number): void {
    const media = options.mediaElement.value
    if (!media || !Number.isFinite(time)) return
    media.currentTime = Math.min(finiteMediaValue(media.duration), Math.max(0, time))
    currentTime.value = media.currentTime
  }

  async function togglePlayback(): Promise<void> {
    const media = options.mediaElement.value
    if (!media || !playbackAllowed.value) return
    if (isPlaying.value) {
      media.pause()
      return
    }
    try {
      await media.play()
    } catch {
      isPlaying.value = false
    }
  }

  watch(options.mediaElement, () => {
    currentTime.value = 0
    duration.value = 0
    isPlaying.value = false
  }, { flush: 'sync' })

  return {
    currentTime,
    duration,
    effectiveMuted,
    isMuted,
    isPlaying,
    onEnded,
    onLoadedMetadata,
    onPlaying,
    playbackAllowed,
    seek,
    setVolume,
    sync,
    toggleMute,
    togglePlayback,
    volume,
  }
}
