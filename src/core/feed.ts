import type {
  VibeCardRegion,
  VibeFeedFooter,
  VibeFeedFooterActions,
  VibeItem,
  VibeItemId,
  VibeMediaSource,
  VibeMediaCardOptions,
  VibeReelAutoAdvanceState,
  VibeReelForwardState,
  VibeReelInfoSheetOptions,
  VibeReelItemTarget,
  VibeReelNavigationResult,
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
  mediaCard?: VibeMediaCardOptions
  mediaIndices: ReadonlyMap<VibeItemId, number>
  nextPageError: boolean
  previewStates: ReadonlyMap<string, MediaPreviewState>
  state?: VibeState
  total: number | null
}

export interface MasonryFeedProps extends FeedRendererProps {
  enteringPostIds: ReadonlySet<VibeItemId>
  entryDelays: ReadonlyMap<VibeItemId, number>
  leavingPostIds?: ReadonlySet<VibeItemId>
  removalDelays?: ReadonlyMap<VibeItemId, number>
  suspended?: boolean
}

export interface FeedRendererExpose {
  changeActiveMedia?: (direction: -1 | 1) => boolean
  getScrollElement?: () => HTMLElement | null
  loadIfNearBottom: () => void
  moveActivePost?: (direction: -1 | 1) => boolean
  navigateToItem?: (postId: VibeItemId, mediaIndex: number) => boolean
  transitionActiveMedia?: (direction: -1 | 1) => Promise<boolean>
  transitionActivePost?: (postId: VibeItemId) => Promise<boolean>
}

export interface ReelFeedProps extends FeedRendererProps {
  initialPostId?: VibeItemId | null
  mediaSource?: VibeMediaSource
  reelAutoAdvance: VibeReelAutoAdvanceState
  reelForward?: VibeReelForwardState
}

export interface ReelLayoutProps extends ReelFeedProps {
  forwardIndex?: number | null
  forwardItem?: VibeItem | null
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
  navigateToReelItem: (target: VibeReelItemTarget) => VibeReelNavigationResult
  startItemRemoval: (postIds: readonly VibeItemId[]) => number
  transitionActiveReelMedia: (direction: -1 | 1) => Promise<boolean>
  transitionActiveReelPost: (postId: VibeItemId) => Promise<boolean>
}

export const LOAD_MORE_THRESHOLD = 240

export function isNearFeedBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight
    <= LOAD_MORE_THRESHOLD
}
