import { shallowRef, watch, type Ref } from 'vue'

import { normalizeReelAudioState } from '../core/reelAudio'
import type {
  VibeLayout,
  VibeMediaCardOptions,
  VibeReelAudioState,
} from '../types'

interface MediaCardAudioOptions {
  active: () => boolean | undefined
  layout: () => VibeLayout
  mediaCard: () => VibeMediaCardOptions | undefined
  onChange: (state: VibeReelAudioState) => void
  reelAudioState: () => VibeReelAudioState | undefined
  videoElement: Ref<HTMLVideoElement | null>
}

export function useMediaCardAudio(options: MediaCardAudioOptions) {
  const initial = normalizeReelAudioState(options.reelAudioState())
  const shared = options.layout() === 'reel' && options.reelAudioState()
  const videoIsMuted = shallowRef(shared
    ? initial.muted
    : options.mediaCard()?.videoMuted ?? options.layout() === 'masonry')
  const videoVolume = shallowRef(shared ? initial.volume : 1)
  let lastAudibleVolume = shared ? initial.lastAudibleVolume : 1

  function apply(): void {
    const video = options.videoElement.value
    const reelAudioState = options.reelAudioState()
    if (!video || options.layout() !== 'reel' || !reelAudioState) return

    const state = normalizeReelAudioState(reelAudioState)
    lastAudibleVolume = state.lastAudibleVolume
    videoVolume.value = state.volume
    videoIsMuted.value = state.muted
    video.volume = state.volume
    video.muted = options.active() === false ? true : state.muted
  }

  function sync(video: HTMLVideoElement, syncMuted: boolean): void {
    if (syncMuted) videoIsMuted.value = video.muted
    videoVolume.value = video.volume
    if (video.volume > 0) lastAudibleVolume = video.volume
  }

  function publish(video: HTMLVideoElement): void {
    if (options.layout() !== 'reel') return
    const state = normalizeReelAudioState({
      lastAudibleVolume,
      muted: video.muted,
      volume: video.volume,
    })
    videoIsMuted.value = state.muted
    videoVolume.value = state.volume
    lastAudibleVolume = state.lastAudibleVolume
    options.onChange(state)
  }

  function setVolume(volume: number): void {
    const video = options.videoElement.value
    if (!video || !Number.isFinite(volume)) return
    const nextVolume = Math.min(1, Math.max(0, volume))
    video.volume = nextVolume
    video.muted = nextVolume === 0
    if (nextVolume > 0) lastAudibleVolume = nextVolume
    sync(video, true)
    publish(video)
  }

  function toggleMute(): void {
    const video = options.videoElement.value
    if (!video) return
    if (video.muted && video.volume === 0) video.volume = lastAudibleVolume
    video.muted = !video.muted
    sync(video, true)
    publish(video)
  }

  watch(
    [
      options.active,
      options.layout,
      () => options.reelAudioState()?.lastAudibleVolume,
      () => options.reelAudioState()?.muted,
      () => options.reelAudioState()?.volume,
      options.videoElement,
    ],
    apply,
    { immediate: true },
  )

  return { apply, setVolume, sync, toggleMute, videoIsMuted, videoVolume }
}
