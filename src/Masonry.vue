<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import calculateLayout from "./calculateLayout";
import { debounce } from 'lodash-es'
import {
  getColumnCount,
  getBreakpointName,
  calculateContainerHeight,
  getItemAttributes,
  calculateColumnHeights
} from './masonryUtils'
import { useMasonryTransitions } from './useMasonryTransitions'
import { useMasonryScroll } from './useMasonryScroll'
import { useSwipeMode as useSwipeModeComposable } from './useSwipeMode'
import { useMasonryPagination } from './useMasonryPagination'
import { useMasonryItems } from './useMasonryItems'
import { useMasonryLayout } from './useMasonryLayout'
import { useMasonryVirtualization } from './useMasonryVirtualization'
import { useMasonryDimensions } from './useMasonryDimensions'
import MasonryItem from './components/MasonryItem.vue'
import { normalizeError } from './utils/errorHandler'

const props = defineProps({
  getNextPage: {
    type: Function,
    default: () => { }
  },
  loadAtPage: {
    type: [Number, String],
    default: null
  },
  items: {
    type: Array,
    default: () => []
  },
  layout: {
    type: Object
  },
  paginationType: {
    type: String,
    default: 'page', // or 'cursor'
    validator: (v: string) => ['page', 'cursor'].includes(v)
  },
  init: {
    type: String,
    default: 'manual',
    validator: (v: string) => ['auto', 'manual'].includes(v)
  },
  // Initial pagination state when init is 'auto' and items are provided
  initialPage: {
    type: [Number, String],
    default: null
  },
  initialNextPage: {
    type: [Number, String],
    default: null
  },
  pageSize: {
    type: Number,
    default: 40
  },
  // Backfill configuration
  mode: {
    type: String,
    default: 'backfill',
    validator: (value: string) => ['backfill', 'none', 'refresh'].includes(value)
  },
  backfillDelayMs: {
    type: Number,
    default: 2000
  },
  backfillMaxCalls: {
    type: Number,
    default: 10
  },
  // Retry configuration
  retryMaxAttempts: {
    type: Number,
    default: 3
  },
  retryInitialDelayMs: {
    type: Number,
    default: 2000
  },
  retryBackoffStepMs: {
    type: Number,
    default: 2000
  },
  transitionDurationMs: {
    type: Number,
    default: 450
  },
  // Shorter, snappier duration specifically for item removal (leave)
  leaveDurationMs: {
    type: Number,
    default: 160
  },
  transitionEasing: {
    type: String,
    default: 'cubic-bezier(.22,.61,.36,1)'
  },
  // Force motion even when user has reduced-motion enabled
  forceMotion: {
    type: Boolean,
    default: false
  },
  virtualBufferPx: {
    type: Number,
    default: 600
  },
  loadThresholdPx: {
    type: Number,
    default: 200
  },
  autoRefreshOnEmpty: {
    type: Boolean,
    default: false
  },
  // Layout mode: 'auto' (detect from screen size), 'masonry', or 'swipe'
  layoutMode: {
    type: String,
    default: 'auto',
    validator: (v: string) => ['auto', 'masonry', 'swipe'].includes(v)
  },
  // Breakpoint for switching to swipe mode (in pixels or Tailwind breakpoint name)
  mobileBreakpoint: {
    type: [Number, String],
    default: 768 // 'md' breakpoint
  },
})

const defaultLayout = {
  sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gutterX: 10,
  gutterY: 10,
  header: 0,
  footer: 0,
  paddingLeft: 0,
  paddingRight: 0,
  placement: 'masonry'
}

const layout = computed(() => ({
  ...defaultLayout,
  ...props.layout,
  sizes: {
    ...defaultLayout.sizes,
    ...(props.layout?.sizes || {})
  }
}))

const wrapper = ref<HTMLElement | null>(null)
const containerWidth = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1024)
const containerHeight = ref<number>(typeof window !== 'undefined' ? window.innerHeight : 768)
const fixedDimensions = ref<{ width?: number; height?: number } | null>(null)
let resizeObserver: ResizeObserver | null = null

// Get breakpoint value from Tailwind breakpoint name
function getBreakpointValue(breakpoint: string): number {
  const breakpoints: Record<string, number> = {
    'sm': 640,
    'md': 768,
    'lg': 1024,
    'xl': 1280,
    '2xl': 1536
  }
  return breakpoints[breakpoint] || 768
}

