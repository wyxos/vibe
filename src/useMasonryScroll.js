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
    const whitespaceVisible = columnHeights.some(height => height + 300 < visibleBottom - 1)
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

  async function handleItemCleanup(columnHeights) {
    if (!masonry.value.length) {
      return
    }

    if(masonry.value.length <= pageSize) {
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

    await adjustScrollPosition(columnHeights)
  }

  async function adjustScrollPosition(columnHeights) {
    const lowestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
    const lastItemInColumn = masonry.value.filter((_, index) => index % columns.value === lowestColumnIndex).pop()

    if (lastItemInColumn) {
      const lastItemInColumnTop = lastItemInColumn.top + lastItemInColumn.columnHeight
      const lastItemInColumnBottom = lastItemInColumnTop + lastItemInColumn.columnHeight
      const containerTop = container.value.scrollTop
      const containerBottom = containerTop + container.value.clientHeight
      const itemInView = lastItemInColumnTop >= containerTop && lastItemInColumnBottom <= containerBottom

      if (!itemInView) {
        container.value.scrollTo({
          top: lastItemInColumnTop - 10,
          behavior: 'smooth'
        })
      }
    }
  }

  return {
    handleScroll
  }
}
