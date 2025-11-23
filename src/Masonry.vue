<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import calculateLayout from "./calculateLayout";
import { debounce } from 'lodash-es'
import {
  getColumnCount,
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
    default: () => {}
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
})

const defaultLayout = {
  sizes: {base: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6},
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

const emits = defineEmits([
  'update:items',
  'backfill:start',
  'backfill:tick',
  'backfill:stop',
  'retry:start',
  'retry:tick',
  'retry:stop',
  'remove-all:complete'
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
const containerHeight = ref<number>(0)

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

  const {scrollTop, clientHeight} = container.value
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
const {onEnter, onBeforeEnter, onBeforeLeave, onLeave} = useMasonryTransitions(masonry, { leaveDurationMs: props.leaveDurationMs })

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

const {handleScroll} = useMasonryScroll({
  container,
  masonry: masonry as any,
  columns,
  containerHeight,
  isLoading,
  pageSize: props.pageSize,
  refreshLayout,
  setItemsRaw: (items: any[]) => {
    masonry.value = items
  },
  loadNext,
  loadThresholdPx: props.loadThresholdPx
})

defineExpose({
  isLoading,
  refreshLayout,
  containerHeight,
  remove,
  removeMany,
  removeAll,
  loadNext,
  loadPage,
  refreshCurrentPage,
  reset,
  init,
  paginationHistory,
  cancelLoad,
  scrollToTop,
  totalItems: computed(() => (masonry.value as any[]).length)
})

function calculateHeight(content: any[]) {
  const newHeight = calculateContainerHeight(content as any)
  let floor = 0
  if (container.value) {
    const {scrollTop, clientHeight} = container.value
    floor = scrollTop + clientHeight + 100
  }
  containerHeight.value = Math.max(newHeight, floor)
}

function refreshLayout(items: any[]) {
  if (!container.value) return
  // Developer diagnostics: warn when dimensions are invalid
  checkItemDimensions(items as any[], 'refreshLayout')
  // Preserve original index before layout reordering
  const itemsWithIndex = items.map((item, index) => ({
    ...item,
    originalIndex: item.originalIndex ?? index
  }))
  const content = calculateLayout(itemsWithIndex as any, container.value as HTMLElement, columns.value, layout.value as any)
  calculateHeight(content as any)
  masonry.value = content
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
        emits('retry:stop', {attempt, success: true})
      }
      return res
    } catch (err) {
      attempt++
      if (attempt > max) {
        emits('retry:stop', {attempt: attempt - 1, success: false})
        throw err
      }
      emits('retry:start', {attempt, max, totalMs: delay})
      await waitWithProgress(delay, (remaining, total) => {
        emits('retry:tick', {attempt, remainingMs: remaining, totalMs: total})
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
  try {
    const baseline = (masonry.value as any[]).length
    if (cancelRequested.value) return
    const response = await getContent(page)
    if (cancelRequested.value) return
    currentPage.value = page  // Track the current page
    paginationHistory.value.push(response.nextPage)
    await maybeBackfillToTarget(baseline)
    return response
  } catch (error) {
    console.error('Error loading page:', error)
    throw error
  } finally {
    isLoading.value = false
  }
}

async function loadNext() {
  if (isLoading.value) return
  // Starting a new load should clear any previous cancel request
  cancelRequested.value = false
  isLoading.value = true
  try {
    const baseline = (masonry.value as any[]).length
    if (cancelRequested.value) return
    const nextPageToLoad = paginationHistory.value[paginationHistory.value.length - 1]
    const response = await getContent(nextPageToLoad)
    if (cancelRequested.value) return
    currentPage.value = nextPageToLoad  // Track the current page
    paginationHistory.value.push(response.nextPage)
    await maybeBackfillToTarget(baseline)
    return response
  } catch (error) {
    console.error('Error loading next page:', error)
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
  console.log('[Masonry] refreshCurrentPage called, isLoading:', isLoading.value, 'currentPage:', currentPage.value)
  if (isLoading.value) return
  cancelRequested.value = false
  isLoading.value = true
  
  try {
    // Use the tracked current page
    const pageToRefresh = currentPage.value
    console.log('[Masonry] pageToRefresh:', pageToRefresh)
    
    if (pageToRefresh == null) {
      console.warn('[Masonry] No current page to refresh - currentPage:', currentPage.value, 'paginationHistory:', paginationHistory.value)
      return
    }
    
    // Clear existing items
    masonry.value = []
    containerHeight.value = 0
    
    // Reset pagination history to just the current page
    paginationHistory.value = [pageToRefresh]
    
    await nextTick()
    
    // Reload the current page
    const response = await getContent(pageToRefresh)
    if (cancelRequested.value) return
    
    // Update pagination state
    currentPage.value = pageToRefresh
    paginationHistory.value.push(response.nextPage)
    
    // Optionally backfill if needed
    const baseline = (masonry.value as any[]).length
    await maybeBackfillToTarget(baseline)
    
    return response
  } catch (error) {
    console.error('[Masonry] Error refreshing current page:', error)
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
  console.log('[Masonry] remove - next.length:', next.length, 'paginationHistory.length:', paginationHistory.value.length)
  if (next.length === 0 && paginationHistory.value.length > 0) {
    if (props.autoRefreshOnEmpty) {
      console.log('[Masonry] All items removed, calling refreshCurrentPage')
      await refreshCurrentPage()
    } else {
      console.log('[Masonry] All items removed, calling loadNext and forcing backfill')
      try {
        await loadNext()
        // Force backfill from 0 to ensure viewport is filled
        // Pass baseline=0 and force=true to trigger backfill even if backfillEnabled was temporarily disabled
        await maybeBackfillToTarget(0, true)
      } catch {}
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
      } catch {}
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
  columns.value = getColumnCount(layout.value as any)
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

  const targetCount = (baselineCount || 0) + (props.pageSize || 0)
  if (!props.pageSize || props.pageSize <= 0) return

  const lastNext = paginationHistory.value[paginationHistory.value.length - 1]
  if (lastNext == null) return

  if ((masonry.value as any[]).length >= targetCount) return

  backfillActive = true
  try {
    let calls = 0
    emits('backfill:start', {target: targetCount, fetched: (masonry.value as any[]).length, calls})

    while (
      (masonry.value as any[]).length < targetCount &&
      calls < props.backfillMaxCalls &&
      paginationHistory.value[paginationHistory.value.length - 1] != null &&
      !cancelRequested.value
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
      try {
        isLoading.value = true
        const response = await getContent(currentPage)
        if (cancelRequested.value) break
        paginationHistory.value.push(response.nextPage)
      } finally {
        isLoading.value = false
      }

      calls++
    }

    emits('backfill:stop', {fetched: (masonry.value as any[]).length, calls})
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

  scrollProgress.value = {
    distanceToTrigger: 0,
    isNearTrigger: false
  }
}

const debouncedScrollHandler = debounce(async () => {
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

function init(items: any[], page: any, next: any) {
  currentPage.value = page  // Track the initial current page
  paginationHistory.value = [page]
  paginationHistory.value.push(next)
  // Diagnostics: check incoming initial items
  checkItemDimensions(items as any[], 'init')
  refreshLayout([...(masonry.value as any[]), ...items])
  updateScrollProgress()
}

// Watch for layout changes and update columns + refresh layout dynamically
watch(
  layout,
  () => {
    if (container.value) {
      columns.value = getColumnCount(layout.value as any)
      refreshLayout(masonry.value as any)
    }
  },
  { deep: true }
)

onMounted(async () => {
  try {
    columns.value = getColumnCount(layout.value as any)
    if (container.value) {
      viewportTop.value = container.value.scrollTop
      viewportHeight.value = container.value.clientHeight
    }

    const initialPage = props.loadAtPage as any
    paginationHistory.value = [initialPage]

    if (!props.skipInitialLoad) {
      await loadPage(paginationHistory.value[0] as any)
    }

    updateScrollProgress()

  } catch (error) {
    console.error('Error during component initialization:', error)
    isLoading.value = false
  }

  container.value?.addEventListener('scroll', debouncedScrollHandler, { passive: true })
  window.addEventListener('resize', debouncedResizeHandler)
})

onUnmounted(() => {
  container.value?.removeEventListener('scroll', debouncedScrollHandler)
  window.removeEventListener('resize', debouncedResizeHandler)
})
</script>

<template>
  <div class="overflow-auto w-full flex-1 masonry-container" :class="{ 'force-motion': props.forceMotion }" ref="container">
    <div class="relative"
         :style="{height: `${containerHeight}px`, '--masonry-duration': `${transitionDurationMs}ms`, '--masonry-leave-duration': `${leaveDurationMs}ms`, '--masonry-ease': transitionEasing}">
      <transition-group name="masonry" :css="false" @enter="enter" @before-enter="beforeEnter"
                        @leave="leave"
                        @before-leave="beforeLeave">
        <div v-for="(item, i) in visibleMasonry" :key="`${item.page}-${item.id}`"
             class="absolute masonry-item"
             v-bind="getItemAttributes(item, i)"
             :style="{ paddingTop: `${layout.header}px`, paddingBottom: `${layout.footer}px` }">
          <!-- Use default slot if provided, otherwise use MasonryItem -->
          <slot :item="item" :remove="remove">
            <MasonryItem :item="item" :remove="remove" />
          </slot>
        </div>
      </transition-group>

      <!-- Scroll Progress Badge -->
      <div v-if="containerHeight > 0"
           class="fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300"
           :class="{'opacity-50 hover:opacity-100': !scrollProgress.isNearTrigger, 'opacity-100': scrollProgress.isNearTrigger}">
        <span>{{ masonry.length }} items</span>
        <span class="mx-2">|</span>
        <span>{{ scrollProgress.distanceToTrigger }}px to load</span>
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
