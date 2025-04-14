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
