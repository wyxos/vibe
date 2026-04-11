import type { VibeViewerItem } from '../viewer'

export type VibeSurfaceSlotProps = {
  hasNextPage: boolean
  index: number
  item: VibeViewerItem
  loading: boolean
  paginationDetail: string | null
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
