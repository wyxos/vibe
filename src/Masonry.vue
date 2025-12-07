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
import MasonryItem from './components/MasonryItem.vue'

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
  skipInitialLoad: {
    type: Boolean,
    default: false
  },
  pageSize: {
    type: Number,
    default: 40
  },
  // Backfill configuration
  backfillEnabled: {
    type: Boolean,
    default: true
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

// Get current item index for swipe mode
const currentItem = computed(() => {
  if (!useSwipeMode.value || masonry.value.length === 0) return null
  const index = Math.max(0, Math.min(currentSwipeIndex.value, masonry.value.length - 1))
  return (masonry.value as any[])[index] || null
})

// Get next/previous items for preloading in swipe mode
const nextItem = computed(() => {
  if (!useSwipeMode.value || !currentItem.value) return null
  const nextIndex = currentSwipeIndex.value + 1
  if (nextIndex >= masonry.value.length) return null
  return (masonry.value as any[])[nextIndex] || null
})

const previousItem = computed(() => {
  if (!useSwipeMode.value || !currentItem.value) return null
  const prevIndex = currentSwipeIndex.value - 1
  if (prevIndex < 0) return null
  return (masonry.value as any[])[prevIndex] || null
})

const emits = defineEmits([
  'update:items',
  'backfill:start',
  'backfill:tick',
  'backfill:stop',
  'retry:start',
  'retry:tick',
  'retry:stop',
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

// Current breakpoint
const currentBreakpoint = computed(() => getBreakpointName(containerWidth.value))

// Swipe mode state
const currentSwipeIndex = ref<number>(0)
const swipeOffset = ref<number>(0)
const isDragging = ref<boolean>(false)
const dragStartY = ref<number>(0)
const dragStartOffset = ref<number>(0)
const swipeContainer = ref<HTMLElement | null>(null)

// Diagnostics: track items missing width/height to help developers
const invalidDimensionIds = ref<Set<number | string>>(new Set())
function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
function checkItemDimensions(items: any[], context: string) {
  try {
    if (!Array.isArray(items) || items.length === 0) return
    const missing = items.filter((item) => !isPositiveNumber(item?.width) || !isPositiveNumber(item?.height))
    if (missing.length === 0) return

    const newIds: Array<number | string> = []
    for (const item of missing) {
      const id = (item?.id as number | string | undefined) ?? `idx:${items.indexOf(item)}`
      if (!invalidDimensionIds.value.has(id)) {
        invalidDimensionIds.value.add(id)
        newIds.push(id)
      }
    }
    if (newIds.length > 0) {
      const sample = newIds.slice(0, 10)
      // eslint-disable-next-line no-console
      console.warn(
        '[Masonry] Items missing width/height detected:',
        {
          context,
          count: newIds.length,
          sampleIds: sample,
          hint: 'Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer.'
        }
      )
    }
  } catch {
    // best-effort diagnostics only
  }
}

// Virtualization viewport state
const viewportTop = ref(0)
const viewportHeight = ref(0)
const VIRTUAL_BUFFER_PX = props.virtualBufferPx

// Gate transitions during virtualization-only DOM churn
const virtualizing = ref(false)

// Scroll progress tracking
const scrollProgress = ref<{ distanceToTrigger: number; isNearTrigger: boolean }>({
  distanceToTrigger: 0,
  isNearTrigger: false
})

const updateScrollProgress = (precomputedHeights?: number[]) => {
  if (!container.value) return

  const { scrollTop, clientHeight } = container.value
  const visibleBottom = scrollTop + clientHeight

  const columnHeights = precomputedHeights ?? calculateColumnHeights(masonry.value as any, columns.value)
  const tallest = columnHeights.length ? Math.max(...columnHeights) : 0
  const threshold = typeof props.loadThresholdPx === 'number' ? props.loadThresholdPx : 200
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

// Setup composables
const { onEnter, onBeforeEnter, onBeforeLeave, onLeave } = useMasonryTransitions(masonry, { leaveDurationMs: props.leaveDurationMs })

// Transition wrappers that skip animation during virtualization
function enter(el: HTMLElement, done: () => void) {
  if (virtualizing.value) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    el.style.transition = 'none'
    el.style.opacity = '1'
    el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
    el.style.removeProperty('--masonry-opacity-delay')
    requestAnimationFrame(() => {
      el.style.transition = ''
      done()
    })
  } else {
    onEnter(el, done)
  }
}
function beforeEnter(el: HTMLElement) {
  if (virtualizing.value) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    el.style.transition = 'none'
    el.style.opacity = '1'
    el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
    el.style.removeProperty('--masonry-opacity-delay')
  } else {
    onBeforeEnter(el)
  }
}
function beforeLeave(el: HTMLElement) {
  if (virtualizing.value) {
    // no-op; removal will be immediate in leave
  } else {
    onBeforeLeave(el)
  }
}
function leave(el: HTMLElement, done: () => void) {
  if (virtualizing.value) {
    // Skip animation during virtualization
    done()
  } else {
    onLeave(el, done)
  }
}

// Visible window of items (virtualization)
const visibleMasonry = computed(() => {
  const top = viewportTop.value - VIRTUAL_BUFFER_PX
  const bottom = viewportTop.value + viewportHeight.value + VIRTUAL_BUFFER_PX
  const items = masonry.value as any[]
  if (!items || items.length === 0) return [] as any[]
  return items.filter((it: any) => {
    const itemTop = it.top
    const itemBottom = it.top + it.columnHeight
    return itemBottom >= top && itemTop <= bottom
  })
})

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

function setFixedDimensions(dimensions: { width?: number; height?: number } | null) {
  fixedDimensions.value = dimensions
  if (dimensions) {
    if (dimensions.width !== undefined) containerWidth.value = dimensions.width
    if (dimensions.height !== undefined) containerHeight.value = dimensions.height
    // Force layout refresh when dimensions change
    if (!useSwipeMode.value && container.value && masonry.value.length > 0) {
      nextTick(() => {
        columns.value = getColumnCount(layout.value as any, containerWidth.value)
        refreshLayout(masonry.value as any)
        updateScrollProgress()
      })
    }
  } else {
    // When clearing fixed dimensions, restore from wrapper
    if (wrapper.value) {
      containerWidth.value = wrapper.value.clientWidth
      containerHeight.value = wrapper.value.clientHeight
    }
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
  // Set fixed dimensions (overrides ResizeObserver)
  setFixedDimensions,
  remove,
  removeMany,
  removeAll,
  loadNext,
  loadPage,
  refreshCurrentPage,
  reset,
  destroy,
  init,
  paginationHistory,
  cancelLoad,
  scrollToTop,
  totalItems: computed(() => (masonry.value as any[]).length),
  currentBreakpoint
})

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

  if (!container.value) return
  // Developer diagnostics: warn when dimensions are invalid
  checkItemDimensions(items as any[], 'refreshLayout')
  // Preserve original index before layout reordering
  const itemsWithIndex = items.map((item, index) => ({
    ...item,
    originalIndex: item.originalIndex ?? index
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
  } else {
    const content = calculateLayout(itemsWithIndex as any, containerEl, columns.value, layout.value as any)
    calculateHeight(content as any)
    masonry.value = content
  }
}

function waitWithProgress(totalMs: number, onTick: (remaining: number, total: number) => void) {
  return new Promise<void>((resolve) => {
    const total = Math.max(0, totalMs | 0)
    const start = Date.now()
    onTick(total, total)
    const id = setInterval(() => {
      // Check for cancellation
      if (cancelRequested.value) {
        clearInterval(id)
        resolve()
        return
      }
      const elapsed = Date.now() - start
      const remaining = Math.max(0, total - elapsed)
      onTick(remaining, total)
      if (remaining <= 0) {
        clearInterval(id)
        resolve()
      }
    }, 100)
  })
}

async function getContent(page: number) {
  try {
    const response = await fetchWithRetry(() => props.getNextPage(page))
    refreshLayout([...(masonry.value as any[]), ...response.items])
    return response
  } catch (error) {
    console.error('Error in getContent:', error)
    throw error
  }
}

async function fetchWithRetry<T = any>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0
  const max = props.retryMaxAttempts
  let delay = props.retryInitialDelayMs
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fn()
      if (attempt > 0) {
        emits('retry:stop', { attempt, success: true })
      }
      return res
    } catch (err) {
      attempt++
      if (attempt > max) {
        emits('retry:stop', { attempt: attempt - 1, success: false })
        throw err
      }
      emits('retry:start', { attempt, max, totalMs: delay })
      await waitWithProgress(delay, (remaining, total) => {
        emits('retry:tick', { attempt, remainingMs: remaining, totalMs: total })
      })
      delay += props.retryBackoffStepMs
    }
  }
}

