import { ref, nextTick, type Ref, type ComputedRef } from 'vue'
import calculateLayout from './calculateLayout'
import { getColumnCount, calculateContainerHeight } from './masonryUtils'

export interface UseMasonryLayoutOptions {
  masonry: Ref<any[]>
  useSwipeMode: ComputedRef<boolean>
  container: Ref<HTMLElement | null>
  columns: Ref<number>
  containerWidth: Ref<number>
  masonryContentHeight: Ref<number>
  layout: ComputedRef<any>
  fixedDimensions: Ref<{ width?: number; height?: number } | null>
  checkItemDimensions: (items: any[], context: string) => void
}

export function useMasonryLayout(options: UseMasonryLayoutOptions) {
  const {
    masonry,
    useSwipeMode,
    container,
    columns,
    containerWidth,
    masonryContentHeight,
    layout,
    fixedDimensions,
    checkItemDimensions
  } = options

  // Cache previous layout state for incremental updates
  let previousLayoutItems: any[] = []

  function calculateHeight(content: any[]) {
    const newHeight = calculateContainerHeight(content as any)
    let floor = 0
    if (container.value) {
      const { scrollTop, clientHeight } = container.value
      floor = scrollTop + clientHeight + 100
    }
    masonryContentHeight.value = Math.max(newHeight, floor)
  }

  function refreshLayout(items: any[]) {
    if (useSwipeMode.value) {
      // In swipe mode, no layout calculation needed - items are stacked vertically
      masonry.value = items as any
      return
    }

    // Always update masonry value, even if container isn't ready
    // This ensures items are added in tests and when container isn't available yet
    masonry.value = items as any

    if (!container.value) return
    // Developer diagnostics: warn when dimensions are invalid
    checkItemDimensions(items as any[], 'refreshLayout')

    // Optimization: For large arrays, check if we can do incremental update
    // Only works if items were removed from the end (common case)
    const canUseIncremental = items.length > 1000 &&
      previousLayoutItems.length > items.length &&
      previousLayoutItems.length - items.length < 100 // Only small removals

    if (canUseIncremental) {
      // Check if items were removed from the end (most common case)
      let removedFromEnd = true
      for (let i = 0; i < items.length; i++) {
        if (items[i]?.id !== previousLayoutItems[i]?.id) {
          removedFromEnd = false
          break
        }
      }

      if (removedFromEnd) {
        // Items removed from end - we can reuse previous positions for remaining items
        // Just update indices and recalculate height
        const itemsWithIndex = items.map((item, index) => ({
          ...previousLayoutItems[index],
          originalIndex: index
        }))

        // Recalculate height only
        calculateHeight(itemsWithIndex as any)
        masonry.value = itemsWithIndex
        previousLayoutItems = itemsWithIndex
        return
      }
    }

    // Full recalculation (fallback for all other cases)
    // Update original index to reflect current position in array
    // This ensures indices are correct after items are removed
    const itemsWithIndex = items.map((item, index) => ({
      ...item,
      originalIndex: index
    }))

    // When fixed dimensions are set, ensure container uses the fixed width for layout
    // This prevents gaps when the container's actual width differs from the fixed width
    const containerEl = container.value as HTMLElement
    if (fixedDimensions.value && fixedDimensions.value.width !== undefined) {
      // Temporarily set width to match fixed dimensions for accurate layout calculation
      const originalWidth = containerEl.style.width
      const originalBoxSizing = containerEl.style.boxSizing
      containerEl.style.boxSizing = 'border-box'
      containerEl.style.width = `${fixedDimensions.value.width}px`
      // Force reflow
      containerEl.offsetWidth

      const content = calculateLayout(itemsWithIndex as any, containerEl, columns.value, layout.value as any)

      // Restore original width
      containerEl.style.width = originalWidth
      containerEl.style.boxSizing = originalBoxSizing

      calculateHeight(content as any)
      masonry.value = content
      // Cache for next incremental update
      previousLayoutItems = content
    } else {
      const content = calculateLayout(itemsWithIndex as any, containerEl, columns.value, layout.value as any)
      calculateHeight(content as any)
      masonry.value = content
      // Cache for next incremental update
      previousLayoutItems = content
    }
  }

  function setFixedDimensions(
    dimensions: { width?: number; height?: number } | null,
    updateScrollProgress?: () => void
  ) {
    fixedDimensions.value = dimensions
    if (dimensions) {
      if (dimensions.width !== undefined) containerWidth.value = dimensions.width
      // Force layout refresh when dimensions change
      if (!useSwipeMode.value && container.value && masonry.value.length > 0) {
        // Use nextTick to ensure DOM has updated
        nextTick(() => {
          columns.value = getColumnCount(layout.value as any, containerWidth.value)
          refreshLayout(masonry.value as any)
          if (updateScrollProgress) {
            updateScrollProgress()
          }
        })
      }
    }
    // When clearing fixed dimensions, restore from wrapper
    // Note: wrapper is not available in this composable, so this needs to be handled by caller
  }

  function onResize() {
    columns.value = getColumnCount(layout.value as any, containerWidth.value)
    refreshLayout(masonry.value as any)
  }

  return {
    refreshLayout,
    setFixedDimensions,
    onResize,
    calculateHeight
  }
}

