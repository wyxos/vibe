import type { CreateVibeOptions, VibeLayoutMode } from '../types'
import { createAutofillState } from './autofill'
import { createAutoScrollState } from './autoScroll'
import { createFillState } from './fill'
import { appendUniqueItems } from './page'
import { createReelAutoAdvanceState } from './reelAutoAdvance'
import { createReelInfoSheetState } from './reelInfoSheet'
import type { VibeRuntimeState } from './runtime'

export function createInitialRuntimeState(
  options: CreateVibeOptions,
  layoutMode: VibeLayoutMode,
): VibeRuntimeState {
  const initialPage = options.initialPage

  return {
    activeReelPostId: null,
    autoScroll: createAutoScrollState(options.autoScroll),
    autofill: createAutofillState(options.autofill),
    error: null,
    fill: createFillState(options.fill),
    infiniteScroll: options.infiniteScroll ?? true,
    isLoading: !initialPage,
    isLoadingMore: false,
    items: initialPage ? appendUniqueItems([], initialPage.items) : [],
    layout: layoutMode === 'reel' ? 'reel' : 'masonry',
    loadMoreLocked: false,
    mediaIndices: new Map(),
    next: initialPage?.next ?? null,
    nextPageError: null,
    phoneMode: false,
    reelAutoAdvance: createReelAutoAdvanceState(options.reelAutoAdvance),
    reelForward: { error: null, status: 'idle' },
    reelForwardIndex: null,
    reelForwardItem: null,
    reelInfoSheet: createReelInfoSheetState(options.reelInfoSheet),
    reelInfoSheetOverlay: false,
    reelMediaSource: 'original',
    reelOrigin: null,
    total: initialPage?.total ?? null,
  }
}
