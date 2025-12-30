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
import MasonryItem from './components/MasonryItem.vue'
import { normalizeError } from './utils/errorHandler'

const props = defineProps({
  getPage: {
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
  // Opaque caller-owned context passed through to getPage(page, context).
  // Useful for including filters, service selection, tabId, etc.
  context: {
    type: Object,
    default: null
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
  'loading:start',
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
  'item:mouse-leave',
  'update:context'
])

const masonry = computed<any>({
  get: () => props.items,
  set: (val) => emits('update:items', val)
})

const context = computed<any>({
  get: () => props.context,
  set: (val) => emits('update:context', val)
})

function setContext(val: any) {
  context.value = val
}

const masonryLength = computed((): number => {
  const items = masonry.value as any[]
  return items?.length ?? 0
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

// ===== INLINED: useMasonryDimensions =====
// Track items with invalid dimensions to avoid duplicate warnings
const invalidDimensionIds = ref<Set<number | string>>(new Set())

function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && value > 0 && Number.isFinite(value)
}

function checkItemDimensions(items: any[], context: string) {
  try {
    if (!Array.isArray(items) || items.length === 0) return
    const missing = items.filter((item) => !isPositiveNumber(item?.width) || !isPositiveNumber(item?.height))
    if (missing.length === 0) return

    const newIds: Array<number | string> = []
    for (const item of missing) {
      const id = (item?.id as number | string | undefined) ?? `idx:${masonry.value.indexOf(item)}`
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

function resetDimensions() {
  invalidDimensionIds.value.clear()
}
// ===== END INLINED: useMasonryDimensions =====

// ===== INLINED: useMasonryLayout =====
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

  // Note: masonry.value is already set by callers before refreshLayout
  // We only set it here with processed items after layout calculation
  if (!container.value) {
    // If container isn't ready, ensure items are set for tests
    // (callers should have already set it, but this is a safety net)
    if (masonry.value !== items) {
      masonry.value = items as any
    }
    return
  }
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

function setFixedDimensionsLayout(
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

function onResizeLayout() {
  columns.value = getColumnCount(layout.value as any, containerWidth.value)
  refreshLayout(masonry.value as any)
}
// ===== END INLINED: useMasonryLayout =====

// ===== INLINED: useMasonryVirtualization =====
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

async function updateViewportVirtualization() {
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
  handleScroll(heights as any)
  updateScrollProgress(heights)
}

function resetVirtualization() {
  viewportTop.value = 0
  viewportHeight.value = 0
  virtualizing.value = false
  scrollProgress.value = {
    distanceToTrigger: 0,
    isNearTrigger: false
  }
}
// ===== END INLINED: useMasonryVirtualization =====

// ===== INLINED: createMasonryTransitions =====
// Cache viewport bounds to avoid repeated calculations
let cachedViewportTop = 0
let cachedViewportBottom = 0
let cachedViewportHeight = 0
const VIEWPORT_BUFFER_PX = 1000 // Buffer zone for items near viewport

// Check if item is in viewport (with buffer) - optimized to skip DOM reads
function isItemInViewport(itemTop: number, itemHeight: number): boolean {
  // Update cached viewport bounds if container exists
  if (container.value) {
    const scrollTop = container.value.scrollTop
    const clientHeight = container.value.clientHeight
    cachedViewportTop = scrollTop - VIEWPORT_BUFFER_PX
    cachedViewportBottom = scrollTop + clientHeight + VIEWPORT_BUFFER_PX
    cachedViewportHeight = clientHeight
  }

  const itemBottom = itemTop + itemHeight
  return itemBottom >= cachedViewportTop && itemTop <= cachedViewportBottom
}

function onEnter(el: HTMLElement, done: () => void) {
  const left = parseInt(el.dataset.left || '0', 10)
  const top = parseInt(el.dataset.top || '0', 10)
  const index = parseInt(el.dataset.index || '0', 10)
  // Get height from computed style or use a reasonable fallback
  const height = el.offsetHeight || parseInt(getComputedStyle(el).height || '200', 10) || 200

  // Skip animation during virtualization - just set position immediately
  if (virtualizing.value) {
    el.style.transition = 'none'
    el.style.opacity = '1'
    el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
    el.style.removeProperty('--masonry-opacity-delay')
    el.style.transition = ''
    done()
    return
  }

  // Skip animation for items outside viewport - just set position immediately
  if (!isItemInViewport(top, height)) {
    el.style.opacity = '1'
    el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
    el.style.transition = 'none'
    done()
    return
  }

  const delay = Math.min(index * 20, 160)
  const prevOpacityDelay = el.style.getPropertyValue('--masonry-opacity-delay')
  el.style.setProperty('--masonry-opacity-delay', `${delay}ms`)

  el.style.opacity = '1'
  el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
  const clear = () => {
    if (prevOpacityDelay) {
      el.style.setProperty('--masonry-opacity-delay', prevOpacityDelay)
    } else {
      el.style.removeProperty('--masonry-opacity-delay')
    }
    el.removeEventListener('transitionend', clear)
    done()
  }
  el.addEventListener('transitionend', clear)
}

function onBeforeEnter(el: HTMLElement) {
  const left = parseInt(el.dataset.left || '0', 10)
  const top = parseInt(el.dataset.top || '0', 10)

  // Skip animation during virtualization
  if (virtualizing.value) {
    el.style.transition = 'none'
    el.style.opacity = '1'
    el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
    el.style.removeProperty('--masonry-opacity-delay')
    return
  }

  // For new items entering, start from 0,0 (top-left) before animating to final position
  // This provides a clean FLIP animation for items that don't have a previous position
  // If data attributes are 0,0, the item is likely new (or actually at 0,0, which is fine)
  const initialLeft = left === 0 && top === 0 ? 0 : left
  const initialTop = left === 0 && top === 0 ? 0 : top

  el.style.opacity = '0'
  el.style.transform = `translate3d(${initialLeft}px, ${initialTop + 10}px, 0) scale(0.985)`
}

function onBeforeLeave(el: HTMLElement) {
  const left = parseInt(el.dataset.left || '0', 10)
  const top = parseInt(el.dataset.top || '0', 10)
  const height = el.offsetHeight || parseInt(getComputedStyle(el).height || '200', 10) || 200

  // Skip animation during virtualization
  if (virtualizing.value) {
    // no-op; removal will be immediate in leave
    return
  }

  // Skip animation for items outside viewport
  if (!isItemInViewport(top, height)) {
    el.style.transition = 'none'
    return
  }

  el.style.transition = 'none'
  el.style.opacity = '1'
  el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
  el.style.removeProperty('--masonry-opacity-delay')
  el.style.transition = ''
}

function onLeave(el: HTMLElement, done: () => void) {
  const left = parseInt(el.dataset.left || '0', 10)
  const top = parseInt(el.dataset.top || '0', 10)
  const height = el.offsetHeight || parseInt(getComputedStyle(el).height || '200', 10) || 200

  // Skip animation during virtualization - remove immediately
  if (virtualizing.value) {
    done()
    return
  }

  // Skip animation for items outside viewport - remove immediately
  if (!isItemInViewport(top, height)) {
    el.style.transition = 'none'
    el.style.opacity = '0'
    done()
    return
  }

  // Prefer explicit option, fallback to CSS variable for safety
  const fromOpts = typeof props.leaveDurationMs === 'number' ? props.leaveDurationMs : Number.NaN
  let leaveMs = Number.isFinite(fromOpts) && fromOpts > 0 ? fromOpts : Number.NaN
  if (!Number.isFinite(leaveMs)) {
    const cs = getComputedStyle(el)
    const varVal = cs.getPropertyValue('--masonry-leave-duration') || ''
    const parsed = parseFloat(varVal)
    leaveMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 200
  }

  const prevDuration = el.style.transitionDuration

  const cleanup = () => {
    el.removeEventListener('transitionend', onEnd as any)
    clearTimeout(fallback)
    el.style.transitionDuration = prevDuration || ''
  }
  const onEnd = (e?: Event) => {
    if (!e || e.target === el) {
      cleanup()
      done()
    }
  }
  const fallback = setTimeout(() => {
    cleanup()
    done()
  }, leaveMs + 100)

  el.style.transitionDuration = `${leaveMs}ms`
  el.style.opacity = '0'
  el.style.transform = `translate3d(${left}px, ${top + 10}px, 0) scale(0.985)`
  el.addEventListener('transitionend', onEnd as any)
}

// Transition functions for template (wrapped to match expected signature)
const enter = onEnter
const beforeEnter = onBeforeEnter
const beforeLeave = onBeforeLeave
const leave = onLeave
// ===== END INLINED: createMasonryTransitions =====

// ===== INLINED: useMasonryScroll =====
let cleanupInProgress = false
let lastScrollTop = 0

async function handleScroll(precomputedHeights?: number[], forceCheck = false) {
  if (!container.value) return

  const columnHeights = precomputedHeights ?? calculateColumnHeights(masonry.value as any, columns.value)
  const tallest = columnHeights.length ? Math.max(...columnHeights) : 0
  const scrollerBottom = container.value.scrollTop + container.value.clientHeight

  const isScrollingDown = container.value.scrollTop > lastScrollTop + 1 // tolerate tiny jitter
  lastScrollTop = container.value.scrollTop

  const threshold = typeof props.loadThresholdPx === 'number' ? props.loadThresholdPx : 200
  const triggerPoint = threshold >= 0
    ? Math.max(0, tallest - threshold)
    : Math.max(0, tallest + threshold)
  const nearBottom = scrollerBottom >= triggerPoint

  // Allow loading if near bottom and either scrolling down OR forceCheck is true (for restoration)
  if (nearBottom && (isScrollingDown || forceCheck) && !isLoading.value) {
    await loadNext()
    await nextTick()
    return
  }
}
// ===== END INLINED: useMasonryScroll =====

// ===== INLINED: useMasonryPagination =====
// Make mode reactive so it updates when the prop changes
const modeRef = computed(() => props.mode)

const cancelRequested = ref(false)
let backfillActive = false

// Helper function to count items for a specific page
function countItemsForPage(page: any): number {
  return masonry.value.filter((item: any) => item.page === page).length
}

// Helper function to check if an item already exists in masonry
function itemExists(item: any, itemsArray?: any[]): boolean {
  if (!item || item.id == null || item.page == null) return false
  const itemsToCheck = itemsArray || masonry.value
  return itemsToCheck.some((existing: any) => {
    return existing && existing.id === item.id && existing.page === item.page
  })
}

// Helper function to get only new items from a response
function getNewItems(responseItems: any[]): any[] {
  if (!responseItems || responseItems.length === 0) return []
  // Create a snapshot of current masonry items to avoid reactivity issues
  const currentItems = [...masonry.value]
  return responseItems.filter((item: any) => {
    if (!item || item.id == null || item.page == null) return false
    // Check if item exists by comparing id and page
    const exists = currentItems.some((existing: any) => {
      return existing && existing.id === item.id && existing.page === item.page
    })
    return !exists
  })
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

// Helper function to add items to masonry and refresh layout
async function addItemsAndRefreshLayout(newItems: any[]) {
  masonry.value = newItems
  // Wait for DOM update, then calculate layout for FLIP animation
  await nextTick()
  await nextTick()
  refreshLayout(newItems)
}

// Pure function: just fetches and returns page data
async function getContent(page: number) {
  return await fetchWithRetry(() => props.getPage(page, context?.value))
}

async function maybeBackfillToTarget(baselineCount: number, force = false) {
  if (!force && modeRef.value !== 'backfill') return
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

  if (masonry.value.length >= targetCount) return

  backfillActive = true
  // Set loading to true at the start of backfill and keep it true throughout
  if (!isLoading.value) {
    isLoading.value = true
    emits('loading:start')
  }
  try {
    let calls = 0
    const initialCurrentPage = currentPage.value
    const initialNextPage = paginationHistory.value[paginationHistory.value.length - 1]
    emits('backfill:start', {
      target: targetCount,
      fetched: masonry.value.length,
      calls,
      currentPage: initialCurrentPage,
      nextPage: initialNextPage
    })

    while (
      masonry.value.length < targetCount &&
      calls < props.backfillMaxCalls &&
      paginationHistory.value[paginationHistory.value.length - 1] != null &&
      !cancelRequested.value &&
      !hasReachedEnd.value &&
      backfillActive
    ) {
      const tickCurrentPage = currentPage.value
      const tickNextPage = paginationHistory.value[paginationHistory.value.length - 1]
      await waitWithProgress(props.backfillDelayMs, (remaining, total) => {
        emits('backfill:tick', {
          fetched: masonry.value.length,
          target: targetCount,
          calls,
          remainingMs: remaining,
          totalMs: total,
          currentPage: tickCurrentPage,
          nextPage: tickNextPage
        })
      })

      if (cancelRequested.value || !backfillActive) break

      const currentPageToLoad = paginationHistory.value[paginationHistory.value.length - 1]
      if (currentPageToLoad == null) {
        hasReachedEnd.value = true
        break
      }
      try {
        // Don't toggle isLoading here - keep it true throughout backfill
        // Check cancellation before starting getContent to avoid unnecessary requests
        if (cancelRequested.value || !backfillActive) break
        const pageData = await getContent(currentPageToLoad)
        if (cancelRequested.value || !backfillActive) break

        // Add items to masonry and refresh layout
        const newItems = [...masonry.value, ...pageData.items]
        await addItemsAndRefreshLayout(newItems)

        // Clear error on successful load
        loadError.value = null
        currentPage.value = currentPageToLoad
        paginationHistory.value.push(pageData.nextPage)
        // Update hasReachedEnd if nextPage is null
        if (pageData.nextPage == null) {
          hasReachedEnd.value = true
        }
      } catch (error) {
        // Set load error but don't break the backfill loop unless cancelled
        if (cancelRequested.value || !backfillActive) break
        loadError.value = normalizeError(error)
      }

      calls++
    }

    const stopCurrentPage = currentPage.value
    const stopNextPage = paginationHistory.value[paginationHistory.value.length - 1]
    emits('backfill:stop', {
      fetched: masonry.value.length,
      calls,
      currentPage: stopCurrentPage,
      nextPage: stopNextPage
    })
  } finally {
    backfillActive = false
    // Only set loading to false when backfill completes or is cancelled
    isLoading.value = false
    const finalCurrentPage = currentPage.value
    const finalNextPage = paginationHistory.value[paginationHistory.value.length - 1]
    emits('loading:stop', {
      fetched: masonry.value.length,
      currentPage: finalCurrentPage,
      nextPage: finalNextPage
    })
  }
}

async function loadPage(page: number) {
  if (isLoading.value) return
  // Starting a new load should clear any previous cancel request
  cancelRequested.value = false
  if (!isLoading.value) {
    isLoading.value = true
    emits('loading:start')
  }
  // Reset hasReachedEnd and loadError when loading a new page
  hasReachedEnd.value = false
  loadError.value = null
  try {
    const baseline = masonry.value.length
    if (cancelRequested.value) return
    const pageData = await getContent(page)
    if (cancelRequested.value) return

    // Add items to masonry and refresh layout
    const newItems = [...masonry.value, ...pageData.items]
    await addItemsAndRefreshLayout(newItems)

    // Clear error on successful load
    loadError.value = null
    currentPage.value = page  // Track the current page
    paginationHistory.value.push(pageData.nextPage)
    // Update hasReachedEnd if nextPage is null
    if (pageData.nextPage == null) {
      hasReachedEnd.value = true
    }
    await maybeBackfillToTarget(baseline)
    return pageData
  } catch (error) {
    // Set load error - error is handled and exposed to UI via loadError
    loadError.value = normalizeError(error)
    throw error
  } finally {
    isLoading.value = false
    const finalCurrentPage = currentPage.value
    const finalNextPage = paginationHistory.value[paginationHistory.value.length - 1]
    emits('loading:stop', {
      fetched: masonry.value.length,
      currentPage: finalCurrentPage,
      nextPage: finalNextPage
    })
  }
}

async function loadNext() {
  if (isLoading.value) return
  // Don't load if we've already reached the end
  if (hasReachedEnd.value) return
  // Starting a new load should clear any previous cancel request
  cancelRequested.value = false
  if (!isLoading.value) {
    isLoading.value = true
    emits('loading:start')
  }
  // Clear error when attempting to load
  loadError.value = null
  try {
    const baseline = masonry.value.length
    if (cancelRequested.value) return

    // Refresh mode: check if current page needs refreshing before loading next
    if (modeRef.value === 'refresh' && currentPage.value != null) {
      const currentPageItemCount = countItemsForPage(currentPage.value)

      // If current page has fewer items than pageSize, refresh it first
      if (currentPageItemCount < props.pageSize) {
        const pageData = await fetchWithRetry(() => props.getPage(currentPage.value, context?.value))
        if (cancelRequested.value) return

        // Get only new items that don't already exist
        // We need to check against the current masonry state at this moment
        const currentMasonrySnapshot = [...masonry.value]
        const newItems = pageData.items.filter((item: any) => {
          if (!item || item.id == null || item.page == null) return false
          return !currentMasonrySnapshot.some((existing: any) => {
            return existing && existing.id === item.id && existing.page === item.page
          })
        })

        // Append only new items to masonry (same pattern as getContent)
        if (newItems.length > 0) {
          const updatedItems = [...masonry.value, ...newItems]
          masonry.value = updatedItems
          // Wait for DOM update, then calculate layout for FLIP animation
          await nextTick()
          await nextTick()
          refreshLayout(updatedItems)
        }

        // Clear error on successful load
        loadError.value = null

        // If no new items were found, automatically proceed to next page
        // This means the current page has no more items available
        if (newItems.length === 0) {
          const nextPageToLoad = paginationHistory.value[paginationHistory.value.length - 1]
          if (nextPageToLoad == null) {
            hasReachedEnd.value = true
            return
          }
          const nextResponse = await getContent(nextPageToLoad)
          if (cancelRequested.value) return

          // Add items to masonry and refresh layout
          const nextNewItems = [...masonry.value, ...nextResponse.items]
          await addItemsAndRefreshLayout(nextNewItems)

          loadError.value = null
          currentPage.value = nextPageToLoad
          paginationHistory.value.push(nextResponse.nextPage)
          if (nextResponse.nextPage == null) {
            hasReachedEnd.value = true
          }
          await maybeBackfillToTarget(baseline)
          return nextResponse
        }

        // If we now have enough items for current page, proceed to next page
        // Re-check count after items have been added
        const updatedCount = countItemsForPage(currentPage.value)
        if (updatedCount >= props.pageSize) {
          // Current page is now full, proceed with normal next page loading
          const nextPageToLoad = paginationHistory.value[paginationHistory.value.length - 1]
          if (nextPageToLoad == null) {
            hasReachedEnd.value = true
            return
          }
          const nextResponse = await getContent(nextPageToLoad)
          if (cancelRequested.value) return

          // Add items to masonry and refresh layout
          const nextNewItems = [...masonry.value, ...nextResponse.items]
          await addItemsAndRefreshLayout(nextNewItems)

          loadError.value = null
          currentPage.value = nextPageToLoad
          paginationHistory.value.push(nextResponse.nextPage)
          if (nextResponse.nextPage == null) {
            hasReachedEnd.value = true
          }
          await maybeBackfillToTarget(baseline)
          return nextResponse
        } else {
          // Still not enough items, but we refreshed - return the refresh pageData
          return pageData
        }
      }
    }

    // Normal flow: load next page
    const nextPageToLoad = paginationHistory.value[paginationHistory.value.length - 1]
    // Don't load if nextPageToLoad is null
    if (nextPageToLoad == null) {
      hasReachedEnd.value = true
      return
    }
    const pageData = await getContent(nextPageToLoad)
    if (cancelRequested.value) return

    // Add items to masonry and refresh layout
    const newItems = [...masonry.value, ...pageData.items]
    await addItemsAndRefreshLayout(newItems)

    // Clear error on successful load
    loadError.value = null
    currentPage.value = nextPageToLoad  // Track the current page
    paginationHistory.value.push(pageData.nextPage)
    // Update hasReachedEnd if nextPage is null
    if (pageData.nextPage == null) {
      hasReachedEnd.value = true
    }
    await maybeBackfillToTarget(baseline)
    return pageData
  } catch (error) {
    // Set load error - error is handled and exposed to UI via loadError
    loadError.value = normalizeError(error)
    throw error
  } finally {
    isLoading.value = false
    const finalCurrentPage = currentPage.value
    const finalNextPage = paginationHistory.value[paginationHistory.value.length - 1]
    emits('loading:stop', {
      fetched: masonry.value.length,
      currentPage: finalCurrentPage,
      nextPage: finalNextPage
    })
  }
}

async function refreshCurrentPage() {
  if (isLoading.value) return
  cancelRequested.value = false
  isLoading.value = true
  emits('loading:start')

  try {
    // Use the tracked current page
    const pageToRefresh = currentPage.value

    if (pageToRefresh == null) {
      console.warn('[Masonry] No current page to refresh - currentPage:', currentPage.value, 'paginationHistory:', paginationHistory.value)
      return
    }

    // Clear existing items
    masonry.value = []
    // Reset end flag when refreshing
    hasReachedEnd.value = false
    // Reset error flag when refreshing
    loadError.value = null

    // Reset pagination history to just the current page
    paginationHistory.value = [pageToRefresh]

    // Reload the current page
    const pageData = await getContent(pageToRefresh)
    if (cancelRequested.value) return

    // Add items to masonry and refresh layout
    const newItems = [...pageData.items]
    await addItemsAndRefreshLayout(newItems)

    // Clear error on successful load
    loadError.value = null
    // Update pagination state
    currentPage.value = pageToRefresh
    paginationHistory.value.push(pageData.nextPage)
    // Update hasReachedEnd if nextPage is null
    if (pageData.nextPage == null) {
      hasReachedEnd.value = true
    }

    // Optionally backfill if needed
    const baseline = masonry.value.length
    await maybeBackfillToTarget(baseline)

    return pageData
  } catch (error) {
    // Set load error - error is handled and exposed to UI via loadError
    loadError.value = normalizeError(error)
    throw error
  } finally {
    isLoading.value = false
    const finalCurrentPage = currentPage.value
    const finalNextPage = paginationHistory.value[paginationHistory.value.length - 1]
    emits('loading:stop', {
      fetched: masonry.value.length,
      currentPage: finalCurrentPage,
      nextPage: finalNextPage
    })
  }
}

function cancelLoad() {
  const wasBackfilling = backfillActive
  cancelRequested.value = true
  isLoading.value = false
  // Set backfillActive to false to immediately stop backfilling
  // The backfill loop checks this flag and will exit on the next iteration
  backfillActive = false
  const cancelCurrentPage = currentPage.value
  const cancelNextPage = paginationHistory.value[paginationHistory.value.length - 1]
  // If backfill was active, emit stop event immediately
  if (wasBackfilling) {
    emits('backfill:stop', {
      fetched: masonry.value.length,
      calls: 0,
      cancelled: true,
      currentPage: cancelCurrentPage,
      nextPage: cancelNextPage
    })
  }
  emits('loading:stop', {
    fetched: masonry.value.length,
    currentPage: cancelCurrentPage,
    nextPage: cancelNextPage
  })
}
// ===== END INLINED: useMasonryPagination =====

// ===== INLINED: useMasonryItems =====
// Race condition protection: prevent concurrent item operations
let isProcessingItems = false

// Batch remove operations to prevent visual glitches from rapid successive calls
let pendingRemoves = new Set<any>()
let removeTimeoutId: ReturnType<typeof setTimeout> | null = null
let isProcessingRemoves = false

async function processPendingRemoves() {
  if (pendingRemoves.size === 0 || isProcessingRemoves) return

  isProcessingRemoves = true
  const itemsToRemove = Array.from(pendingRemoves)
  pendingRemoves.clear()
  removeTimeoutId = null

  // Use removeManyInternal for batched removal (bypass batching to avoid recursion)
  await removeManyInternal(itemsToRemove)
  isProcessingRemoves = false
}

async function remove(item: any) {
  // Add to pending removes
  pendingRemoves.add(item)

  // Clear existing timeout
  if (removeTimeoutId) {
    clearTimeout(removeTimeoutId)
  }

  // Batch removes within a short time window (16ms = ~1 frame at 60fps)
  removeTimeoutId = setTimeout(() => {
    processPendingRemoves()
  }, 16)
}

async function removeManyInternal(items: any[]) {
  if (!items || items.length === 0) return
  const ids = new Set(items.map(i => i.id))
  const next = masonry.value.filter(i => !ids.has(i.id))
  masonry.value = next
  await nextTick()

  // If all items were removed, load next page
  if (next.length === 0 && paginationHistory.value.length > 0) {
    try {
      await loadNext()
      // Force backfill from 0 to ensure viewport is filled
      await maybeBackfillToTarget(0, true)
    } catch { }
    return
  }

  // Wait for DOM update, then calculate layout for FLIP animation
  await nextTick()
  refreshLayout(next)
}

async function removeMany(items: any[]) {
  if (!items || items.length === 0) return

  // Add all items to pending removes for batching
  items.forEach(item => pendingRemoves.add(item))

  // Clear existing timeout
  if (removeTimeoutId) {
    clearTimeout(removeTimeoutId)
  }

  // Batch removes within a short time window (16ms = ~1 frame at 60fps)
  removeTimeoutId = setTimeout(() => {
    processPendingRemoves()
  }, 16)
}

/**
 * Restore a single item at its original index.
 * This is useful for undo operations where an item needs to be restored to its exact position.
 * Handles all index calculation and layout recalculation internally.
 * @param item - Item to restore
 * @param index - Original index of the item
 */
async function restore(item: any, index: number) {
  if (!item) return
  if (isProcessingItems) return // Prevent concurrent operations

  isProcessingItems = true
  try {
    const current = masonry.value
    const existingIndex = current.findIndex(i => i.id === item.id)
    if (existingIndex !== -1) return // Item already exists

    // Insert at the original index (clamped to valid range)
    const newItems = [...current]
    const targetIndex = Math.min(index, newItems.length)
    newItems.splice(targetIndex, 0, item)

    // Update the masonry array
    masonry.value = newItems
    await nextTick()

    // Trigger layout recalculation (same pattern as remove)
    if (!useSwipeMode.value) {
      // Wait for DOM update, then calculate layout for FLIP animation
      await nextTick()
      refreshLayout(newItems)
    }
  } finally {
    isProcessingItems = false
  }
}

/**
 * Restore multiple items at their original indices.
 * This is useful for undo operations where items need to be restored to their exact positions.
 * Handles all index calculation and layout recalculation internally.
 * @param items - Array of items to restore
 * @param indices - Array of original indices for each item (must match items array length)
 */
async function restoreMany(items: any[], indices: number[]) {
  if (!items || items.length === 0) return
  if (!indices || indices.length !== items.length) {
    console.warn('[Masonry] restoreMany: items and indices arrays must have the same length')
    return
  }
  if (isProcessingItems) return // Prevent concurrent operations

  isProcessingItems = true
  try {

    const current = masonry.value
    const existingIds = new Set(current.map(i => i.id))

    // Filter out items that already exist and pair with their indices
    const itemsToRestore: Array<{ item: any; index: number }> = []
    for (let i = 0; i < items.length; i++) {
      if (!existingIds.has(items[i]?.id)) {
        itemsToRestore.push({ item: items[i], index: indices[i] })
      }
    }

    if (itemsToRestore.length === 0) return

    // Build the final array by merging current items and restored items
    // Strategy: Build position by position - for each position, decide if it should be
    // a restored item (at its original index) or a current item (accounting for shifts)

    // Create a map of restored items by their original index for O(1) lookup
    const restoredByIndex = new Map<number, any>()
    for (const { item, index } of itemsToRestore) {
      restoredByIndex.set(index, item)
    }

    // Find the maximum position we need to consider
    const maxRestoredIndex = itemsToRestore.length > 0
      ? Math.max(...itemsToRestore.map(({ index }) => index))
      : -1
    const maxPosition = Math.max(current.length - 1, maxRestoredIndex)

    // Build the final array position by position
    // Key insight: Current array items are in "shifted" positions (missing the removed items).
    // When we restore items at their original positions, current items naturally shift back.
    // We can build the final array by iterating positions and using items sequentially.
    const newItems: any[] = []
    let currentArrayIndex = 0 // Track which current item we should use next

    // Iterate through all positions up to the maximum we need
    for (let position = 0; position <= maxPosition; position++) {
      // If there's a restored item that belongs at this position, use it
      if (restoredByIndex.has(position)) {
        newItems.push(restoredByIndex.get(position)!)
      } else {
        // Otherwise, this position should be filled by the next current item
        // Since current array is missing restored items, items are shifted left.
        // By using them sequentially, they naturally end up in the correct positions.
        if (currentArrayIndex < current.length) {
          newItems.push(current[currentArrayIndex])
          currentArrayIndex++
        }
      }
    }

    // Add any remaining current items that come after the last restored position
    // (These are items that were originally after maxRestoredIndex)
    while (currentArrayIndex < current.length) {
      newItems.push(current[currentArrayIndex])
      currentArrayIndex++
    }

    // Update the masonry array
    masonry.value = newItems
    await nextTick()

    // Trigger layout recalculation (same pattern as removeMany)
    if (!useSwipeMode.value) {
      // Wait for DOM update, then calculate layout for FLIP animation
      await nextTick()
      refreshLayout(newItems)
    }
  } finally {
    isProcessingItems = false
  }
}

async function removeAll() {
  // Clear all items
  masonry.value = []
}
// ===== END INLINED: useMasonryItems =====

// ===== INLINED: useSwipeMode =====
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
// ===== END INLINED: useSwipeMode =====

// setFixedDimensions wrapper function to maintain API compatibility and handle wrapper restoration
function setFixedDimensions(dimensions: { width?: number; height?: number } | null) {
  setFixedDimensionsLayout(dimensions, updateScrollProgress)
  if (!dimensions && wrapper.value) {
    // When clearing fixed dimensions, restore from wrapper
    containerWidth.value = wrapper.value.clientWidth
    containerHeight.value = wrapper.value.clientHeight
  }
}

defineExpose({
  // Cancels any ongoing load operations (page loads, backfills, etc.)
  cancelLoad,
  // Opaque caller context passed through to getPage(page, context). Useful for including filters, service selection, tabId, etc.
  context,
  // Container height (wrapper element) in pixels
  containerHeight,
  // Container width (wrapper element) in pixels
  containerWidth,
  // Current Tailwind breakpoint name (base, sm, md, lg, xl, 2xl) based on containerWidth
  currentBreakpoint,
  // Current page number or cursor being displayed
  currentPage,
  // Completely destroys the component, clearing all state and resetting to initial state
  destroy,
  // Boolean indicating if the end of the list has been reached (no more pages to load)
  hasReachedEnd,
  // Initializes the component with items, page, and next page cursor. Use this for manual init mode.
  initialize,
  // Boolean indicating if the component has been initialized (first content has loaded)
  isInitialized,
  // Boolean indicating if a page load or backfill operation is currently in progress
  isLoading,
  // Error object if the last load operation failed, null otherwise
  loadError,
  // Loads the next page of items asynchronously
  loadNext,
  // Loads a specific page number or cursor asynchronously
  loadPage,
  // Array tracking pagination history (pages/cursors that have been loaded)
  paginationHistory,
  // Refreshes the current page by clearing items and reloading from the current page
  refreshCurrentPage,
  // Recalculates the layout positions for all items. Call this after manually modifying items.
  refreshLayout,
  // Removes a single item from the masonry
  remove,
  // Removes all items from the masonry
  removeAll,
  // Clears all items and pagination history (useful when applying filters)
  clear,
  // Removes multiple items from the masonry in a single operation
  removeMany,
  // Resets the component to initial state (clears items, resets pagination, scrolls to top)
  reset,
  // Restores a single item at its original index (useful for undo operations)
  restore,
  // Restores multiple items at their original indices (useful for undo operations)
  restoreMany,
  // Scrolls the container to a specific position
  scrollTo,
  // Scrolls the container to the top
  scrollToTop,
  // Sets the opaque caller context (alternative to v-model:context)
  setContext,
  // Sets fixed dimensions for the container, overriding ResizeObserver. Pass null to restore automatic sizing.
  setFixedDimensions,
  // Computed property returning the total number of items currently in the masonry
  totalItems: computed(() => (masonry.value as any[]).length)
})

// Layout functions are now in useMasonryLayout composable
// Removed: calculateHeight, refreshLayout - now from layoutComposable

// Swipe mode state and handlers are now inlined above

// Helper functions for swipe mode percentage calculations
function getSwipeItemTop(index: string | number): string {
  const length = masonryLength.value
  const numIndex = typeof index === 'string' ? parseInt(index, 10) : index
  return length > 0 ? `${numIndex * (100 / length)}%` : '0%'
}

function getSwipeItemHeight(): string {
  const length = masonryLength.value
  return length > 0 ? `${100 / length}%` : '0%'
}

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

// removeAll is now in useMasonryItems composable

// onResize function
function onResize() {
  onResizeLayout()
  if (container.value) {
    viewportTop.value = container.value.scrollTop
    viewportHeight.value = container.value.clientHeight
  }
}

// maybeBackfillToTarget, cancelLoad are now in useMasonryPagination composable
// Removed: backfillActive, cancelRequested - now internal to pagination composable

function clear() {
  // Clear all items and pagination history (useful when applying filters)
  masonry.value = []
  paginationHistory.value = []
}

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
// handleWindowResize is now inlined in swipe mode section above

async function initialize(items: any[], page: any, next: any) {
  currentPage.value = page  // Track the initial current page
  paginationHistory.value = [page]
  if (next !== null && next !== undefined) {
    paginationHistory.value.push(next)
  }
  // Only treat explicit null as end-of-list. Undefined means "unknown".
  hasReachedEnd.value = next === null
  // Diagnostics: check incoming initial items
  checkItemDimensions(items as any[], 'initialize')

  // If masonry is empty, replace items; otherwise add them
  const currentItems = masonry.value as any[]
  const newItems = currentItems.length === 0 ? items : [...currentItems, ...items]

  // Set items first (this updates the v-model)
  masonry.value = newItems
  await nextTick()

  if (useSwipeMode.value) {
    // In swipe mode, just set items without layout calculation
    // Reset swipe index if we're at the start
    if (currentSwipeIndex.value === 0 && masonry.value.length > 0) {
      swipeOffset.value = 0
    }
  } else {
    // Wait for DOM update, then calculate layout for FLIP animation
    await nextTick()
    refreshLayout(newItems)

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

  // Mark as initialized when items are provided
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

// Watch for when items are first loaded (for init='manual' when items are loaded via initialize)
watch(
  () => masonry.value.length,
  (newLength, oldLength) => {
    // For manual mode, mark as initialized when items first appear
    // This handles the case where items are loaded via initialize after mount
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

    // Only set paginationHistory in onMounted if:
    // 1. init is 'auto' (we need it for auto-loading)
    // 2. paginationHistory is empty (hasn't been set by initialize yet)
    // If init is 'manual', initialize() will set it, so don't overwrite
    if (props.init === 'auto' && paginationHistory.value.length === 0) {
      paginationHistory.value = [initialPage]
    }

    if (props.init === 'auto') {
      // Auto mode: automatically call loadPage on mount
      // Set initialized BEFORE loading so the masonry container renders
      // This allows refreshLayout to access the container element for measurements
      isInitialized.value = true
      await nextTick() // Ensure container is rendered before loading

      try {
        await loadPage(initialPage)
      } catch (error) {
        // Error is already handled by loadPage via loadError
        // Continue - component is already initialized
      }
    }
    // Manual mode: do nothing, user will manually call restore()

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
    // isInitialized is already set to true before loadPage for 'auto' mode
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
        height: `${masonryLength * 100}%`
      }">
        <div v-for="(item, index) in masonry" :key="`${item.page}-${item.id}`" class="absolute top-0 left-0 w-full"
          :style="{
            top: getSwipeItemTop(index),
            height: getSwipeItemHeight()
          }">
          <div class="w-full h-full flex items-center justify-center p-4">
            <div class="w-full h-full max-w-full max-h-full relative">
              <slot :item="item" :remove="remove" :index="item.originalIndex ?? index">
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
          <div v-for="(item, index) in visibleMasonry" :key="`${item.page}-${item.id}`" class="absolute masonry-item"
            v-bind="getItemAttributes(item, index)">
            <!-- Use default slot if provided, otherwise use MasonryItem -->
            <slot :item="item" :remove="remove" :index="item.originalIndex ?? index">
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
