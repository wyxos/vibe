import type { FakeMediaItem } from '@/demo/fakeServer'
import type { MediaPreviewState } from '@/demo/mediaPreview'

export interface FeedRendererProps {
  hasNext: boolean
  infiniteScroll: boolean
  isLoadingMore: boolean
  items: readonly FakeMediaItem[]
  nextPageError: boolean
  previewStates: ReadonlyMap<number, MediaPreviewState>
}

export interface MasonryFeedProps extends FeedRendererProps {
  enteringPostIds: ReadonlySet<number>
  entryDelays: ReadonlyMap<number, number>
}

export const LOAD_MORE_THRESHOLD = 240

export function isNearFeedBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight
    <= LOAD_MORE_THRESHOLD
}
