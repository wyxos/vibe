import { ref, computed, nextTick, type Ref, type ComputedRef } from 'vue'
import { calculateColumnHeights } from './masonryUtils'

export interface UseMasonryVirtualizationOptions {
  masonry: Ref<any[]>
  container: Ref<HTMLElement | null>
  columns: Ref<number>
  virtualBufferPx: number
  loadThresholdPx: number
  handleScroll: (precomputedHeights?: number[]) => void
}

export function useMasonryVirtualization(options: UseMasonryVirtualizationOptions) {
  const {
    masonry,
    container,
    columns,
    virtualBufferPx,
    loadThresholdPx
  } = options

  // Use a ref for handleScroll so it can be updated after initialization
  const handleScrollRef = ref<(precomputedHeights?: number[]) => void>(options.handleScroll)

  // Virtualization viewport state
  const viewportTop = ref(0)
  const viewportHeight = ref(0)
  const VIRTUAL_BUFFER_PX = virtualBufferPx

  // Gate transitions during virtualization-only DOM churn
  const virtualizing = ref(false)

  // Scroll progress tracking
  const scrollProgress = ref<{ distanceToTrigger: number; isNearTrigger: boolean }>({
    distanceToTrigger: 0,
    isNearTrigger: false
  })

  // Visible window of items (virtualization)
  const visibleMasonry = computed(() => {
    const top = viewportTop.value - VIRTUAL_BUFFER_PX
    const bottom = viewportTop.value + viewportHeight.value + VIRTUAL_BUFFER_PX
    const items = masonry.value as any[]
    if (!items || items.length === 0) return [] as any[]

    // Filter items that have valid positions and are within viewport
    const visible = items.filter((it: any) => {
      // If item doesn't have position yet, include it (will be filtered once layout is calculated)
      if (typeof it.top !== 'number' || typeof it.columnHeight !== 'number') {
        return true // Include items without positions to avoid hiding them prematurely
      }
      const itemTop = it.top
      const itemBottom = it.top + it.columnHeight
      return itemBottom >= top && itemTop <= bottom
    })

    // Log if we're filtering out items (for debugging)
    if (import.meta.env.DEV && items.length > 0 && visible.length === 0 && viewportHeight.value > 0) {
      const itemsWithPositions = items.filter((it: any) =>
        typeof it.top === 'number' && typeof it.columnHeight === 'number'
      )
    }

    return visible
  })

  function updateScrollProgress(precomputedHeights?: number[]) {
    if (!container.value) return

    const { scrollTop, clientHeight } = container.value
    const visibleBottom = scrollTop + clientHeight

    const columnHeights = precomputedHeights ?? calculateColumnHeights(masonry.value as any, columns.value)
    const tallest = columnHeights.length ? Math.max(...columnHeights) : 0
    const threshold = typeof loadThresholdPx === 'number' ? loadThresholdPx : 200
    const triggerPoint = threshold >= 0
      ? Math.max(0, tallest - threshold)
      : Math.max(0, tallest + threshold)

    const distanceToTrigger = Math.max(0, triggerPoint - visibleBottom)
    const isNearTrigger = distanceToTrigger <= 100

    scrollProgress.value = {
      distanceToTrigger: Math.round(distanceToTrigger),
      isNearTrigger
    }
  }

  async function updateViewport() {
    if (container.value) {
      const scrollTop = container.value.scrollTop
      const clientHeight = container.value.clientHeight || window.innerHeight
      // Ensure viewportHeight is never 0 (fallback to window height if container height is 0)
      const safeClientHeight = clientHeight > 0 ? clientHeight : window.innerHeight
      viewportTop.value = scrollTop
      viewportHeight.value = safeClientHeight
      // Log when scroll handler runs (helpful for debugging viewport issues)
      if (import.meta.env.DEV) {
        console.log('[Masonry] scroll: viewport updated', {
          scrollTop,
          clientHeight: safeClientHeight,
          itemsCount: masonry.value.length,
          visibleItemsCount: visibleMasonry.value.length
        })
      }
    }
    // Gate transitions for virtualization-only DOM changes
    virtualizing.value = true
    await nextTick()
    await nextTick()
    virtualizing.value = false

    const heights = calculateColumnHeights(masonry.value as any, columns.value)
    handleScrollRef.value(heights as any)
    updateScrollProgress(heights)
  }

  function reset() {
    viewportTop.value = 0
    viewportHeight.value = 0
    virtualizing.value = false
    scrollProgress.value = {
      distanceToTrigger: 0,
      isNearTrigger: false
    }
  }

  return {
    viewportTop,
    viewportHeight,
    virtualizing,
    scrollProgress,
    visibleMasonry,
    updateScrollProgress,
    updateViewport,
    reset,
    handleScroll: handleScrollRef
  }
}

