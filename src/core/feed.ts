import type { VibeItem, VibeItemId } from '../types'
import type { MediaPreviewState } from './mediaPreview'

export interface FeedRendererProps {
  hasNext: boolean
  infiniteScroll: boolean
  isLoadingMore: boolean
  items: readonly VibeItem[]
  nextPageError: boolean
  previewStates: ReadonlyMap<VibeItemId, MediaPreviewState>
}

export interface MasonryFeedProps extends FeedRendererProps {
  enteringPostIds: ReadonlySet<VibeItemId>
  entryDelays: ReadonlyMap<VibeItemId, number>
  suspended?: boolean
}

export interface ReelFeedProps extends FeedRendererProps {
  initialPostId?: VibeItemId | null
}

export const LOAD_MORE_THRESHOLD = 240

export function isNearFeedBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight
    <= LOAD_MORE_THRESHOLD
}
