import { nextTick, type Ref } from 'vue'
import { calculateColumnHeights } from './masonryUtils'
import type { ProcessedMasonryItem } from './types'

/**
 * Composable for handling masonry scroll behavior and item cleanup
 */
export function useMasonryScroll({
  container,
  masonry,
  columns,
  containerHeight,
  isLoading,
  pageSize,
  refreshLayout,
  setItemsRaw,
  loadNext,
  loadThresholdPx
}: {
  container: Ref<HTMLElement | null>
  masonry: Ref<ProcessedMasonryItem[]>
  columns: Ref<number>
  containerHeight: Ref<number>
  isLoading: Ref<boolean>
  pageSize: number
  refreshLayout: (items: ProcessedMasonryItem[]) => void
  setItemsRaw: (items: ProcessedMasonryItem[]) => void
  loadNext: () => Promise<any>
  loadThresholdPx?: number
}) {
  let cleanupInProgress = false
  let lastScrollTop = 0

  async function handleScroll(precomputedHeights?: number[]) {
    if (!container.value) return

    const columnHeights = precomputedHeights ?? calculateColumnHeights(masonry.value, columns.value)
    const tallest = columnHeights.length ? Math.max(...columnHeights) : 0
    const scrollerBottom = container.value.scrollTop + container.value.clientHeight

    const isScrollingDown = container.value.scrollTop > lastScrollTop + 1 // tolerate tiny jitter
    lastScrollTop = container.value.scrollTop

    const threshold = typeof loadThresholdPx === 'number' ? loadThresholdPx : 200
    const triggerPoint = threshold >= 0
      ? Math.max(0, tallest - threshold)
      : Math.max(0, tallest + threshold)
    const nearBottom = scrollerBottom >= triggerPoint

    if (nearBottom && isScrollingDown && !isLoading.value) {
      await loadNext()
      await nextTick()
      return
    }
  }

  return {
    handleScroll
  }
}
