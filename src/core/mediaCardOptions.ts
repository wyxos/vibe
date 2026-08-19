import type { Component } from 'vue'

import type { VibeMediaError } from './mediaPreview'

export interface VibeCardChromeStyle {
  background?: 'default' | 'transparent'
  paddingX?: number
  paddingY?: number
}

export interface VibeMediaCardOptions {
  error?: VibeMediaError
  feedPreload?: 'none' | 'visible-post'
  footer?: VibeCardChromeStyle
  header?: VibeCardChromeStyle
  overlay?: {
    component: Component
  }
  videoMuted?: boolean
}

export interface VibeReelAudioState {
  lastAudibleVolume: number
  muted: boolean
  volume: number
}
