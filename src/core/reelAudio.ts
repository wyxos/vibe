import type { VibeReelAudioState } from '../types'

export const DEFAULT_REEL_AUDIO_STATE: VibeReelAudioState = {
  lastAudibleVolume: 1,
  muted: false,
  volume: 1,
}

function volume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback
}

export function normalizeReelAudioState(
  state: Partial<VibeReelAudioState> | null | undefined,
  fallback: VibeReelAudioState = DEFAULT_REEL_AUDIO_STATE,
): VibeReelAudioState {
  const normalizedVolume = volume(state?.volume, fallback.volume)
  const lastAudibleVolume = volume(
    state?.lastAudibleVolume,
    normalizedVolume > 0 ? normalizedVolume : fallback.lastAudibleVolume,
  )
  return {
    lastAudibleVolume: lastAudibleVolume > 0
      ? lastAudibleVolume
      : DEFAULT_REEL_AUDIO_STATE.lastAudibleVolume,
    muted: typeof state?.muted === 'boolean'
      ? state.muted
      : normalizedVolume === 0 || fallback.muted,
    volume: normalizedVolume,
  }
}
