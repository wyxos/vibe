export type VibeViewerType = 'image' | 'video' | 'audio' | 'other'
export type VibeRenderableMediaType = 'image' | 'video'

export interface VibeViewerAsset {
  url: string
  width?: number
  height?: number
  mediaType?: VibeRenderableMediaType
}

export interface VibeViewerItem {
  id: string
  type: VibeViewerType
  title?: string
  url: string
  preview?: VibeViewerAsset
  width?: number
  height?: number
  [key: string]: unknown
}