async function loadPage(page: number) {
  if (isLoading.value) return
  // Starting a new load should clear any previous cancel request
  cancelRequested.value = false
  isLoading.value = true
  // Reset hasReachedEnd and loadError when loading a new page
  hasReachedEnd.value = false
  loadError.value = null
  try {
    const baseline = (masonry.value as any[]).length
    if (cancelRequested.value) return
    const response = await getContent(page)
    if (cancelRequested.value) return
    // Clear error on successful load
    loadError.value = null
    currentPage.value = page  // Track the current page
    paginationHistory.value.push(response.nextPage)
    // Update hasReachedEnd if nextPage is null
    if (response.nextPage == null) {
      hasReachedEnd.value = true
    }
    await maybeBackfillToTarget(baseline)
    return response
  } catch (error) {
    console.error('Error loading page:', error)
    // Set load error
    loadError.value = error instanceof Error ? error : new Error(String(error))
    throw error
  } finally {
    isLoading.value = false
  }
}

async function loadNext() {
  if (isLoading.value) return
  // Don't load if we've already reached the end
  if (hasReachedEnd.value) return
  // Starting a new load should clear any previous cancel request
  cancelRequested.value = false
  isLoading.value = true
  // Clear error when attempting to load
  loadError.value = null
  try {
    const baseline = (masonry.value as any[]).length
    if (cancelRequested.value) return
    const nextPageToLoad = paginationHistory.value[paginationHistory.value.length - 1]
    // Don't load if nextPageToLoad is null
    if (nextPageToLoad == null) {
      hasReachedEnd.value = true
      isLoading.value = false
      return
    }
    const response = await getContent(nextPageToLoad)
    if (cancelRequested.value) return
    // Clear error on successful load
    loadError.value = null
    currentPage.value = nextPageToLoad  // Track the current page
    paginationHistory.value.push(response.nextPage)
    // Update hasReachedEnd if nextPage is null
    if (response.nextPage == null) {
      hasReachedEnd.value = true
    }
    await maybeBackfillToTarget(baseline)
    return response
  } catch (error) {
    console.error('Error loading next page:', error)
    // Set load error
    loadError.value = error instanceof Error ? error : new Error(String(error))
    throw error
  } finally {
    isLoading.value = false
  }
}

