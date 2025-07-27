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

        await loadNext() // loadNext manages its own loading state
        await nextTick()
      } catch (error) {
        console.error('Error in scroll handler:', error)
      }
    }
  }

  async function handleItemCleanup(columnHeights) {
    const firstItem = masonry.value[0]
    
    if (!firstItem) {
      // Don't set isLoading here - let main handleScroll manage it
      return
    }

    const page = firstItem.page
    const removedItems = masonry.value.filter(i => i.page !== page)
    
    if (removedItems.length === masonry.value.length) {
      // Don't set isLoading here - let main handleScroll manage it  
      return
    }

    refreshLayout(removedItems)
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
