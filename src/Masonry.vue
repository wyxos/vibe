<script setup>
import {nextTick, onMounted, ref} from "vue";
import calculateLayout from "./calculateLayout.js";
import fixture from './pages.json'
import {debounce} from 'lodash'

const items = ref([])

const columns = ref(7)

const getPage = async (index) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fixture[index - 1].items)
    }, 1000)
  })
}

const container = ref(null)

const currentPage = ref(1)

function load (){
  return getPage(currentPage.value)
}

const isLoading = ref(false)

async function onScroll () {
  const { scrollTop, clientHeight } = container.value
  const visibleBottom = scrollTop + clientHeight

  const columnHeights = new Array(columns.value).fill(0)

  for (let i = 0; i < items.value.length; i++) {
    const item = items.value[i]
    const col = i % columns.value
    columnHeights[col] = Math.max(columnHeights[col], item.top + item.columnHeight)
  }

  const whitespaceVisible = columnHeights.some(height => height + 300 < visibleBottom - 1)

  if (whitespaceVisible && !isLoading.value) {
    isLoading.value = true

    if(currentPage.value > 3){
      // get first item
      const firstItem = items.value[0]

      // get page number
      const page = firstItem.page

      // find all item with this page
      const removedItems = items.value.filter(i => i.page !== page)

      // calculate layout again
      const content = calculateLayout(removedItems, container.value, columns.value, 10, 10);

      // recalculate height
      containerHeight.value = content.reduce((acc, item) => {
        return Math.max(acc, item.top + item.columnHeight)
      }, 0)

      items.value = content

      await nextTick()

      // identify which column is lowest in height
      const columnHeights = new Array(columns.value).fill(0)
      for (let i = 0; i < items.value.length; i++) {
        const item = items.value[i]
        const col = i % columns.value
        columnHeights[col] = Math.max(columnHeights[col], item.top + item.columnHeight)
      }

      const lowestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))

      // find the last item in that column
      const lastItemInColumn = items.value.filter((_, index) => index % columns.value === lowestColumnIndex).pop()
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

onMounted(async () => {
  const content = await load()

  const layout = calculateLayout(content, container.value, columns.value, 10, 10);

  containerHeight.value = layout.reduce((acc, item) => {
    return Math.max(acc, item.top + item.columnHeight)
  }, 0)

  items.value = layout

  container.value?.addEventListener('scroll', debounce(onScroll, 200));
})

async function loadNext() {
  currentPage.value = currentPage.value + 1
  const page = await getPage(currentPage.value)
  const content = calculateLayout([...items.value, ...page], container.value, columns.value, 10, 10);
  containerHeight.value = content.reduce((acc, item) => {
    return Math.max(acc, item.top + item.columnHeight)
  }, 0)
  items.value = content
}

const getItemStyle = (item) => {
  return {
    top: `${item.top}px`,
    left: `${item.left}px`,
    width: `${item.columnWidth}px`,
    height: `${item.columnHeight}px`
  }
}

function remove(item) {
  items.value = items.value.filter(i => i.id !== item.id)
  items.value = calculateLayout(items.value, container.value, columns.value, 10, 10)
}

function add(){
  // select a random page from the fixture
  const randomPage = Math.floor(Math.random() * (fixture.length - 1)) + 1
  const page = fixture[randomPage].items
  // pick a random item
  const randomItem = Math.floor(Math.random() * (page.length - 1)) + 1
  const item = page[randomItem]
  // set the page to a random value where max = currentPage
  const randomPageIndex = Math.floor(Math.random() * (currentPage.value - 1)) + 1
  item.page = randomPageIndex

  // insert it at a random position in the items array
  const randomIndex = Math.floor(Math.random() * (items.value.length - 1)) + 1
  items.value.splice(randomIndex, 0, item)

  // calculate the layout again
  items.value = calculateLayout(items.value, container.value, columns.value, 10, 10)
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
  const lastItem = items.value[items.value.length - 1]
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

function itemAttributes(item){
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
        <div v-for="item in items" :key="`${item.page}-${item.id}`" class="bg-slate-200 absolute transition-[top,left,opacity] duration-500 ease-in-out" v-bind="itemAttributes(item)">
          <img :src="item.src" class="w-full"/>
          <button class="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer" @click="remove(item)">Remove</button>
        </div>
      </transition-group>
    </div>
  </div>
</template>