/**
 * Refresh the current page by clearing items and reloading from current page
 * Useful when items are removed and you want to stay on the same page
 */
async function refreshCurrentPage() {
  if (isLoading.value) return
  cancelRequested.value = false
  isLoading.value = true

  try {
    // Use the tracked current page
    const pageToRefresh = currentPage.value

    if (pageToRefresh == null) {
      console.warn('[Masonry] No current page to refresh - currentPage:', currentPage.value, 'paginationHistory:', paginationHistory.value)
      return
    }

    // Clear existing items
    masonry.value = []
    masonryContentHeight.value = 0
    hasReachedEnd.value = false  // Reset end flag when refreshing
    loadError.value = null  // Reset error flag when refreshing

    // Reset pagination history to just the current page
    paginationHistory.value = [pageToRefresh]

    await nextTick()

    // Reload the current page
    const response = await getContent(pageToRefresh)
    if (cancelRequested.value) return

    // Clear error on successful load
    loadError.value = null
    // Update pagination state
    currentPage.value = pageToRefresh
    paginationHistory.value.push(response.nextPage)
    // Update hasReachedEnd if nextPage is null
    if (response.nextPage == null) {
      hasReachedEnd.value = true
    }

    // Optionally backfill if needed
    const baseline = (masonry.value as any[]).length
    await maybeBackfillToTarget(baseline)

    return response
  } catch (error) {
    console.error('[Masonry] Error refreshing current page:', error)
    // Set load error
    loadError.value = error instanceof Error ? error : new Error(String(error))
    throw error
  } finally {
    isLoading.value = false
  }
}

