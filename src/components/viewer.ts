export type VibeViewerType = 'image' | 'video' | 'audio' | 'other'
export type VibeRenderableMediaType = 'image' | 'video'

export interface VibeViewerAsset {
  url: string
  width?: number
  height?: number
  mediaType?: VibeRenderableMediaType
}

export interface VibeViewerHealthCheck {
  kind?: 'playback'
  url: string
}

export interface VibeViewerItem {
  id: string
  type: VibeViewerType
  title?: string
  url: string
  preview?: VibeViewerAsset
  healthCheck?: VibeViewerHealthCheck | null
  width?: number
  height?: number
  [key: string]: unknown
}
