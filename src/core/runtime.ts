import type {
  VibeCursor,
  VibeItem,
  VibeLayout,
} from '../types'

export interface VibeRuntimeState {
  error: unknown | null
  infiniteScroll: boolean
  isLoading: boolean
  isLoadingMore: boolean
  items: VibeItem[]
  layout: VibeLayout
  next: VibeCursor
  nextPageError: unknown | null
  total: number | null
}
