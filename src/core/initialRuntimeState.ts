import type { CreateVibeOptions, VibeLayoutMode } from '../types'
import { createAutofillState } from './autofill'
import { createAutoScrollState } from './autoScroll'
import { createFillState } from './fill'
import { appendUniqueItems } from './page'
import { createReelAutoAdvanceState } from './reelAutoAdvance'
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
    next: initialPage?.next ?? null,
    nextPageError: null,
    reelAutoAdvance: createReelAutoAdvanceState(options.reelAutoAdvance),
    reelMediaSource: 'original',
    reelOrigin: null,
    total: initialPage?.total ?? null,
  }
}
