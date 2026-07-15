import type {
  VibeCardRegion,
  VibeItem,
  VibeItemId,
  VibeMediaSource,
} from '../types'
import type { MediaPreviewState } from './mediaPreview'

export interface FeedRendererProps {
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
  hasNext: boolean
  infiniteScroll: boolean
  isLoadingMore: boolean
  items: readonly VibeItem[]
  mediaIndices: ReadonlyMap<VibeItemId, number>
  nextPageError: boolean
  previewStates: ReadonlyMap<string, MediaPreviewState>
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
}

export const LOAD_MORE_THRESHOLD = 240

export function isNearFeedBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight
    <= LOAD_MORE_THRESHOLD
}
