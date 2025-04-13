<script setup>
import {computed, nextTick, onMounted, ref} from "vue";
import calculateLayout from "./calculateLayout.js";
import {debounce} from 'lodash'

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
  }
})

const emits = defineEmits(['update:items'])

const masonry = computed({
  get: () => props.items,
  set: (val) => emits('update:items', val)
})


const columns = ref(7)

const container = ref(null)

const currentPage = ref(null)

const nextPage = ref(null)

const isLoading = ref(false)

async function onScroll() {
  const {scrollTop, clientHeight} = container.value
  const visibleBottom = scrollTop + clientHeight

  const columnHeights = new Array(columns.value).fill(0)

  for (let i = 0; i < masonry.value.length; i++) {
    const item = masonry.value[i]
    const col = i % columns.value
    columnHeights[col] = Math.max(columnHeights[col], item.top + item.columnHeight)
  }

  const whitespaceVisible = columnHeights.some(height => height + 200 < visibleBottom - 1)

  if (whitespaceVisible && !isLoading.value) {
    isLoading.value = true

    if (currentPage.value > 3) {
      // get first item
      const firstItem = masonry.value[0]

      // get page number
      const page = firstItem.page

      // find all item with this page
      const removedItems = masonry.value.filter(i => i.page !== page)

      // calculate layout again
      const content = calculateLayout(removedItems, container.value, columns.value, 10, 10);

      // recalculate height
      containerHeight.value = content.reduce((acc, item) => {
        return Math.max(acc, item.top + item.columnHeight)
      }, 0)

      masonry.value = content

      await nextTick()

      // identify which column has lowest height
      const columnHeights = new Array(columns.value).fill(0)
      for (let i = 0; i < masonry.value.length; i++) {
        const item = masonry.value[i]
        const col = i % columns.value
        columnHeights[col] = Math.max(columnHeights[col], item.top + item.columnHeight)
      }

      const lowestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))

      // find the last item in that column
      const lastItemInColumn = masonry.value.filter((_, index) => index % columns.value === lowestColumnIndex).pop()
      const lastItemInColumnTop = lastItemInColumn.top
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

const containerHeight = ref(0)

function calculateHeight(layout) {
  containerHeight.value = layout.reduce((acc, item) => {
    return Math.max(acc, item.top + item.columnHeight)
  }, 0)
}

onMounted(async () => {
  currentPage.value = props.loadAtPage

  const response = await props.getNextPage(currentPage.value)

  const layout = calculateLayout(response.items, container.value, columns.value, 10, 10);

  calculateHeight(layout)

  masonry.value = layout

  nextPage.value = response.nextPage

  container.value?.addEventListener('scroll', debounce(onScroll, 200));
})

async function loadNext() {
  const response = await props.getNextPage(nextPage.value)
  const layout = calculateLayout([...masonry.value, ...response.items], container.value, columns.value, 10, 10);
  calculateHeight(layout)
  masonry.value = layout
  currentPage.value = nextPage.value
  nextPage.value = response.nextPage
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
  masonry.value = calculateLayout(masonry.value.filter(i => i.id !== item.id), container.value, columns.value, 10, 10)
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
  el.style.top = '-300px'
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
          <slot name="item" :item="item" :on-remove="onRemove">
            <img :src="item.src" class="w-full"/>
          </slot>
        </div>
      </transition-group>
    </div>
  </div>
</template>
