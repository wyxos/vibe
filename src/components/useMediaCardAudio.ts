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
  mediaElement: Ref<HTMLMediaElement | null>
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
    const media = options.mediaElement.value
    const reelAudioState = options.reelAudioState()
    if (!media || options.layout() !== 'reel' || !reelAudioState) return

    const state = normalizeReelAudioState(reelAudioState)
    lastAudibleVolume = state.lastAudibleVolume
    videoVolume.value = state.volume
    videoIsMuted.value = state.muted
    media.volume = state.volume
    media.muted = options.active() === false ? true : state.muted
  }

  function sync(media: HTMLMediaElement, syncMuted: boolean): void {
    if (syncMuted) videoIsMuted.value = media.muted
    videoVolume.value = media.volume
    if (media.volume > 0) lastAudibleVolume = media.volume
  }

  function publish(media: HTMLMediaElement): void {
    if (options.layout() !== 'reel') return
    const state = normalizeReelAudioState({
      lastAudibleVolume,
      muted: media.muted,
      volume: media.volume,
    })
    videoIsMuted.value = state.muted
    videoVolume.value = state.volume
    lastAudibleVolume = state.lastAudibleVolume
    options.onChange(state)
  }

  function setVolume(volume: number): void {
    const media = options.mediaElement.value
    if (!media || !Number.isFinite(volume)) return
    const nextVolume = Math.min(1, Math.max(0, volume))
    media.volume = nextVolume
    media.muted = nextVolume === 0
    if (nextVolume > 0) lastAudibleVolume = nextVolume
    sync(media, true)
    publish(media)
  }

  function toggleMute(): void {
    const media = options.mediaElement.value
    if (!media) return
    if (media.muted && media.volume === 0) media.volume = lastAudibleVolume
    media.muted = !media.muted
    sync(media, true)
    publish(media)
  }

  watch(
    [
      options.active,
      options.layout,
      () => options.reelAudioState()?.lastAudibleVolume,
      () => options.reelAudioState()?.muted,
      () => options.reelAudioState()?.volume,
      options.mediaElement,
    ],
    apply,
    { immediate: true },
  )

  return { apply, setVolume, sync, toggleMute, videoIsMuted, videoVolume }
}