// Determine if we should use swipe mode
const useSwipeMode = computed(() => {
  if (props.layoutMode === 'masonry') return false
  if (props.layoutMode === 'swipe') return true

  // Auto mode: check container width
  const breakpoint = typeof props.mobileBreakpoint === 'string'
    ? getBreakpointValue(props.mobileBreakpoint)
    : props.mobileBreakpoint

  return containerWidth.value < breakpoint
})


const emits = defineEmits([
  'update:items',
  'backfill:start',
  'backfill:tick',
  'backfill:stop',
  'retry:start',
  'retry:tick',
  'retry:stop',
  'loading:stop',
  'remove-all:complete',
  // Re-emit item-level preload events from the default MasonryItem
  'item:preload:success',
  'item:preload:error',
  // Mouse events from MasonryItem content
  'item:mouse-enter',
  'item:mouse-leave'
])

const masonry = computed<any>({
  get: () => props.items,
  set: (val) => emits('update:items', val)
})

const columns = ref<number>(7)
const container = ref<HTMLElement | null>(null)
const paginationHistory = ref<any[]>([])
const currentPage = ref<any>(null)  // Track the actual current page being displayed
const isLoading = ref<boolean>(false)
const masonryContentHeight = ref<number>(0)
const hasReachedEnd = ref<boolean>(false)  // Track when we've reached the last page
const loadError = ref<Error | null>(null)  // Track load errors
// Track when first content has loaded
// For 'manual' init, show masonry immediately since we're about to load
// For 'auto' init, wait for items to be provided or loaded
const isInitialized = ref<boolean>(false)

// Current breakpoint
const currentBreakpoint = computed(() => getBreakpointName(containerWidth.value))


// Initialize dimensions composable first (needed by layout composable)
const dimensions = useMasonryDimensions({
  masonry: masonry as any
})

// Extract dimension checking function
const { checkItemDimensions, invalidDimensionIds, reset: resetDimensions } = dimensions

// Initialize layout composable (needs checkItemDimensions from dimensions composable)
const layoutComposable = useMasonryLayout({
  masonry: masonry as any,
  useSwipeMode,
  container,
  columns,
  containerWidth,
  masonryContentHeight,
  layout,
  fixedDimensions,
  checkItemDimensions
})

// Extract layout functions
const { refreshLayout, setFixedDimensions: setFixedDimensionsLayout, onResize: onResizeLayout } = layoutComposable

// Initialize virtualization composable
const virtualization = useMasonryVirtualization({
  masonry: masonry as any,
  container,
  columns,
  virtualBufferPx: props.virtualBufferPx,
  loadThresholdPx: props.loadThresholdPx,
  handleScroll: () => { } // Will be set after pagination is initialized
})

// Extract virtualization state and functions
const { viewportTop, viewportHeight, virtualizing, scrollProgress, visibleMasonry, updateScrollProgress, updateViewport: updateViewportVirtualization, reset: resetVirtualization } = virtualization

// Initialize transitions composable with virtualization support
const { onEnter, onBeforeEnter, onBeforeLeave, onLeave } = useMasonryTransitions(
  { container, masonry: masonry as any },
  { leaveDurationMs: props.leaveDurationMs, virtualizing }
)

// Transition functions for template (wrapped to match expected signature)
const enter = onEnter
const beforeEnter = onBeforeEnter
const beforeLeave = onBeforeLeave
const leave = onLeave

// Initialize pagination composable
const pagination = useMasonryPagination({
  getNextPage: props.getNextPage as (page: any) => Promise<{ items: any[]; nextPage: any }>,
  masonry: masonry as any,
  isLoading,
  hasReachedEnd,
  loadError,
  currentPage,
  paginationHistory,
  refreshLayout,
  retryMaxAttempts: props.retryMaxAttempts,
  retryInitialDelayMs: props.retryInitialDelayMs,
  retryBackoffStepMs: props.retryBackoffStepMs,
  mode: props.mode,
  backfillDelayMs: props.backfillDelayMs,
  backfillMaxCalls: props.backfillMaxCalls,
  pageSize: props.pageSize,
  autoRefreshOnEmpty: props.autoRefreshOnEmpty,
  emits
})

// Extract pagination functions
const { loadPage, loadNext, refreshCurrentPage, cancelLoad, maybeBackfillToTarget } = pagination

// Initialize swipe mode composable (needs loadNext and loadPage from pagination)
const swipeMode = useSwipeModeComposable({
  useSwipeMode,
  masonry: masonry as any,
  isLoading,
  loadNext,
  loadPage,
  paginationHistory
})

