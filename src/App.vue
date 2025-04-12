<script setup>
import {onMounted, ref} from "vue";
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

function onScroll () {
  const { scrollTop, clientHeight } = container.value
  const visibleBottom = scrollTop + clientHeight

  const columnHeights = new Array(columns.value).fill(0)

  for (let i = 0; i < items.value.length; i++) {
    const item = items.value[i]
    const col = i % columns.value
    columnHeights[col] = Math.max(columnHeights[col], item.top + item.columnHeight)
  }

  const whitespaceVisible = columnHeights.some(height => height + 500 < visibleBottom - 1)

  console.log('whitespaceVisible', whitespaceVisible)
  console.log('visibleBottom', visibleBottom)
  console.log(columnHeights)

  if (whitespaceVisible && !isLoading.value) {
    console.log('Whitespace showing in one or more columns')

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
    }

    loadNext().then(() => {
      isLoading.value = false
    })
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

  container.value?.addEventListener('scroll', debounce(onScroll, 500));
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

</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <h2>Seravee</h2>

    <div>
      <button class="bg-blue-500 text-white p-2 rounded cursor-pointer" @click="add()">Add</button>
    </div>

    <div class=" flex-1 overflow-auto bg-red-500" ref="container">
      <div class="relative" :style="{height: `${containerHeight}px`}">
        <transition-group :css="false" @enter="onEnter" @before-enter="onBeforeEnter"
                          @leave="onLeave"
                          @before-leave="onBeforeLeave">
          <div v-for="item in items" :key="`${item.page}-${item.id}`" class="bg-slate-200 absolute transition-[top,left,opacity] duration-500 ease-in-out" :style="getItemStyle(item)" :data-top="item.top">
            <img :src="item.src" class="w-full"/>
            <button class="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer" @click="remove(item)">Remove</button>
          </div>
        </transition-group>
      </div>
    </div>

    <button @click="loadNext()" :disabled="isLoading">
      <span v-if="isLoading">Loading...</span>
      <span v-else>Load next</span>
    </button>
  </div>
</template>


<!--<script setup>-->
<!--import InfiniteMasonry from "./components/InfiniteMasonry.vue";-->
<!--import {nextTick, onMounted, ref} from "vue";-->
<!--import pages from './pages.json'-->

<!--const scrollDetails = ref({-->
<!--  position: 0,-->
<!--  direction: 'down',-->
<!--  isEnd: false,-->
<!--  isStart: true,-->
<!--  hasShortColumn: false,-->
<!--});-->

<!--const items = ref([]);-->

<!--const count = ref(30);-->

<!--const scroller = ref();-->

<!--const pageIndex = ref(0);-->

<!--const isLoading = ref(false);-->

<!--const updateItems = (action) => {-->
<!--  setTimeout(async () => {-->
<!--    if (action === 'add') {-->
<!--      if(items.value.length > 3){-->
<!--        // remove the first page from items-->
<!--        items.value.splice(0, 1);-->
<!--      }-->

<!--      items.value.push(pages[pageIndex.value]);-->

<!--      pageIndex.value = pageIndex.value + 1;-->

<!--      console.log(pageIndex.value)-->

<!--      await nextTick()-->

<!--      isLoading.value = false;-->
<!--    } else {-->
<!--      items.value.splice(-count.value);-->

<!--      isLoading.value = false;-->
<!--    }-->
<!--  }, 1000)-->
<!--}-->

<!--const onScroll = (attributes) => {-->
<!--  scrollDetails.value = attributes-->

<!--  if (autoLoad.value && attributes.hasShortColumn && !isLoading.value) {-->
<!--    isLoading.value = true;-->

<!--    updateItems('add');-->
<!--  }-->
<!--}-->

<!--const autoLoad = ref(true);-->

<!--onMounted(async () => {-->
<!--  setTimeout(() => {-->
<!--    items.value = [pages[pageIndex.value]]-->

<!--    pageIndex.value = pageIndex.value + 1;-->
<!--  }, 2000)-->
<!--})-->
<!--</script>-->

<!--<template>-->
<!--  <main class="flex flex-col items-center p-4 bg-slate-100 h-screen overflow-hidden">-->
<!--    <header class="sticky top-0 z-10 bg-slate-100 w-full p-4 flex flex-col items-center gap-4">-->
<!--      <h1 class="text-2xl font-semibold mb-4">Vue Infinite Masonry</h1>-->

<!--      <p class="text-sm text-gray-500 text-center mb-4">-->
<!--        🚀 Built by <a href="https://wyxos.com" target="_blank" class="underline hover:text-black">wyxos.com</a> •-->
<!--        💾 <a href="https://github.com/wyxos/vue-infinite-masonry" target="_blank" class="underline hover:text-black">Source on GitHub</a>-->
<!--      </p>-->

<!--      <div class="flex flex-col md:flex-row gap-4 items-center">-->
<!--        <p>Scroll {{ scrollDetails }}</p>-->

<!--        <p>Page: {{ pageIndex }}</p>-->

<!--        <p>Pages in array {{ items.length }}</p>-->

<!--      </div>-->
<!--    </header>-->


<!--    <infinite-masonry-->
<!--        ref="scroller"-->
<!--        v-model="items"-->
<!--        @scroll="onScroll"-->
<!--        :options="{ gutterY: 50 }"-->
<!--    />-->
<!--  </main>-->
<!--</template>-->
