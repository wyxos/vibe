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
  setItemsRaw,
  loadNext,
  // Optional: provide an estimate for how long leave animations take
  leaveEstimateMs
}) {
  let cleanupInProgress = false

  async function handleScroll() {
    const { scrollTop, clientHeight } = container.value
    const visibleBottom = scrollTop + clientHeight

    const columnHeights = calculateColumnHeights(masonry.value, columns.value)
    // Use the longest column instead of shortest for better trigger timing
    const longestColumn = Math.max(...columnHeights)
    const whitespaceVisible = longestColumn + 300 < visibleBottom - 1
    const reachedContainerBottom = scrollTop + clientHeight >= containerHeight.value - 1

    if ((whitespaceVisible || reachedContainerBottom) && !isLoading.value && !cleanupInProgress) {
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

    // Phase 1: remove items (trigger leave) WITHOUT moving remaining items
    const remainingItems = masonry.value.filter(item => !pagesToRemove.includes(item.page.toString()))

    if (remainingItems.length === masonry.value.length) {
      // No items were removed, nothing to do
      return
    }

    cleanupInProgress = true

    // Set raw items so TransitionGroup triggers leave on removed items, but remaining items keep their current transforms
    setItemsRaw(remainingItems)

    await nextTick()
    // Wait for leave transitions to complete; use a conservative timeout
    await waitFor(msLeaveEstimate())

    // Phase 2: now recompute layout and animate moves for remaining items
    refreshLayout(remainingItems)
    await nextTick()

    // Maintain anchor after moves are applied
    await maintainAnchorPosition()

    cleanupInProgress = false
  }

  function msLeaveEstimate() {
    // Estimate based on provided duration (with a small buffer)
    const base = typeof leaveEstimateMs === 'number' && leaveEstimateMs > 0 ? leaveEstimateMs : 250
    return base + 50
  }

  function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
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
