import type { Component } from 'vue'

import type { VibeMediaError } from './mediaPreview'
import type { VibeMediaOverlayProps } from '../types'

export interface VibeMediaControlAction {
  id: string
  label: string
  disabled?: boolean
  selected?: boolean
  /** Keep the options open for inline selection. Defaults to false. */
  keepOpen?: boolean
  onSelect: () => void
}

export interface VibeMediaControlsOptions {
  showMute?: boolean
  /** Defaults to Vibe's standard speeds. An empty array hides speed controls. */
  playbackRates?: readonly number[]
  /** Resolve actions for the active media. Selection and playback changes belong to the consumer. */
  actions?: (media: VibeMediaOverlayProps) => readonly VibeMediaControlAction[]
}

export interface VibeCardChromeStyle {
  background?: 'default' | 'transparent'
  paddingX?: number
  paddingY?: number
}

export interface VibeMediaCardOptions {
  controls?: VibeMediaControlsOptions
  error?: VibeMediaError
  feedPreload?: 'none' | 'visible-post'
  footer?: VibeCardChromeStyle
  header?: VibeCardChromeStyle
  overlay?: {
    component: Component
  }
  /** Mute masonry previews (default true). Reel audio uses initialReelAudioState. */
  videoMuted?: boolean
  /** Keep masonry video playback paused until its card transition settles. */
  pauseVideoDuringTransitions?: boolean
}

export interface VibeReelAudioState {
  lastAudibleVolume: number
  muted: boolean
  volume: number
}
