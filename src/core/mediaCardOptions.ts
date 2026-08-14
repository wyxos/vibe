export interface VibeCardChromeStyle {
  background?: 'default' | 'transparent'
  paddingX?: number
  paddingY?: number
}

export type VibeGroupedMediaNavigation = 'arrows' | 'thumbnails'

export interface VibeMediaCardOptions {
  footer?: VibeCardChromeStyle
  groupedMediaNavigation?: VibeGroupedMediaNavigation
  header?: VibeCardChromeStyle
  videoMuted?: boolean
}

export interface VibeReelAudioState {
  lastAudibleVolume: number
  muted: boolean
  volume: number
}
