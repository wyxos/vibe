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
  maxItems,
  pageSize,
  refreshLayout,
  setItemsRaw,
  loadNext
}: {
  container: Ref<HTMLElement | null>
  masonry: Ref<ProcessedMasonryItem[]>
  columns: Ref<number>
  containerHeight: Ref<number>
  isLoading: Ref<boolean>
  maxItems: number
  pageSize: number
  refreshLayout: (items: ProcessedMasonryItem[]) => void
  setItemsRaw: (items: ProcessedMasonryItem[]) => void
  loadNext: () => Promise<any>
}) {
  let cleanupInProgress = false
  let lastScrollTop = 0

  async function handleScroll(precomputedHeights?: number[]) {
    if (!container.value) return

    const shortestColumnHeight = Math.min(...calculateColumnHeights(masonry.value, columns.value))
    const scrollerBottom = container.value.scrollTop + container.value.clientHeight

    const isScrollingDown = container.value.scrollTop > lastScrollTop + 1 // tolerate tiny jitter
    const whitespaceVisible = shortestColumnHeight < scrollerBottom + 300

    lastScrollTop = container.value.scrollTop

    if (whitespaceVisible && isScrollingDown && !isLoading.value) {
        // items count
        const currentCount = masonry.value.length

        if(currentCount > maxItems){

        }


        await loadNext()

        await nextTick()

        isLoading.value = false

        return;
    }
  }

  return {
    handleScroll
  }
}