async function remove(item: any) {
  const next = (masonry.value as any[]).filter(i => i.id !== item.id)
  masonry.value = next
  await nextTick()

  // If all items were removed, either refresh current page or load next based on prop
  if (next.length === 0 && paginationHistory.value.length > 0) {
    if (props.autoRefreshOnEmpty) {
      await refreshCurrentPage()
    } else {
      try {
        await loadNext()
        // Force backfill from 0 to ensure viewport is filled
        // Pass baseline=0 and force=true to trigger backfill even if backfillEnabled was temporarily disabled
        await maybeBackfillToTarget(0, true)
      } catch { }
    }
    return
  }

  // Commit DOM updates without forcing sync reflow
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  // Start FLIP on next frame
  requestAnimationFrame(() => {
    refreshLayout(next)
  })
}

async function removeMany(items: any[]) {
  if (!items || items.length === 0) return
  const ids = new Set(items.map(i => i.id))
  const next = (masonry.value as any[]).filter(i => !ids.has(i.id))
  masonry.value = next
  await nextTick()

  // If all items were removed, either refresh current page or load next based on prop
  if (next.length === 0 && paginationHistory.value.length > 0) {
    if (props.autoRefreshOnEmpty) {
      await refreshCurrentPage()
    } else {
      try {
        await loadNext()
        // Force backfill from 0 to ensure viewport is filled
        await maybeBackfillToTarget(0, true)
      } catch { }
    }
    return
  }

  // Commit DOM updates without forcing sync reflow
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  // Start FLIP on next frame
  requestAnimationFrame(() => {
    refreshLayout(next)
  })
}

function scrollToTop(options?: ScrollToOptions) {
  if (container.value) {
    container.value.scrollTo({
      top: 0,
      behavior: options?.behavior ?? 'smooth',
      ...options
    })
  }
}

async function removeAll() {
  // Scroll to top first for better UX
  scrollToTop({ behavior: 'smooth' })

  // Clear all items
  masonry.value = []

  // Recalculate height to 0
  containerHeight.value = 0

  await nextTick()

  // Emit completion event
  emits('remove-all:complete')
}

function onResize() {
  columns.value = getColumnCount(layout.value as any, containerWidth.value)
  refreshLayout(masonry.value as any)
  if (container.value) {
    viewportTop.value = container.value.scrollTop
    viewportHeight.value = container.value.clientHeight
  }
}

let backfillActive = false
const cancelRequested = ref(false)

