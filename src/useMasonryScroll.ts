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
  loadNext,
  leaveEstimateMs
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
  leaveEstimateMs?: number
}) {
  let cleanupInProgress = false

  async function handleScroll() {
    if (!container.value) return

    const { scrollTop, clientHeight } = container.value
    const visibleBottom = scrollTop + clientHeight

    const columnHeights = calculateColumnHeights(masonry.value, columns.value)
    const longestColumn = Math.max(...columnHeights)
    const whitespaceVisible = longestColumn + 300 < visibleBottom - 1
    const reachedContainerBottom = scrollTop + clientHeight >= containerHeight.value - 1

    if ((whitespaceVisible || reachedContainerBottom) && !isLoading.value && !cleanupInProgress) {
      try {
        if (masonry.value.length > maxItems) {
          await handleItemCleanup(columnHeights)
        }

        await loadNext()
        await nextTick()
      } catch (error) {
        console.error('Error in scroll handler:', error)
      }
    }
  }

  async function handleItemCleanup(columnHeightsBefore: number[]) {
    if (!masonry.value.length) return
    if (masonry.value.length <= pageSize) return

    const pageGroups: Record<string | number, ProcessedMasonryItem[]> = masonry.value.reduce((acc, item) => {
      const key = (item as any).page
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {} as Record<string | number, ProcessedMasonryItem[]>)

    const pages = Object.keys(pageGroups).sort((a, b) => parseInt(a) - parseInt(b))
    if (pages.length === 0) return

    let totalRemovedItems = 0
    const pagesToRemove: string[] = []

    for (const page of pages) {
      pagesToRemove.push(page)
      totalRemovedItems += pageGroups[page].length
      if (totalRemovedItems >= pageSize) break
    }

    const remainingItems = masonry.value.filter(item => !pagesToRemove.includes(String((item as any).page)))
    if (remainingItems.length === masonry.value.length) return

    cleanupInProgress = true

    setItemsRaw(remainingItems)
    await nextTick()
    await waitFor(msLeaveEstimate())

    refreshLayout(remainingItems)
    await nextTick()

    await maintainAnchorPosition()

    cleanupInProgress = false
  }

  function msLeaveEstimate() {
    const base = typeof leaveEstimateMs === 'number' && leaveEstimateMs > 0 ? leaveEstimateMs : 250
    return base + 50
  }

  function waitFor(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async function maintainAnchorPosition() {
    if (!container.value) return

    const { scrollTop, clientHeight } = container.value
    const pivotY = scrollTop + clientHeight * 0.4

    const heights = calculateColumnHeights(masonry.value, columns.value)
    const anchorColumnIndex = heights.indexOf(Math.max(...heights))

    const itemsInAnchor = masonry.value.filter((_, index) => index % columns.value === anchorColumnIndex)
    if (itemsInAnchor.length === 0) return

    let pivotItem = itemsInAnchor[0]
    for (const it of itemsInAnchor) {
      if (it.top <= pivotY && it.top >= pivotItem.top) {
        pivotItem = it
      }
    }

    const desiredTop = Math.max(0, pivotItem.top - clientHeight * 0.4)

    if (Math.abs(desiredTop - scrollTop) > 4) {
      container.value.scrollTo({ top: desiredTop, behavior: 'auto' })
    }
  }

  async function adjustScrollPosition() {
    await maintainAnchorPosition()
  }

  return {
    handleScroll
  }
}