// Initialize scroll handler (needs loadNext from pagination)
const { handleScroll } = useMasonryScroll({
  container,
  masonry: masonry as any,
  columns,
  containerHeight: masonryContentHeight,
  isLoading,
  pageSize: props.pageSize,
  refreshLayout,
  setItemsRaw: (items: any[]) => {
    masonry.value = items
  },
  loadNext,
  loadThresholdPx: props.loadThresholdPx
})

// Update virtualization handleScroll to use the scroll handler
virtualization.handleScroll.value = handleScroll

// Initialize items composable
const items = useMasonryItems({
  masonry: masonry as any,
  useSwipeMode,
  refreshLayout,
  refreshCurrentPage,
  loadNext,
  maybeBackfillToTarget,
  autoRefreshOnEmpty: props.autoRefreshOnEmpty,
  paginationHistory
})

// Extract item management functions
const { remove, removeMany, restore, restoreMany, removeAll: removeAllItems } = items

// setFixedDimensions is now in useMasonryLayout composable
// Wrapper function to maintain API compatibility and handle wrapper restoration
function setFixedDimensions(dimensions: { width?: number; height?: number } | null) {
  setFixedDimensionsLayout(dimensions, updateScrollProgress)
  if (!dimensions && wrapper.value) {
    // When clearing fixed dimensions, restore from wrapper
    containerWidth.value = wrapper.value.clientWidth
    containerHeight.value = wrapper.value.clientHeight
  }
}

defineExpose({
  isLoading,
  refreshLayout,
  // Container dimensions (wrapper element)
  containerWidth,
  containerHeight,
  // Masonry content height (for backward compatibility, old containerHeight)
  contentHeight: masonryContentHeight,
  // Current page
  currentPage,
  // End of list tracking
  hasReachedEnd,
  // Load error tracking
  loadError,
  // Initialization state
  isInitialized,
  // Set fixed dimensions (overrides ResizeObserver)
  setFixedDimensions,
  remove,
  removeMany,
  removeAll: removeAllItems,
  restore,
  restoreMany,
  loadNext,
  loadPage,
  refreshCurrentPage,
  reset,
  destroy,
  init,
  restoreItems,
  paginationHistory,
  cancelLoad,
  scrollToTop,
  scrollTo,
  totalItems: computed(() => (masonry.value as any[]).length),
  currentBreakpoint
})

// Layout functions are now in useMasonryLayout composable
// Removed: calculateHeight, refreshLayout - now from layoutComposable

// Expose swipe mode computed values and state for template
const currentItem = swipeMode.currentItem
const nextItem = swipeMode.nextItem
const previousItem = swipeMode.previousItem
const currentSwipeIndex = swipeMode.currentSwipeIndex
const swipeOffset = swipeMode.swipeOffset
const isDragging = swipeMode.isDragging
const swipeContainer = swipeMode.swipeContainer

// Swipe gesture handlers (delegated to composable)
const handleTouchStart = swipeMode.handleTouchStart
const handleTouchMove = swipeMode.handleTouchMove
const handleTouchEnd = swipeMode.handleTouchEnd
const handleMouseDown = swipeMode.handleMouseDown
const handleMouseMove = swipeMode.handleMouseMove
const handleMouseUp = swipeMode.handleMouseUp
const goToNextItem = swipeMode.goToNextItem
const goToPreviousItem = swipeMode.goToPreviousItem
const snapToCurrentItem = swipeMode.snapToCurrentItem

// refreshCurrentPage is now in useMasonryPagination composable

// Item management functions (remove, removeMany, restore, restoreMany, removeAll) are now in useMasonryItems composable

function scrollToTop(options?: ScrollToOptions) {
  if (container.value) {
    container.value.scrollTo({
      top: 0,
      behavior: options?.behavior ?? 'smooth',
      ...options
    })
  }
}

function scrollTo(options: { top?: number; left?: number; behavior?: ScrollBehavior }) {
  if (container.value) {
    container.value.scrollTo({
      top: options.top ?? container.value.scrollTop,
      left: options.left ?? container.value.scrollLeft,
      behavior: options.behavior ?? 'auto',
    })
    // Update viewport state immediately after scrolling
    if (container.value) {
      viewportTop.value = container.value.scrollTop
      viewportHeight.value = container.value.clientHeight || window.innerHeight
    }
  }
}

// removeAll is now in useMasonryItems composable (removeAllItems)

