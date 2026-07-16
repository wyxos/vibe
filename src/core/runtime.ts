import type {
  VibeAutofillState,
  VibeCursor,
  VibeItem,
  VibeItemId,
  VibeLayout,
} from '../types'

export interface VibeRuntimeState {
  activeReelPostId: VibeItemId | null
  autofill: VibeAutofillState
  error: unknown | null
  infiniteScroll: boolean
  isLoading: boolean
  isLoadingMore: boolean
  items: VibeItem[]
  layout: VibeLayout
  next: VibeCursor
  nextPageError: unknown | null
  reelOrigin: 'masonry' | null
  total: number | null
}
