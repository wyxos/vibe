<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref} from "vue";
import calculateLayout from "./calculateLayout.js";
import { debounce } from 'lodash-es'

const props = defineProps({
  getNextPage: {
    type: Function,
    default: () => {
    }
  },
  loadAtPage: {
    type: Number,
    default: 1
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
  const heights = new Array(columns.value).fill(0)
  for (let i = 0; i < masonry.value.length; i++) {
    const item = masonry.value[i]
    const col = i % columns.value
    heights[col] = Math.max(heights[col], item.top + item.columnHeight)
  }
  return heights
})

defineExpose({
  isLoading,
  refreshLayout,
  containerHeight,
  onRemove,
})

async function onScroll() {
  const {scrollTop, clientHeight} = container.value
  const visibleBottom = scrollTop + clientHeight

  const whitespaceVisible = columnHeights.value.some(height => height + 300 < visibleBottom - 1)

  if (whitespaceVisible && !isLoading.value) {
    isLoading.value = true

    if (paginationHistory.value > 3) {
      // get first item
      const firstItem = masonry.value[0]

      // get page number
      const page = firstItem.page

      // find all item with this page
      const removedItems = masonry.value.filter(i => i.page !== page)

      refreshLayout(removedItems)

      await nextTick()

      const lowestColumnIndex = columnHeights.value.indexOf(Math.min(...columnHeights.value))

      // find the last item in that column
      const lastItemInColumn = masonry.value.filter((_, index) => index % columns.value === lowestColumnIndex).pop()
      const lastItemInColumnTop = lastItemInColumn.top + lastItemInColumn.columnHeight
      const lastItemInColumnBottom = lastItemInColumnTop + lastItemInColumn.columnHeight
      const containerTop = container.value.scrollTop
      const containerBottom = containerTop + container.value.clientHeight
      const itemInView = lastItemInColumnTop >= containerTop && lastItemInColumnBottom <= containerBottom
      if (!itemInView) {
        container.value.scrollTo({
          top: lastItemInColumnTop - 10,
          behavior: 'smooth'
        })
      }
    }

    await loadNext()

    await nextTick()

    isLoading.value = false
  }
}

function getColumnCount() {
  const width = window.innerWidth

  const sizes = layout.value.sizes

  if (width >= 1536 && sizes['2xl']) return sizes['2xl']
  if (width >= 1280 && sizes.xl) return sizes.xl
  if (width >= 1024 && sizes.lg) return sizes.lg
  if (width >= 768 && sizes.md) return sizes.md
  if (width >= 640 && sizes.sm) return sizes.sm
  return sizes.base
}

function calculateHeight(content) {
  containerHeight.value = content.reduce((acc, item) => {
    return Math.max(acc, item.top + item.columnHeight)
  }, 0)
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

async function loadNext() {
  const response = await getContent(paginationHistory.value[paginationHistory.value.length - 1])
  paginationHistory.value.push(response.nextPage)
}

const getItemStyle = (item) => {
  return {
    top: `${item.top}px`,
    left: `${item.left}px`,
    width: `${item.columnWidth}px`,
    height: `${item.columnHeight}px`
  }
}

function onRemove(item) {
  refreshLayout(masonry.value.filter(i => i.id !== item.id))
}

function onEnter(el, done) {
  // set top to data-top
  const top = el.dataset.top
  requestAnimationFrame(() => {
    el.style.top = `${top}px`
    done()
  })
}

function onBeforeEnter(el) {
  // set top to last item + 500
  const lastItem = masonry.value[masonry.value.length - 1]
  if (lastItem) {
    const lastTop = lastItem.top + lastItem.columnHeight + 10
    el.style.top = `${lastTop}px`
  } else {
    el.style.top = '0px'
  }
}

function onBeforeLeave(el) {
  // Ensure it's at its current position before animating
  el.style.transition = 'none'
  el.style.top = `${el.offsetTop}px`
  void el.offsetWidth // force reflow to flush style
  el.style.transition = '' // allow transition to apply again
}

function onLeave(el, done) {
  el.style.top = '-600px'
  el.style.opacity = '0'
  el.addEventListener('transitionend', done)
}

function itemAttributes(item) {
  return {
    style: getItemStyle(item),
    'data-top': item.top,
    'data-id': `${item.page}-${item.id}`,
  }
}

function onResize() {
  columns.value = getColumnCount()
  refreshLayout(masonry.value)
}

onMounted(async () => {
  isLoading.value = true

  columns.value = getColumnCount()

  paginationHistory.value = [props.loadAtPage]

  const response = await getContent(paginationHistory.value[0])

  paginationHistory.value.push(response.nextPage)

  isLoading.value = false

  container.value?.addEventListener('scroll', debounce(onScroll, 200));

  window.addEventListener('resize', debounce(onResize, 200));
})

onUnmounted(() => {
  container.value?.removeEventListener('scroll', debounce(onScroll, 200));

  window.removeEventListener('resize', debounce(onResize, 200));
})
</script>

<template>
  <div class="overflow-auto bg-blue-500 w-full flex-1" ref="container">
    <div class="relative" :style="{height: `${containerHeight}px`}">
      <transition-group :css="false" @enter="onEnter" @before-enter="onBeforeEnter"
                        @leave="onLeave"
                        @before-leave="onBeforeLeave">
        <div v-for="item in masonry" :key="`${item.page}-${item.id}`"
             class="bg-slate-200 absolute transition-[top,left,opacity] duration-500 ease-in-out"
             v-bind="itemAttributes(item)">
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