async function maybeBackfillToTarget(baselineCount: number, force = false) {
  if (!force && !props.backfillEnabled) return
  if (backfillActive) return
  if (cancelRequested.value) return
  // Don't backfill if we've reached the end
  if (hasReachedEnd.value) return

  const targetCount = (baselineCount || 0) + (props.pageSize || 0)
  if (!props.pageSize || props.pageSize <= 0) return

  const lastNext = paginationHistory.value[paginationHistory.value.length - 1]
  if (lastNext == null) {
    hasReachedEnd.value = true
    return
  }

  if ((masonry.value as any[]).length >= targetCount) return

  backfillActive = true
  try {
    let calls = 0
    emits('backfill:start', { target: targetCount, fetched: (masonry.value as any[]).length, calls })

    while (
      (masonry.value as any[]).length < targetCount &&
      calls < props.backfillMaxCalls &&
      paginationHistory.value[paginationHistory.value.length - 1] != null &&
      !cancelRequested.value &&
      !hasReachedEnd.value
    ) {
      await waitWithProgress(props.backfillDelayMs, (remaining, total) => {
        emits('backfill:tick', {
          fetched: (masonry.value as any[]).length,
          target: targetCount,
          calls,
          remainingMs: remaining,
          totalMs: total
        })
      })

      if (cancelRequested.value) break

      const currentPage = paginationHistory.value[paginationHistory.value.length - 1]
      if (currentPage == null) {
        hasReachedEnd.value = true
        break
      }
      try {
        isLoading.value = true
        const response = await getContent(currentPage)
        if (cancelRequested.value) break
        // Clear error on successful load
        loadError.value = null
        paginationHistory.value.push(response.nextPage)
        // Update hasReachedEnd if nextPage is null
        if (response.nextPage == null) {
          hasReachedEnd.value = true
        }
      } catch (error) {
        // Set load error but don't break the backfill loop
        loadError.value = error instanceof Error ? error : new Error(String(error))
      } finally {
        isLoading.value = false
      }

      calls++
    }

    emits('backfill:stop', { fetched: (masonry.value as any[]).length, calls })
  } finally {
    backfillActive = false
  }
}

function cancelLoad() {
  cancelRequested.value = true
  isLoading.value = false
  backfillActive = false
}

function reset() {
  // Cancel ongoing work, then immediately clear cancel so new loads can start
  cancelLoad()
  cancelRequested.value = false
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

  scrollProgress.value = {
    distanceToTrigger: 0,
    isNearTrigger: false
  }
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
  backfillActive = false
  cancelRequested.value = false
  
  // Reset swipe mode state
  currentSwipeIndex.value = 0
  swipeOffset.value = 0
  isDragging.value = false
  
  // Reset viewport state
  viewportTop.value = 0
  viewportHeight.value = 0
  virtualizing.value = false
  
  // Reset scroll progress
  scrollProgress.value = {
    distanceToTrigger: 0,
    isNearTrigger: false
  }
  
  // Reset invalid dimension tracking
  invalidDimensionIds.value.clear()
  
  // Scroll to top if container exists
  if (container.value) {
    container.value.scrollTo({
      top: 0,
      behavior: 'auto' // Instant scroll for destroy
    })
  }
}

const debouncedScrollHandler = debounce(async () => {
  if (useSwipeMode.value) return // Skip scroll handling in swipe mode

  if (container.value) {
    viewportTop.value = container.value.scrollTop
    viewportHeight.value = container.value.clientHeight
  }
  // Gate transitions for virtualization-only DOM changes
  virtualizing.value = true
  await nextTick()
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  virtualizing.value = false

  const heights = calculateColumnHeights(masonry.value as any, columns.value)
  handleScroll(heights as any)
  updateScrollProgress(heights)
}, 200)

const debouncedResizeHandler = debounce(onResize, 200)

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

function snapToCurrentItem() {
  if (!swipeContainer.value) return

  // Use container height for swipe mode instead of window height
  const viewportHeight = swipeContainer.value.clientHeight
  swipeOffset.value = -currentSwipeIndex.value * viewportHeight
}

// Watch for container/window resize to update swipe mode
// Note: containerWidth is updated by ResizeObserver, not here
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
    updateScrollProgress()
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

    if (!props.skipInitialLoad) {
      await loadPage(paginationHistory.value[0] as any)
    }

    if (!useSwipeMode.value) {
      updateScrollProgress()
    } else {
      // In swipe mode, snap to first item
      nextTick(() => snapToCurrentItem())
    }

  } catch (error) {
    console.error('Error during component initialization:', error)
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
    <!-- Swipe Feed Mode (Mobile/Tablet) -->
    <div v-if="useSwipeMode" class="overflow-hidden w-full flex-1 swipe-container touch-none select-none"
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
              <slot :item="item" :remove="remove">
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
            <slot :item="item" :remove="remove">
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
