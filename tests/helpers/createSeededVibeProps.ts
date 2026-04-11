import type { VibeViewerItem } from '@/components/viewer'
import type { VibeProps } from '@/components/viewer-core/useDataSource'

export function createSeededVibeProps(
  items: VibeViewerItem[],
  options: {
    activeIndex?: number
    cursor?: string | null
    fillDelayMs?: number
    fillDelayStepMs?: number
    initialCursor?: string | null
    mode?: 'dynamic' | 'static'
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
    mode: options.mode,
    pageSize: options.pageSize,
    paginationDetail: options.paginationDetail,
    resolve: options.resolve,
    showEndBadge: options.showEndBadge,
    showStatusBadges: options.showStatusBadges,
  }

  return props
}
