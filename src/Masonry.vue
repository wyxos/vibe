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

const columnHeights = computed(() => {
  return calculateColumnHeights(masonry.value, columns.value)
})

// Setup composables
const { onEnter, onBeforeEnter, onBeforeLeave, onLeave } = useMasonryTransitions(masonry)

const { handleScroll } = useMasonryScroll({
  container,
  masonry,
  columns,
  containerHeight,
  isLoading,
  maxItems: props.maxItems,
  refreshLayout,
  loadNext
})

defineExpose({
  isLoading,
  refreshLayout,
  containerHeight,
  onRemove,
  loadNext,
  loadPage
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
  const response = await props.getNextPage(page)

  refreshLayout([...masonry.value, ...response.items])

  return response
}

async function loadPage(page) {
  const response = await getContent(page)
  paginationHistory.value.push(response.nextPage)
  return response
}

async function loadNext() {
  const currentPage = paginationHistory.value[paginationHistory.value.length - 1]
  return await loadPage(currentPage)
}

function onRemove(item) {
  refreshLayout(masonry.value.filter(i => i.id !== item.id))
}

function onResize() {
  columns.value = getColumnCount(layout.value)
  refreshLayout(masonry.value)
}

onMounted(async () => {
  isLoading.value = true

  columns.value = getColumnCount(layout.value)

  // For cursor-based pagination, loadAtPage can be null for the first request
  const initialPage = props.loadAtPage
  paginationHistory.value = [initialPage]

  // Skip initial load if skipInitialLoad prop is true
  if (!props.skipInitialLoad) {
    await loadPage(paginationHistory.value[0])
  } else {
    await nextTick()
    // Just refresh the layout with any existing items
    refreshLayout(masonry.value)
  }

  isLoading.value = false

  container.value?.addEventListener('scroll', debounce(handleScroll, 200));

  window.addEventListener('resize', debounce(onResize, 200));
})

onUnmounted(() => {
  container.value?.removeEventListener('scroll', debounce(handleScroll, 200));

  window.removeEventListener('resize', debounce(onResize, 200));
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
    </div>
  </div>
</template>
