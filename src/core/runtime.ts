import { computed, type ComputedRef } from 'vue'

import type {
  VibeAutoScrollState,
  VibeAutofillState,
  VibeCursor,
  VibeFillState,
  VibeItem,
  VibeItemId,
  VibeLayout,
  VibeReelAutoAdvanceState,
  VibeReelForwardState,
  VibeReelInfoSheetState,
  VibeState,
} from '../types'

export interface VibeRuntimeState {
  activeReelPostId: VibeItemId | null
  autoScroll: VibeAutoScrollState
  autofill: VibeAutofillState
  current: VibeCursor
  error: unknown | null
  fill: VibeFillState
  infiniteScroll: boolean
  isLoading: boolean
  isLoadingMore: boolean
  items: VibeItem[]
  layout: VibeLayout
  loadMoreLocked: boolean
  mediaIndices: Map<VibeItemId, number>
  next: VibeCursor
  nextPageError: unknown | null
  phoneMode: boolean
  reelAutoAdvance: VibeReelAutoAdvanceState
  reelForward: VibeReelForwardState
  reelForwardIndex: number | null
  reelForwardItem: VibeItem | null
  reelInfoSheet: VibeReelInfoSheetState
  reelInfoSheetOverlay: boolean
  reelMediaSource: 'original' | 'preview'
  reelOrigin: 'masonry' | null
  total: number | null
}

export function createItemSnapshot(
  state: VibeRuntimeState,
): ComputedRef<readonly VibeItem[]> {
  return computed(() => Object.freeze([...state.items]))
}

export function snapshotState(
  state: VibeRuntimeState,
  items: readonly VibeItem[] = [...state.items],
): VibeState {
  return {
    activeReelPostId: state.activeReelPostId,
    autoScroll: { ...state.autoScroll },
    autofill: { ...state.autofill },
    current: state.current,
    error: state.error,
    fill: {
      ...state.fill,
      target: state.fill.target ? { ...state.fill.target } : null,
    },
    infiniteScroll: state.infiniteScroll,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    items,
    layout: state.layout,
    lifecycle: state.isLoading || state.isLoadingMore
      ? 'loading'
      : state.error || state.nextPageError ? 'error' : 'loaded',
    loadMoreLocked: state.loadMoreLocked,
    next: state.next,
    nextPageError: state.nextPageError,
    phoneMode: state.phoneMode,
    reelAutoAdvance: { ...state.reelAutoAdvance },
    reelForward: { ...state.reelForward },
    reelInfoSheet: { ...state.reelInfoSheet },
    reelOrigin: state.reelOrigin,
    total: state.total,
  }
}