// onResize is now in useMasonryLayout composable (onResizeLayout)
function onResize() {
  onResizeLayout()
  if (container.value) {
    viewportTop.value = container.value.scrollTop
    viewportHeight.value = container.value.clientHeight
  }
}

// maybeBackfillToTarget, cancelLoad are now in useMasonryPagination composable
// Removed: backfillActive, cancelRequested - now internal to pagination composable

function reset() {
  // Cancel ongoing work
  cancelLoad()

  if (container.value) {
    container.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  masonry.value = []
  containerHeight.value = 0
  currentPage.value = props.loadAtPage  // Reset current page tracking
  paginationHistory.value = [props.loadAtPage]
  hasReachedEnd.value = false  // Reset end flag
  loadError.value = null  // Reset error flag
  isInitialized.value = false  // Reset initialization flag

  // Reset virtualization state
  resetVirtualization()

  // Reset auto-initialization flag so watcher can work again if needed
  hasInitializedWithItems = false
}

function destroy() {
  // Cancel any ongoing loads
  cancelLoad()

  // Reset all state
  masonry.value = []
  masonryContentHeight.value = 0
  currentPage.value = null
  paginationHistory.value = []
  hasReachedEnd.value = false
  loadError.value = null
  isLoading.value = false
  isInitialized.value = false

  // Reset swipe mode state
  currentSwipeIndex.value = 0
  swipeOffset.value = 0
  isDragging.value = false

  // Reset virtualization state
  resetVirtualization()

  // Reset invalid dimension tracking
  resetDimensions()

  // Scroll to top if container exists
  if (container.value) {
    container.value.scrollTo({
      top: 0,
      behavior: 'auto' // Instant scroll for destroy
    })
  }
}

// Scroll handler is now handled by virtualization composable's updateViewport
const debouncedScrollHandler = debounce(async () => {
  if (useSwipeMode.value) return // Skip scroll handling in swipe mode
  await updateViewportVirtualization()
}, 200)

const debouncedResizeHandler = debounce(onResize, 200)

// Window resize handler (combines swipe and general resize logic)
function handleWindowResize() {
  // Delegate swipe-specific resize handling
  swipeMode.handleWindowResize()

  // General resize handling (if needed)
  // Note: containerWidth is updated by ResizeObserver
}

function init(items: any[], page: any, next: any) {
  currentPage.value = page  // Track the initial current page
  paginationHistory.value = [page]
  paginationHistory.value.push(next)
  // Update hasReachedEnd if next is null
  hasReachedEnd.value = next == null
  // Diagnostics: check incoming initial items
  checkItemDimensions(items as any[], 'init')

  if (useSwipeMode.value) {
    // In swipe mode, just add items without layout calculation
    masonry.value = [...(masonry.value as any[]), ...items]
    // Reset swipe index if we're at the start
    if (currentSwipeIndex.value === 0 && masonry.value.length > 0) {
      swipeOffset.value = 0
    }
  } else {
    refreshLayout([...(masonry.value as any[]), ...items])

    // Update viewport state from container's scroll position
    // Critical after refresh when browser may restore scroll position
    if (container.value) {
      viewportTop.value = container.value.scrollTop
      viewportHeight.value = container.value.clientHeight || window.innerHeight
    }

    // Update again after DOM updates to catch browser scroll restoration
    // The debounced scroll handler will also catch any scroll changes
    nextTick(() => {
      if (container.value) {
        viewportTop.value = container.value.scrollTop
        viewportHeight.value = container.value.clientHeight || window.innerHeight
        updateScrollProgress()
      }
    })
  }
}

/**
 * Restore items when init is 'auto'.
 * This method should be called instead of directly assigning to v-model:items
 * when restoring items from saved state.
 * @param items - Items to restore
 * @param page - Current page number/cursor
 * @param next - Next page cursor (or null if at end)
 */
async function restoreItems(items: any[], page: any, next: any) {
  // If init is 'manual', fall back to init behavior
  if (props.init === 'manual') {
    init(items, page, next)
    // Mark as initialized when items are restored
    if (items && items.length > 0) {
      isInitialized.value = true
    }
    return
  }

  // When init is 'auto', we need to restore items without triggering initial load
  currentPage.value = page
  paginationHistory.value = [page]
  if (next !== null && next !== undefined) {
    paginationHistory.value.push(next)
  }
  // Only set hasReachedEnd to true if next is explicitly null (end of list)
  // undefined means "unknown" - don't assume end of list
  hasReachedEnd.value = next === null
  loadError.value = null

  // Diagnostics: check incoming items
  checkItemDimensions(items as any[], 'restoreItems')

  // Set items directly (v-model will sync) and refresh layout
  // Follow the same pattern as init() and getContent()
  if (useSwipeMode.value) {
    // In swipe mode, just set items without layout calculation
    masonry.value = items
    // Reset swipe index if we're at the start
    if (currentSwipeIndex.value === 0 && masonry.value.length > 0) {
      swipeOffset.value = 0
    }
  } else {
    // In masonry mode, refresh layout with the restored items
    refreshLayout(items)

    // Update viewport state from container's scroll position
    if (container.value) {
      viewportTop.value = container.value.scrollTop
      viewportHeight.value = container.value.clientHeight || window.innerHeight
    }

    // Update again after DOM updates to catch browser scroll restoration
    await nextTick()
    if (container.value) {
      viewportTop.value = container.value.scrollTop
      viewportHeight.value = container.value.clientHeight || window.innerHeight
      updateScrollProgress()

      // Check if user is already at the bottom after restoration
      // If so, trigger loading to restore scroll-to-bottom functionality
      // Wait for layout to be fully calculated before checking
      await nextTick()
      const columnHeights = calculateColumnHeights(masonry.value as any, columns.value)
      const tallest = columnHeights.length ? Math.max(...columnHeights) : 0
      const scrollerBottom = container.value.scrollTop + container.value.clientHeight
      const threshold = typeof props.loadThresholdPx === 'number' ? props.loadThresholdPx : 200
      const triggerPoint = threshold >= 0
        ? Math.max(0, tallest - threshold)
        : Math.max(0, tallest + threshold)
      const nearBottom = scrollerBottom >= triggerPoint

      // If user is at bottom and there's a next page, trigger loading
      // This restores scroll-to-bottom functionality after tab restoration
      if (nearBottom && !hasReachedEnd.value && !isLoading.value && paginationHistory.value.length > 0) {
        const nextPage = paginationHistory.value[paginationHistory.value.length - 1]
        if (nextPage != null) {
          // Use handleScroll with forceCheck=true to bypass isScrollingDown check
          await handleScroll(columnHeights, true)
        }
      }
    }
  }

  // Mark as initialized when items are restored
  if (items && items.length > 0) {
    isInitialized.value = true
  }
}

// Watch for layout changes and update columns + refresh layout dynamically
watch(
  layout,
  () => {
    if (useSwipeMode.value) {
      // In swipe mode, no layout recalculation needed
      return
    }
    if (container.value) {
      columns.value = getColumnCount(layout.value as any, containerWidth.value)
      refreshLayout(masonry.value as any)
    }
  },
  { deep: true }
)

// Watch for layout-mode prop changes to ensure proper mode switching
watch(() => props.layoutMode, () => {
  // Force update containerWidth when layout-mode changes to ensure useSwipeMode computes correctly
  if (fixedDimensions.value && fixedDimensions.value.width !== undefined) {
    containerWidth.value = fixedDimensions.value.width
  } else if (wrapper.value) {
    containerWidth.value = wrapper.value.clientWidth
  }
})

// Watch container element to attach scroll listener when available
watch(container, (el) => {
  if (el && !useSwipeMode.value) {
    // Attach scroll listener for masonry mode
    el.removeEventListener('scroll', debouncedScrollHandler) // Just in case
    el.addEventListener('scroll', debouncedScrollHandler, { passive: true })
  } else if (el) {
    // Remove scroll listener if switching to swipe mode
    el.removeEventListener('scroll', debouncedScrollHandler)
  }
}, { immediate: true })

// Watch for items when init is 'auto' to auto-initialize pagination state
// This handles cases where items are provided after mount or updated externally
let hasInitializedWithItems = false
watch(
  () => [props.items, props.init, props.initialPage, props.initialNextPage] as const,
  ([items, init, initialPage, initialNextPage]) => {
    // Only auto-initialize if:
    // 1. init is 'auto'
    // 2. Items exist
    // 3. We haven't already initialized with items (to avoid re-initializing on every update)
    if (
      init === 'auto' &&
      items &&
      items.length > 0 &&
      !hasInitializedWithItems
    ) {
      hasInitializedWithItems = true
      const page = initialPage !== null && initialPage !== undefined
        ? initialPage
        : (props.loadAtPage as any)
      const next = initialNextPage !== undefined
        ? initialNextPage
        : undefined // undefined means "unknown", null means "end of list"

      restoreItems(items as any[], page, next)
      // isInitialized is set inside restoreItems
    }
  },
  { immediate: true }
)

// Watch for when items are first loaded (for init='auto' when items are loaded later via loadPage/loadNext)
watch(
  () => masonry.value.length,
  (newLength, oldLength) => {
    // If init is 'auto' and we haven't initialized yet, mark as initialized when items appear
    // This handles the case where items are loaded via loadPage/loadNext after mount
    if (props.init === 'auto' && !isInitialized.value && newLength > 0 && oldLength === 0) {
      isInitialized.value = true
    }
    // Also handle the case where init is 'manual' and items are loaded
    if (props.init === 'manual' && !isInitialized.value && newLength > 0 && oldLength === 0) {
      isInitialized.value = true
    }
  },
  { immediate: false }
)

// Watch for swipe mode changes to refresh layout and setup/teardown handlers
watch(useSwipeMode, (newValue, oldValue) => {
  // Skip if this is the initial watch call and values are the same
  if (oldValue === undefined && newValue === false) return

  nextTick(() => {
    if (newValue) {
      // Switching to Swipe Mode
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      // Remove scroll listener
      if (container.value) {
        container.value.removeEventListener('scroll', debouncedScrollHandler)
      }

      // Reset index if needed
      currentSwipeIndex.value = 0
      swipeOffset.value = 0
      if (masonry.value.length > 0) {
        snapToCurrentItem()
      }
    } else {
      // Switching to Masonry Mode
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      if (container.value && wrapper.value) {
        // Ensure containerWidth is up to date - use fixed dimensions if set
        if (fixedDimensions.value && fixedDimensions.value.width !== undefined) {
          containerWidth.value = fixedDimensions.value.width
        } else {
          containerWidth.value = wrapper.value.clientWidth
        }

        // Attach scroll listener (container watcher will handle this, but ensure it's attached)
        container.value.removeEventListener('scroll', debouncedScrollHandler) // Just in case
        container.value.addEventListener('scroll', debouncedScrollHandler, { passive: true })

        // Refresh layout with updated width
        if (masonry.value.length > 0) {
          columns.value = getColumnCount(layout.value as any, containerWidth.value)
          refreshLayout(masonry.value as any)

          // Update viewport state
          viewportTop.value = container.value.scrollTop
          viewportHeight.value = container.value.clientHeight
          updateScrollProgress()
        }
      }
    }
  })
}, { immediate: true })

// Watch for swipe container element to attach touch listeners
watch(swipeContainer, (el) => {
  if (el) {
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    el.addEventListener('mousedown', handleMouseDown)
  }
})

// Watch for items changes in swipe mode to reset index if needed
watch(() => masonry.value.length, (newLength, oldLength) => {
  if (useSwipeMode.value && newLength > 0 && oldLength === 0) {
    // First items loaded, ensure we're at index 0
    currentSwipeIndex.value = 0
    nextTick(() => snapToCurrentItem())
  }
})

// Watch wrapper element to setup ResizeObserver for container width
watch(wrapper, (el) => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  if (el && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      // Skip updates if fixed dimensions are set
      if (fixedDimensions.value) return

      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        const newHeight = entry.contentRect.height
        if (containerWidth.value !== newWidth) {
          containerWidth.value = newWidth
        }
        if (containerHeight.value !== newHeight) {
          containerHeight.value = newHeight
        }
      }
    })
    resizeObserver.observe(el)
    // Initial dimensions (only if not fixed)
    if (!fixedDimensions.value) {
      containerWidth.value = el.clientWidth
      containerHeight.value = el.clientHeight
    }
  } else if (el) {
    // Fallback if ResizeObserver not available
    if (!fixedDimensions.value) {
      containerWidth.value = el.clientWidth
      containerHeight.value = el.clientHeight
    }
  }
}, { immediate: true })

