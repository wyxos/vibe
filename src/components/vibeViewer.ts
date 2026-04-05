export type VibeViewerType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'

export interface VibeViewerAsset {
  url: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
}

export interface VibeViewerItem {
  id: string
  type: VibeViewerType
  title: string
  extension: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  preview?: VibeViewerAsset
  original: VibeViewerAsset
  durationMs?: number
  width?: number
  height?: number
}
