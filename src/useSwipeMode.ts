import { computed, ref, type Ref, type ComputedRef } from 'vue'

export interface UseSwipeModeOptions {
  useSwipeMode: ComputedRef<boolean>
  masonry: Ref<any[]>
  isLoading: Ref<boolean>
  loadNext: () => Promise<any>
  loadPage: (page: any) => Promise<any>
  paginationHistory: Ref<any[]>
}

export interface UseSwipeModeReturn {
  // State
  currentSwipeIndex: Ref<number>
  swipeOffset: Ref<number>
  isDragging: Ref<boolean>
  swipeContainer: Ref<HTMLElement | null>
  
  // Computed
  currentItem: ComputedRef<any | null>
  nextItem: ComputedRef<any | null>
  previousItem: ComputedRef<any | null>
  
  // Functions
  handleTouchStart: (e: TouchEvent) => void
  handleTouchMove: (e: TouchEvent) => void
  handleTouchEnd: (e: TouchEvent) => void
  handleMouseDown: (e: MouseEvent) => void
  handleMouseMove: (e: MouseEvent) => void
  handleMouseUp: (e: MouseEvent) => void
  goToNextItem: () => void
  goToPreviousItem: () => void
  snapToCurrentItem: () => void
  handleWindowResize: () => void
  reset: () => void
}

export function useSwipeMode(options: UseSwipeModeOptions): UseSwipeModeReturn {
  const { useSwipeMode, masonry, isLoading, loadNext, loadPage, paginationHistory } = options

  // Swipe mode state
  const currentSwipeIndex = ref<number>(0)
  const swipeOffset = ref<number>(0)
  const isDragging = ref<boolean>(false)
  const dragStartY = ref<number>(0)
  const dragStartOffset = ref<number>(0)
  const swipeContainer = ref<HTMLElement | null>(null)

  // Get current item index for swipe mode
  const currentItem = computed(() => {
    if (!useSwipeMode.value || masonry.value.length === 0) return null
    const index = Math.max(0, Math.min(currentSwipeIndex.value, masonry.value.length - 1))
    return masonry.value[index] || null
  })

  // Get next/previous items for preloading in swipe mode
  const nextItem = computed(() => {
    if (!useSwipeMode.value || !currentItem.value) return null
    const nextIndex = currentSwipeIndex.value + 1
    if (nextIndex >= masonry.value.length) return null
    return masonry.value[nextIndex] || null
  })

  const previousItem = computed(() => {
    if (!useSwipeMode.value || !currentItem.value) return null
    const prevIndex = currentSwipeIndex.value - 1
    if (prevIndex < 0) return null
    return masonry.value[prevIndex] || null
  })

  function snapToCurrentItem() {
    if (!swipeContainer.value) return

    // Use container height for swipe mode instead of window height
    const viewportHeight = swipeContainer.value.clientHeight
    swipeOffset.value = -currentSwipeIndex.value * viewportHeight
  }

  function goToNextItem() {
    if (!nextItem.value) {
      // Try to load next page
      loadNext()
      return
    }

    currentSwipeIndex.value++
    snapToCurrentItem()

    // Preload next item if we're near the end
    if (currentSwipeIndex.value >= masonry.value.length - 5) {
      loadNext()
    }
  }

  function goToPreviousItem() {
    if (!previousItem.value) return

    currentSwipeIndex.value--
    snapToCurrentItem()
  }

  // Swipe gesture handlers
  function handleTouchStart(e: TouchEvent) {
    if (!useSwipeMode.value) return
    isDragging.value = true
    dragStartY.value = e.touches[0].clientY
    dragStartOffset.value = swipeOffset.value
    e.preventDefault()
  }

  function handleTouchMove(e: TouchEvent) {
    if (!useSwipeMode.value || !isDragging.value) return
    const deltaY = e.touches[0].clientY - dragStartY.value
    swipeOffset.value = dragStartOffset.value + deltaY
    e.preventDefault()
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!useSwipeMode.value || !isDragging.value) return
    isDragging.value = false

    const deltaY = swipeOffset.value - dragStartOffset.value
    const threshold = 100 // Minimum swipe distance to trigger navigation

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && previousItem.value) {
        // Swipe down - go to previous
        goToPreviousItem()
      } else if (deltaY < 0 && nextItem.value) {
        // Swipe up - go to next
        goToNextItem()
      } else {
        // Snap back
        snapToCurrentItem()
      }
    } else {
      // Snap back if swipe wasn't far enough
      snapToCurrentItem()
    }

    e.preventDefault()
  }

  // Mouse drag handlers for desktop testing
  function handleMouseDown(e: MouseEvent) {
    if (!useSwipeMode.value) return
    isDragging.value = true
    dragStartY.value = e.clientY
    dragStartOffset.value = swipeOffset.value
    e.preventDefault()
  }

  function handleMouseMove(e: MouseEvent) {
    if (!useSwipeMode.value || !isDragging.value) return
    const deltaY = e.clientY - dragStartY.value
    swipeOffset.value = dragStartOffset.value + deltaY
    e.preventDefault()
  }

  function handleMouseUp(e: MouseEvent) {
    if (!useSwipeMode.value || !isDragging.value) return
    isDragging.value = false

    const deltaY = swipeOffset.value - dragStartOffset.value
    const threshold = 100

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && previousItem.value) {
        goToPreviousItem()
      } else if (deltaY < 0 && nextItem.value) {
        goToNextItem()
      } else {
        snapToCurrentItem()
      }
    } else {
      snapToCurrentItem()
    }

    e.preventDefault()
  }

  // Watch for container/window resize to update swipe mode
  function handleWindowResize() {
    // If switching from swipe to masonry, reset swipe state
    if (!useSwipeMode.value && currentSwipeIndex.value > 0) {
      currentSwipeIndex.value = 0
      swipeOffset.value = 0
    }

    // If switching to swipe mode, ensure we have items loaded
    if (useSwipeMode.value && masonry.value.length === 0 && !isLoading.value) {
      loadPage(paginationHistory.value[0] as any)
    }

    // Re-snap to current item on resize to adjust offset
    if (useSwipeMode.value) {
      snapToCurrentItem()
    }
  }

  function reset() {
    currentSwipeIndex.value = 0
    swipeOffset.value = 0
    isDragging.value = false
  }

  return {
    // State
    currentSwipeIndex,
    swipeOffset,
    isDragging,
    swipeContainer,
    
    // Computed
    currentItem,
    nextItem,
    previousItem,
    
    // Functions
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    goToNextItem,
    goToPreviousItem,
    snapToCurrentItem,
    handleWindowResize,
    reset
  }
}

