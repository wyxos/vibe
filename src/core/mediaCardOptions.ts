import type { VibeMediaError } from './mediaPreview'

export interface VibeCardChromeStyle {
  background?: 'default' | 'transparent'
  paddingX?: number
  paddingY?: number
}

export interface VibeMediaCardOptions {
  error?: VibeMediaError
  feedPreload?: 'none' | 'replacement'
  footer?: VibeCardChromeStyle
  header?: VibeCardChromeStyle
  videoMuted?: boolean
}

export interface VibeReelAudioState {
  lastAudibleVolume: number
  muted: boolean
  volume: number
}
