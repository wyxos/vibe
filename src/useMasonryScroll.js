import { nextTick } from 'vue'
import { calculateColumnHeights } from './masonryUtils.js'

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
  loadNext
}) {
  async function handleScroll() {
    const { scrollTop, clientHeight } = container.value
    const visibleBottom = scrollTop + clientHeight

    const columnHeights = calculateColumnHeights(masonry.value, columns.value)
    // Use the longest column instead of shortest for better trigger timing
    const longestColumn = Math.max(...columnHeights)
    const whitespaceVisible = longestColumn + 300 < visibleBottom - 1
    const reachedContainerBottom = scrollTop + clientHeight >= containerHeight.value - 1

    if ((whitespaceVisible || reachedContainerBottom) && !isLoading.value) {
      try {
        // Handle cleanup when too many items
        if (masonry.value.length > maxItems) {
          await handleItemCleanup(columnHeights)
        }

        await loadNext() // loadNext manages its own loading state and error handling
        await nextTick()
      } catch (error) {
        console.error('Error in scroll handler:', error)
        // loadNext already handles its own loading state, no need to reset here
      }
    }
  }

  async function handleItemCleanup(columnHeightsBefore) {
    if (!masonry.value.length) {
      return
    }

    if (masonry.value.length <= pageSize) {
      // If we have fewer items than pageSize, no cleanup needed
      return
    }

    // Group items by page to understand page structure
    const pageGroups = masonry.value.reduce((acc, item) => {
      if (!acc[item.page]) {
        acc[item.page] = []
      }
      acc[item.page].push(item)
      return acc
    }, {})

    const pages = Object.keys(pageGroups).sort((a, b) => parseInt(a) - parseInt(b))

    if (pages.length === 0) {
      return
    }

    let totalRemovedItems = 0
    let pagesToRemove = []

    // Remove pages cumulatively until we reach at least pageSize items
    for (const page of pages) {
      pagesToRemove.push(page)
      totalRemovedItems += pageGroups[page].length

      if (totalRemovedItems >= pageSize) {
        break
      }
    }

    // Filter out items from pages to be removed
    const remainingItems = masonry.value.filter(item => !pagesToRemove.includes(item.page.toString()))

    if (remainingItems.length === masonry.value.length) {
      // No items were removed, nothing to do
      return
    }

    refreshLayout(remainingItems)

    await nextTick()

    // After layout updates, maintain viewport anchor near the longest column
    await maintainAnchorPosition()
  }

  async function maintainAnchorPosition() {
    if (!container.value) return

    const { scrollTop, clientHeight } = container.value
    const pivotY = scrollTop + clientHeight * 0.4 // aim to keep ~40% down the viewport stable

    // Recompute column heights with the new layout
    const heights = calculateColumnHeights(masonry.value, columns.value)
    const anchorColumnIndex = heights.indexOf(Math.max(...heights))

    // Find items belonging to the anchor column
    const itemsInAnchor = masonry.value.filter((_, index) => index % columns.value === anchorColumnIndex)
    if (itemsInAnchor.length === 0) return

    // Choose the item whose top is the largest <= pivotY (closest above pivot)
    let pivotItem = itemsInAnchor[0]
    for (const it of itemsInAnchor) {
      if (it.top <= pivotY && it.top >= pivotItem.top) {
        pivotItem = it
      }
    }

    const desiredTop = Math.max(0, pivotItem.top - clientHeight * 0.4)

    // Only adjust if we drifted significantly (> 4px) to avoid tiny corrections
    if (Math.abs(desiredTop - scrollTop) > 4) {
      container.value.scrollTo({ top: desiredTop, behavior: 'auto' })
    }
  }

  // Legacy function kept for compatibility; prefer maintainAnchorPosition()
  async function adjustScrollPosition() {
    await maintainAnchorPosition()
  }

  return {
    handleScroll
  }
}
