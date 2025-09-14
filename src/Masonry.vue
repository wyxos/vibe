<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref} from "vue";
import calculateLayout from "./calculateLayout.js";
import { debounce } from 'lodash-es'
import {
  getColumnCount,
  calculateContainerHeight,
  getItemAttributes,
  calculateColumnHeights
} from './masonryUtils.js'
import { useMasonryTransitions } from './useMasonryTransitions.js'
import { useMasonryScroll } from './useMasonryScroll.js'

const props = defineProps({
  getNextPage: {
    type: Function,
    default: () => {
    }
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
    validator: v => ['page', 'cursor'].includes(v)
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
  transitionDurationMs: {
    type: Number,
    default: 450
  },
  transitionEasing: {
    type: String,
    default: 'cubic-bezier(.22,.61,.36,1)'
  }
})

const defaultLayout = {
  sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gutterX: 10,
  gutterY: 10,
  header: 0,
  footer: 0,
  paddingLeft: 0,
  paddingRight: 0
}

const layout = computed(() => ({
  ...defaultLayout,
  ...props.layout,
  sizes: {
    ...defaultLayout.sizes,
    ...(props.layout?.sizes || {})
  }
}))

const emits = defineEmits(['update:items'])

const masonry = computed({
  get: () => props.items,
  set: (val) => emits('update:items', val)
})

const columns = ref(7)

const container = ref(null)

const paginationHistory = ref([])

const nextPage = ref(null)

const isLoading = ref(false)

const containerHeight = ref(0)

// Scroll progress tracking
const scrollProgress = ref({
  distanceToTrigger: 0,
  isNearTrigger: false
})

const updateScrollProgress = () => {
  if (!container.value) return

  const { scrollTop, clientHeight } = container.value
  const visibleBottom = scrollTop + clientHeight

  const columnHeights = calculateColumnHeights(masonry.value, columns.value)
  // Use longest column to match the trigger logic in useMasonryScroll.js
  const longestColumn = Math.max(...columnHeights)
  const triggerPoint = longestColumn + 300 // Match: longestColumn + 300 < visibleBottom

  const distanceToTrigger = Math.max(0, triggerPoint - visibleBottom)
  const isNearTrigger = distanceToTrigger <= 100

  scrollProgress.value = {
    distanceToTrigger: Math.round(distanceToTrigger),
    isNearTrigger
  }
}

// Setup composables
const { onEnter, onBeforeEnter, onBeforeLeave, onLeave } = useMasonryTransitions(masonry)

const { handleScroll } = useMasonryScroll({
  container,
  masonry,
  columns,
  containerHeight,
  isLoading,
  maxItems: props.maxItems,
  pageSize: props.pageSize,
  refreshLayout,
  // Allow scroll composable to set items without recalculating layout (phase-1 cleanup)
  setItemsRaw: (items) => { masonry.value = items },
  loadNext
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
  paginationHistory
})

function calculateHeight(content) {
  const newHeight = calculateContainerHeight(content)
  let floor = 0
  if (container.value) {
    const { scrollTop, clientHeight } = container.value
    // Ensure the container never shrinks below the visible viewport bottom + small buffer
    floor = scrollTop + clientHeight + 100
  }
  containerHeight.value = Math.max(newHeight, floor)
}

function refreshLayout(items) {
  const content = calculateLayout(items, container.value, columns.value, layout.value);

  calculateHeight(content)

  masonry.value = content
}

async function getContent(page) {
  try {
    const response = await props.getNextPage(page)
    refreshLayout([...masonry.value, ...response.items])
    return response
  } catch (error) {
    console.error('Error in getContent:', error)
    throw error
  }
}

async function loadPage(page) {
  if (isLoading.value) return // Prevent concurrent loading

  isLoading.value = true

  try {
    const response = await getContent(page)
    paginationHistory.value.push(response.nextPage)
    return response
  } catch (error) {
    console.error('Error loading page:', error)
    throw error
  } finally {
    isLoading.value = false
  }
}

async function loadNext() {
  if (isLoading.value) return // Prevent concurrent loading

  isLoading.value = true

  try {
    const currentPage = paginationHistory.value[paginationHistory.value.length - 1]
    const response = await getContent(currentPage)
    paginationHistory.value.push(response.nextPage)
    return response
  } catch (error) {
    console.error('Error loading next page:', error)
    throw error
  } finally {
    isLoading.value = false
  }
}

function remove(item) {
  refreshLayout(masonry.value.filter(i => i.id !== item.id))
}

function removeMany(items) {
  if (!items || items.length === 0) return
  const ids = new Set(items.map(i => i.id))
  const next = masonry.value.filter(i => !ids.has(i.id))
  refreshLayout(next)
}

function onResize() {
  columns.value = getColumnCount(layout.value)
  refreshLayout(masonry.value)
}

function reset() {
  // Scroll back to top first (while items still exist to scroll through)
  if (container.value) {
    container.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Clear all items
  masonry.value = []

  // Reset container height
  containerHeight.value = 0

  // Reset pagination history to initial state
  paginationHistory.value = [props.loadAtPage]

  // Reset scroll progress
  scrollProgress.value = {
    distanceToTrigger: 0,
    isNearTrigger: false
  }
}

// Create debounced functions with stable references
const debouncedScrollHandler = debounce(() => {
  handleScroll()
  updateScrollProgress()
}, 200)

const debouncedResizeHandler = debounce(onResize, 200)

onMounted(async () => {
  try {
    columns.value = getColumnCount(layout.value)

    // For cursor-based pagination, loadAtPage can be null for the first request
    const initialPage = props.loadAtPage
    paginationHistory.value = [initialPage]

    // Skip initial load if skipInitialLoad prop is true
    if (!props.skipInitialLoad) {
      await loadPage(paginationHistory.value[0]) // loadPage manages its own loading state
    } else {
      await nextTick()
      // Just refresh the layout with any existing items
      refreshLayout(masonry.value)
    }

    updateScrollProgress()

  } catch (error) {
    console.error('Error during component initialization:', error)
    // Ensure loading state is reset if error occurs during initialization
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
  <div class="overflow-auto w-full flex-1 masonry-container" ref="container"
>    <div class="relative" :style="{height: `${containerHeight}px`, '--masonry-duration': `${transitionDurationMs}ms`, '--masonry-ease': transitionEasing}">
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
/* Prevent browser scroll anchoring from adjusting scroll on content changes */
.masonry-container {
  overflow-anchor: none;
}

/* Items animate transform only for smooth, compositor-driven motion */
.masonry-item {
  will-change: transform, opacity;
  transition: transform var(--masonry-duration, 450ms) var(--masonry-ease, cubic-bezier(.22,.61,.36,1)),
              opacity 200ms linear;
  backface-visibility: hidden;
}

/* TransitionGroup move-class for FLIP reordering */
.masonry-move {
  transition: transform var(--masonry-duration, 450ms) var(--masonry-ease, cubic-bezier(.22,.61,.36,1));
}
</style>
