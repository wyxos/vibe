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
  const shortestColumn = Math.min(...columnHeights)
  const triggerPoint = shortestColumn - 300 // Same threshold as in scroll handler
  
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
  loadNext
})

defineExpose({
  isLoading,
  refreshLayout,
  containerHeight,
  onRemove,
  loadNext,
  loadPage,
  reset
})

function calculateHeight(content) {
  containerHeight.value = calculateContainerHeight(content)
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

function onRemove(item) {
  refreshLayout(masonry.value.filter(i => i.id !== item.id))
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
  <div class="overflow-auto w-full flex-1" ref="container">
    <div class="relative" :style="{height: `${containerHeight}px`}">
      <transition-group :css="false" @enter="onEnter" @before-enter="onBeforeEnter"
                        @leave="onLeave"
                        @before-leave="onBeforeLeave">
        <div v-for="item in masonry" :key="`${item.page}-${item.id}`"
             class="absolute transition-[top,left,opacity] duration-500 ease-in-out"
             v-bind="getItemAttributes(item)">
          <slot name="item" v-bind="{item, onRemove}">
            <img :src="item.src" class="w-full"/>
            <button class="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer"
                    @click="onRemove(item)">
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
