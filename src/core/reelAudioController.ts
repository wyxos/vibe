import { reactive } from 'vue'

import type { CreateVibeOptions, VibeReelAudioState } from '../types'
import { normalizeReelAudioState } from './reelAudio'

export class VibeReelAudioController {
  readonly state: VibeReelAudioState

  constructor(private readonly options: CreateVibeOptions) {
    this.state = reactive(normalizeReelAudioState({
      ...options.initialReelAudioState,
      muted: options.initialReelAudioState?.muted
        ?? options.mediaCard?.videoMuted
        ?? false,
    }))
  }

  get(): VibeReelAudioState {
    return { ...this.state }
  }

  set(state: VibeReelAudioState, notify = false): void {
    Object.assign(this.state, normalizeReelAudioState(state, this.state))
    if (notify) this.options.onReelAudioStateChange?.(this.get())
  }
}
