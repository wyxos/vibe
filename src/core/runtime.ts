import type {
  VibeAutofillState,
  VibeCursor,
  VibeFillState,
  VibeItem,
  VibeItemId,
  VibeLayout,
  VibeState,
} from '../types'

export interface VibeRuntimeState {
  activeReelPostId: VibeItemId | null
  autofill: VibeAutofillState
  error: unknown | null
  fill: VibeFillState
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

export function snapshotState(state: VibeRuntimeState): VibeState {
  return {
    activeReelPostId: state.activeReelPostId,
    autofill: { ...state.autofill },
    error: state.error,
    fill: {
      ...state.fill,
      target: state.fill.target ? { ...state.fill.target } : null,
    },
    infiniteScroll: state.infiniteScroll,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    items: [...state.items],
    layout: state.layout,
    lifecycle: state.isLoading || state.isLoadingMore
      ? 'loading'
      : state.error || state.nextPageError ? 'error' : 'loaded',
    next: state.next,
    nextPageError: state.nextPageError,
    reelOrigin: state.reelOrigin,
    total: state.total,
  }
}
