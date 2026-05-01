import type { VibeViewerItem } from '@/components/viewer'
import type { VibeProps } from '@/components/viewer-core/useDataSource'

export function createSeededVibeProps(
  items: VibeViewerItem[],
  options: {
    activeIndex?: number
    bottomLoadBufferPx?: number
    cursor?: string | null
    emptyStateMode?: VibeProps['emptyStateMode']
    fillDelayMs?: number
    fillDelayStepMs?: number
    initialCursor?: string | null
    loopFullscreenVideo?: VibeProps['loopFullscreenVideo']
    nextCursor?: string | null
    pageSize?: number
    paginationDetail?: string | null
    previousCursor?: string | null
    resolve?: VibeProps['resolve']
    showEndBadge?: boolean
    showStatusBadges?: boolean
  } = {},
): VibeProps {
  const props: VibeProps = {
    bottomLoadBufferPx: options.bottomLoadBufferPx,
    emptyStateMode: options.emptyStateMode,
    fillDelayMs: options.fillDelayMs,
    fillDelayStepMs: options.fillDelayStepMs,
    initialCursor: options.initialCursor,
    initialState: {
      activeIndex: options.activeIndex,
      cursor: options.cursor ?? null,
      items,
      nextCursor: options.nextCursor,
      previousCursor: options.previousCursor,
    },
    loopFullscreenVideo: options.loopFullscreenVideo,
    pageSize: options.pageSize,
    paginationDetail: options.paginationDetail,
    resolve: options.resolve,
    showEndBadge: options.showEndBadge,
    showStatusBadges: options.showStatusBadges,
  }

  return props
}
