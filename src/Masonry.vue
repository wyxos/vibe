<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
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
  maxItems: {
    type: Number,
    default: 100
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
  }
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
  'retry:stop'
])

const masonry = computed<any>({
  get: () => props.items,
  set: (val) => emits('update:items', val)
})

const columns = ref<number>(7)
const container = ref<HTMLElement | null>(null)
const paginationHistory = ref<any[]>([])
const nextPage = ref<number | null>(null)
const isLoading = ref<boolean>(false)
const containerHeight = ref<number>(0)

// Scroll progress tracking
const scrollProgress = ref<{ distanceToTrigger: number; isNearTrigger: boolean }>({
  distanceToTrigger: 0,
  isNearTrigger: false
})

const updateScrollProgress = () => {
  if (!container.value) return

  const {scrollTop, clientHeight} = container.value
  const visibleBottom = scrollTop + clientHeight

  const columnHeights = calculateColumnHeights(masonry.value as any, columns.value)
  const longestColumn = Math.max(...columnHeights)
  const triggerPoint = longestColumn + 300

  const distanceToTrigger = Math.max(0, triggerPoint - visibleBottom)
  const isNearTrigger = distanceToTrigger <= 100

  scrollProgress.value = {
    distanceToTrigger: Math.round(distanceToTrigger),
    isNearTrigger
  }
}

// Setup composables
const {onEnter, onBeforeEnter, onBeforeLeave, onLeave} = useMasonryTransitions(masonry)

const {handleScroll} = useMasonryScroll({
  container,
  masonry: masonry as any,
  columns,
  containerHeight,
  isLoading,
  maxItems: props.maxItems,
  pageSize: props.pageSize,
  refreshLayout,
  setItemsRaw: (items: any[]) => {
    masonry.value = items
  },
  loadNext,
  leaveEstimateMs: props.leaveDurationMs
})

defineExpose({
  isLoading,
  refreshLayout,
  containerHeight,
  remove,
  removeMany,
  loadNext,
  loadPage,
  reset,
  init,
  paginationHistory
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
  const content = calculateLayout(items as any, container.value as HTMLElement, columns.value, layout.value as any)
  calculateHeight(content as any)
  masonry.value = content
}

function waitWithProgress(totalMs: number, onTick: (remaining: number, total: number) => void) {
  return new Promise<void>((resolve) => {
    const total = Math.max(0, totalMs | 0)
    const start = Date.now()
    onTick(total, total)
    const id = setInterval(() => {
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
  isLoading.value = true
  try {
    const baseline = (masonry.value as any[]).length
    const response = await getContent(page)
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
  isLoading.value = true
  try {
    const baseline = (masonry.value as any[]).length
    const currentPage = paginationHistory.value[paginationHistory.value.length - 1]
    const response = await getContent(currentPage)
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

async function remove(item: any) {
  const next = (masonry.value as any[]).filter(i => i.id !== item.id)
  masonry.value = next
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      refreshLayout(next)
    })
  })
}

async function removeMany(items: any[]) {
  if (!items || items.length === 0) return
  const ids = new Set(items.map(i => i.id))
  const next = (masonry.value as any[]).filter(i => !ids.has(i.id))
  masonry.value = next
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      refreshLayout(next)
    })
  })
}

function onResize() {
  columns.value = getColumnCount(layout.value as any)
  refreshLayout(masonry.value as any)
}

let backfillActive = false

async function maybeBackfillToTarget(baselineCount: number) {
  if (!props.backfillEnabled) return
  if (backfillActive) return

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
      paginationHistory.value[paginationHistory.value.length - 1] != null
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

      const currentPage = paginationHistory.value[paginationHistory.value.length - 1]
      try {
        isLoading.value = true
        const response = await getContent(currentPage)
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

function reset() {
  if (container.value) {
    container.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  masonry.value = []
  containerHeight.value = 0
  paginationHistory.value = [props.loadAtPage]

  scrollProgress.value = {
    distanceToTrigger: 0,
    isNearTrigger: false
  }
}

const debouncedScrollHandler = debounce(() => {
  handleScroll()
  updateScrollProgress()
}, 200)

const debouncedResizeHandler = debounce(onResize, 200)

function init(items: any[], page: any, next: any) {
  paginationHistory.value = [page]
  paginationHistory.value.push(next)
  refreshLayout([...(masonry.value as any[]), ...items])
  updateScrollProgress()
}

onMounted(async () => {
  try {
    columns.value = getColumnCount(layout.value as any)

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

  container.value?.addEventListener('scroll', debouncedScrollHandler)
  window.addEventListener('resize', debouncedResizeHandler)
})

onUnmounted(() => {
  container.value?.removeEventListener('scroll', debouncedScrollHandler)
  window.removeEventListener('resize', debouncedResizeHandler)
})
</script>

<template>
  <div class="overflow-auto w-full flex-1 masonry-container" ref="container">
    <div class="relative"
         :style="{height: `${containerHeight}px`, '--masonry-duration': `${transitionDurationMs}ms`, '--masonry-leave-duration': `${leaveDurationMs}ms`, '--masonry-ease': transitionEasing}">
      <transition-group name="masonry" :css="false" @enter="onEnter" @before-enter="onBeforeEnter"
                        @leave="onLeave"
                        @before-leave="onBeforeLeave">
        <div v-for="(item, i) in masonry" :key="`${item.page}-${item.id}`"
             class="absolute masonry-item"
             v-bind="getItemAttributes(item, i)">
          <slot name="item" v-bind="{item, remove}">
            <img :src="item.src" class="w-full"/>
            <button class="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer"
                    @click="remove(item)">
              <i class="fas fa-trash"></i>
            </button>
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
  .masonry-item,
  .masonry-move {
    transition-duration: 1ms !important;
  }
}
</style>
