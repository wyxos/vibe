import type {
  VibeAutofillSessionSnapshot,
  VibeBackendAutofillUpdate,
  VibeBackendFillUpdate,
  VibeFillSessionSnapshot,
  VibeFillTarget,
  VibeItem,
  VibeItemId,
  VibeItemPlacement,
  VibeLayoutMode,
  VibeMediaRemoval,
  VibeMediaTarget,
  VibePage,
  VibeReelAudioState,
  VibeReelAutoAdvanceOptions,
  VibeReelItemTarget,
  VibeReelNavigationResult,
  VibeRemoval,
  VibeState,
} from './types'

import type { VibeSelectionApi } from './selection'

export interface VibeInstance extends VibeSelectionApi {
  appendPage: (page: VibePage) => void
  applyAutofillUpdate: (update: VibeBackendAutofillUpdate) => boolean
  applyFillUpdate: (update: VibeBackendFillUpdate) => boolean
  cancelAutofill: () => Promise<void>
  cancelFill: () => Promise<void>
  cancelLoading: () => Promise<void>
  /** Close a feed-opened viewer, restoring feed position and source focus. */
  closeReel: () => void
  destroy: () => void
  fill: (target: VibeFillTarget) => Promise<void>
  getState: () => VibeState
  getReelAudioState: () => VibeReelAudioState
  loadNext: () => Promise<void>
  mount: () => Promise<void>
  navigateToReelItem: (target: VibeReelItemTarget) => VibeReelNavigationResult
  /** Open a loaded post as a closable viewer without switching the feed layout. */
  openReel: (postId: VibeItemId) => void
  nextReelMediaItem: () => boolean
  nextReelPost: () => boolean
  pauseAutoScroll: () => void
  previousReelMediaItem: () => boolean
  previousReelPost: () => boolean
  replenishAfterRemoval: () => Promise<void>
  refresh: () => Promise<void>
  reload: () => Promise<void>
  replacePage: (page: VibePage, options?: import('./core/pageReplacement').VibePageReplacementOptions) => Promise<void>
  removeMedia: (target: VibeMediaTarget) => VibeMediaRemoval | null
  removeMediaAnimated?: (target: VibeMediaTarget) => Promise<VibeMediaRemoval | null>
  removeItems: (postIds: readonly VibeItemId[], options?: import('./core/itemRemovalOptions').VibeItemRemovalOptions) => Promise<VibeRemoval>
  resumeAutoScroll: () => void
  restoreAutofillSession: (snapshot: VibeAutofillSessionSnapshot) => boolean
  restoreFillSession: (snapshot: VibeFillSessionSnapshot) => boolean
  restoreItems: (placements: readonly VibeItemPlacement[]) => void
  restoreMediaRemoval: (removal: VibeMediaRemoval) => boolean
  restoreRemoval: (removal: VibeRemoval) => boolean
  retryReelForward: () => Promise<void>
  retryFill: () => Promise<void>
  setAutoScroll: (enabled: boolean, speedPxPerSecond?: number) => void
  setAutoScrollSpeed: (speedPxPerSecond: number) => void
  setInfiniteScroll: (enabled: boolean) => void
  setLayout: (layout: VibeLayoutMode) => void
  setLoadMoreLocked: (locked: boolean) => void
  setTotal: (total: number | null) => void
  setReelAutoAdvance: (update: boolean | VibeReelAutoAdvanceOptions) => void
  setReelPreviews: (enabled: boolean) => void
  setReelAudioState: (state: VibeReelAudioState) => void
  setReelInfoSheet: (enabled: boolean) => void
  undoLastRemoval: () => VibeRemoval | null
  updateItems: (items: readonly VibeItem[]) => VibeItemId[]
}
