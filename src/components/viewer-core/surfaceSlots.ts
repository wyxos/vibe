import type { VibeViewerItem } from '../viewer'
import type { VibeFullscreenPreviewItem } from './fullscreenPreviews'

export type { VibeFullscreenPreviewItem } from './fullscreenPreviews'

export type VibeSurfaceSlotProps = {
  hasNextPage: boolean
  index: number
  item: VibeViewerItem
  loading: boolean
  nextPreviews: VibeFullscreenPreviewItem[]
  paginationDetail: string | null
  total: number
}

export type VibeEmptyStateMode = 'inline' | 'badge' | 'hidden'

export type VibeEmptyStateSlotProps = {
  loading: boolean
  message: string
  mode: Exclude<VibeEmptyStateMode, 'hidden'>
  surface: 'fullscreen' | 'grid'
  total: number
}

export type VibeSurfaceStatusKind = 'end' | 'failed' | 'filling' | 'initializing' | 'loading-more' | 'refreshing'

export type VibeFullscreenStatusSlotProps = VibeSurfaceSlotProps & {
  kind: VibeSurfaceStatusKind
  message: string
}

export type VibeGridStatusSlotProps = {
  activeIndex: number
  kind: VibeSurfaceStatusKind
  loading: boolean
  message: string
  paginationDetail: string | null
  total: number
}