// Watch containerWidth changes to refresh layout in masonry mode
watch(containerWidth, (newWidth, oldWidth) => {
  if (newWidth !== oldWidth && newWidth > 0 && !useSwipeMode.value && container.value && masonry.value.length > 0) {
    // Use nextTick to ensure DOM has updated
    nextTick(() => {
      columns.value = getColumnCount(layout.value as any, newWidth)
      refreshLayout(masonry.value as any)
      updateScrollProgress()
    })
  }
})

onMounted(async () => {
  try {
    // For 'manual' init, show masonry immediately since we're about to load
    if (props.init === 'manual') {
      isInitialized.value = true
    }

    // Wait for next tick to ensure wrapper is mounted
    await nextTick()

    // Container dimensions are managed by ResizeObserver
    // Only set initial values if ResizeObserver isn't available
    if (wrapper.value && !resizeObserver) {
      containerWidth.value = wrapper.value.clientWidth
      containerHeight.value = wrapper.value.clientHeight
    }

    if (!useSwipeMode.value) {
      columns.value = getColumnCount(layout.value as any, containerWidth.value)
      if (container.value) {
        viewportTop.value = container.value.scrollTop
        viewportHeight.value = container.value.clientHeight
      }
    }

    const initialPage = props.loadAtPage as any
    paginationHistory.value = [initialPage]

    if (props.init === 'manual') {
      // Wait for next tick to ensure parent component has finished initializing
      // This is especially important when switching tabs, as the parent needs time
      // to restore query params and set up the tab state before masonry loads
      await nextTick()
      await loadPage(paginationHistory.value[0] as any)
    } else if (props.items && props.items.length > 0) {
      // When init is 'auto' and items are provided, initialize pagination state
      // Use initialPage/initialNextPage props if provided, otherwise use loadAtPage
      // Only set next to null if initialNextPage is explicitly null (not undefined)
      const page = props.initialPage !== null && props.initialPage !== undefined
        ? props.initialPage
        : (props.loadAtPage as any)
      const next = props.initialNextPage !== undefined
        ? props.initialNextPage
        : undefined // undefined means "unknown", null means "end of list"

      await restoreItems(props.items as any[], page, next)
      // Mark as initialized to prevent watcher from running again
      hasInitializedWithItems = true
      // isInitialized is set inside restoreItems
    }

    if (!useSwipeMode.value) {
      updateScrollProgress()
    } else {
      // In swipe mode, snap to first item
      nextTick(() => snapToCurrentItem())
    }

  } catch (error) {
    // If error is from loadPage, it's already handled via loadError
    // Only log truly unexpected initialization errors
    if (!loadError.value) {
      console.error('Error during component initialization:', error)
      // Set loadError for unexpected errors too
      loadError.value = normalizeError(error)
    }
    isLoading.value = false
  }

  // Scroll listener is handled by watcher now for consistency
  window.addEventListener('resize', debouncedResizeHandler)
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  container.value?.removeEventListener('scroll', debouncedScrollHandler)
  window.removeEventListener('resize', debouncedResizeHandler)
  window.removeEventListener('resize', handleWindowResize)

  if (swipeContainer.value) {
    swipeContainer.value.removeEventListener('touchstart', handleTouchStart)
    swipeContainer.value.removeEventListener('touchmove', handleTouchMove)
    swipeContainer.value.removeEventListener('touchend', handleTouchEnd)
    swipeContainer.value.removeEventListener('mousedown', handleMouseDown)
  }

  // Clean up mouse handlers
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div ref="wrapper" class="w-full h-full flex flex-col relative">
    <!-- Loading message while waiting for initial content -->
    <div v-if="!isInitialized" class="w-full h-full flex items-center justify-center">
      <slot name="loading-message">
        <p class="text-gray-500 dark:text-gray-400">Waiting for content to load...</p>
      </slot>
    </div>

    <!-- Swipe Feed Mode (Mobile/Tablet) -->
    <div v-else-if="useSwipeMode" class="overflow-hidden w-full flex-1 swipe-container touch-none select-none"
      :class="{ 'force-motion': props.forceMotion, 'cursor-grab': !isDragging, 'cursor-grabbing': isDragging }"
      ref="swipeContainer" style="height: 100%; max-height: 100%; position: relative;">
      <div class="relative w-full" :style="{
        transform: `translateY(${swipeOffset}px)`,
        transition: isDragging ? 'none' : `transform ${transitionDurationMs}ms ${transitionEasing}`,
        height: `${masonry.length * 100}%`
      }">
        <div v-for="(item, index) in masonry" :key="`${item.page}-${item.id}`" class="absolute top-0 left-0 w-full"
          :style="{
            top: `${index * (100 / masonry.length)}%`,
            height: `${100 / masonry.length}%`
          }">
          <div class="w-full h-full flex items-center justify-center p-4">
            <div class="w-full h-full max-w-full max-h-full relative">
              <slot :item="item" :remove="remove" :index="item.originalIndex ?? masonry.indexOf(item)">
                <MasonryItem :item="item" :remove="remove" :header-height="layout.header" :footer-height="layout.footer"
                  :in-swipe-mode="true" :is-active="index === currentSwipeIndex"
                  @preload:success="(p) => emits('item:preload:success', p)"
                  @preload:error="(p) => emits('item:preload:error', p)"
                  @mouse-enter="(p) => emits('item:mouse-enter', p)" @mouse-leave="(p) => emits('item:mouse-leave', p)">
                  <!-- Pass through header and footer slots to MasonryItem -->
                  <template #header="slotProps">
                    <slot name="item-header" v-bind="slotProps" />
                  </template>
                  <template #footer="slotProps">
                    <slot name="item-footer" v-bind="slotProps" />
                  </template>
                </MasonryItem>
              </slot>
            </div>
          </div>
        </div>
      </div>
      <!-- End of list message for swipe mode -->
      <div v-if="hasReachedEnd && masonry.length > 0" class="w-full py-8 text-center">
        <slot name="end-message">
          <p class="text-gray-500 dark:text-gray-400">You've reached the end</p>
        </slot>
      </div>
      <!-- Error message for swipe mode -->
      <div v-if="loadError && masonry.length > 0" class="w-full py-8 text-center">
        <slot name="error-message" :error="loadError">
          <p class="text-red-500 dark:text-red-400">Failed to load content: {{ loadError.message }}</p>
        </slot>
      </div>
    </div>

    <!-- Masonry Grid Mode (Desktop) -->
    <div v-else class="overflow-auto w-full flex-1 masonry-container" :class="{ 'force-motion': props.forceMotion }"
      ref="container">
      <div class="relative"
        :style="{ height: `${masonryContentHeight}px`, '--masonry-duration': `${transitionDurationMs}ms`, '--masonry-leave-duration': `${leaveDurationMs}ms`, '--masonry-ease': transitionEasing }">
        <transition-group name="masonry" :css="false" @enter="enter" @before-enter="beforeEnter" @leave="leave"
          @before-leave="beforeLeave">
          <div v-for="(item, i) in visibleMasonry" :key="`${item.page}-${item.id}`" class="absolute masonry-item"
            v-bind="getItemAttributes(item, i)">
            <!-- Use default slot if provided, otherwise use MasonryItem -->
            <slot :item="item" :remove="remove" :index="item.originalIndex ?? masonry.indexOf(item)">
              <MasonryItem :item="item" :remove="remove" :header-height="layout.header" :footer-height="layout.footer"
                :in-swipe-mode="false" :is-active="false" @preload:success="(p) => emits('item:preload:success', p)"
                @preload:error="(p) => emits('item:preload:error', p)"
                @mouse-enter="(p) => emits('item:mouse-enter', p)" @mouse-leave="(p) => emits('item:mouse-leave', p)">
                <!-- Pass through header and footer slots to MasonryItem -->
                <template #header="slotProps">
                  <slot name="item-header" v-bind="slotProps" />
                </template>
                <template #footer="slotProps">
                  <slot name="item-footer" v-bind="slotProps" />
                </template>
              </MasonryItem>
            </slot>
          </div>
        </transition-group>
      </div>
      <!-- End of list message -->
      <div v-if="hasReachedEnd && masonry.length > 0" class="w-full py-8 text-center">
        <slot name="end-message">
          <p class="text-gray-500 dark:text-gray-400">You've reached the end</p>
        </slot>
      </div>
      <!-- Error message -->
      <div v-if="loadError && masonry.length > 0" class="w-full py-8 text-center">
        <slot name="error-message" :error="loadError">
          <p class="text-red-500 dark:text-red-400">Failed to load content: {{ loadError.message }}</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.masonry-container {
  overflow-anchor: none;
}

.masonry-item {
  will-change: transform, opacity;
  contain: layout paint;
  transition: transform var(--masonry-duration, 450ms) var(--masonry-ease, cubic-bezier(.22, .61, .36, 1)),
    opacity var(--masonry-leave-duration, 160ms) ease-out var(--masonry-opacity-delay, 0ms);
  backface-visibility: hidden;
}

.masonry-move {
  transition: transform var(--masonry-duration, 450ms) var(--masonry-ease, cubic-bezier(.22, .61, .36, 1));
}

@media (prefers-reduced-motion: reduce) {

  .masonry-container:not(.force-motion) .masonry-item,
  .masonry-container:not(.force-motion) .masonry-move {
    transition-duration: 1ms !important;
  }
}
</style>
