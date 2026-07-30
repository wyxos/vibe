import type {
  VibeCardRegion,
  VibeFeedFooter,
  VibeFeedFooterActions,
  VibeItem,
  VibeItemId,
  VibeMediaSource,
  VibeReelAutoAdvanceState,
  VibeReelInfoSheetOptions,
  VibeReelOrigin,
  VibeState,
} from '../types'
import type { MediaPreviewState } from './mediaPreview'

export interface FeedRendererProps {
  canRetryEnd: boolean
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
  feedFooter?: VibeFeedFooter
  feedFooterActions?: VibeFeedFooterActions
  hasNext: boolean
  infiniteScroll: boolean
  isLoadingMore: boolean
  items: readonly VibeItem[]
  loadMoreLocked: boolean
  mediaIndices: ReadonlyMap<VibeItemId, number>
  nextPageError: boolean
  previewStates: ReadonlyMap<string, MediaPreviewState>
  state?: VibeState
  total: number | null
}

export interface MasonryFeedProps extends FeedRendererProps {
  enteringPostIds: ReadonlySet<VibeItemId>
  entryDelays: ReadonlyMap<VibeItemId, number>
  suspended?: boolean
}

export interface ReelFeedProps extends FeedRendererProps {
  initialPostId?: VibeItemId | null
  mediaSource?: VibeMediaSource
  reelAutoAdvance: VibeReelAutoAdvanceState
}

export interface ReelLayoutProps extends ReelFeedProps {
  infoSheet?: VibeReelInfoSheetOptions
  infoSheetEnabled: boolean
  infoSheetOverlay: boolean
  origin: VibeReelOrigin
}

export interface VibeSurfaceExpose {
  changeActiveReelMedia: (direction: -1 | 1) => boolean
  getAutoScrollElement: () => HTMLElement | null
  loadIfNearBottom: () => Promise<void>
  moveActiveReelPost: (direction: -1 | 1) => boolean
}

export const LOAD_MORE_THRESHOLD = 240

export function isNearFeedBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight
    <= LOAD_MORE_THRESHOLD
}
