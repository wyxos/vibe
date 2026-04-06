export type VibeViewerType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'

export interface VibeViewerAsset {
  url: string
  width?: number
  height?: number
}

export interface VibeViewerItem {
  id: string
  type: VibeViewerType
  title?: string
  url: string
  preview?: VibeViewerAsset
  width?: number
  height?: number
}
