<script setup>
// create an array of 20 items with unique uuid
import { v4 as uuidv4 } from 'uuid';
import {computed, onMounted, ref} from "vue";

const columns = ref(7);
const scrollPosition = ref(0);
const scrollDirection = ref('down');

const items = Array.from({ length: 500 }, () => {
  const width = Math.floor(Math.random() * 300) + 200;
  const height = Math.floor(Math.random() * 300) + 200;

  return {
    id: uuidv4(),
    width,
    height,
    src: `https://picsum.photos/${width}/${height}?random=${uuidv4()}`,
  };
});

const columnHeights = computed(() => {
  const heights = Array(columns.value).fill(0);

  items.forEach((item, index) => {
    const column = index % columns.value;
    heights[column] += item.height;
  });

  return heights;
});

const maximumHeight = computed(() => {
  return Math.max(...columnHeights.value);
});

const columnWidth = computed(() => {
  return `calc(100% / ${columns.value})`;
});

const container = ref(null);

const calculateLayout = (item, index) => {
  const columnIndex = index % columns.value;
  const previousIndex = index - columns.value;
  const containerWidth = container.value?.offsetWidth || 0;
  const colWidth = containerWidth / columns.value;

  // Correctly scale height based on new column width
  const scaledHeight = (item.height / item.width) * colWidth;
  const left = `${columnIndex * colWidth}px`;

  if (previousIndex >= 0) {
    const previousItem = items[previousIndex];
    const prevScaledHeight = (previousItem.height / previousItem.width) * colWidth;

    let previousTop = calculateLayout(previousItem, previousIndex).top;
    let top = parseFloat(previousTop) + prevScaledHeight;

    return {
      top: `${top}px`,
      left,
      width: `${colWidth}px`,
      height: `${scaledHeight}px`,
    };
  }

  return {
    top: '0px',
    left,
    width: `${colWidth}px`,
    height: `${scaledHeight}px`,
  };
};

const isVisible = (item, index) => {
  if(!container.value) {
    return false;
  }

  const layout = calculateLayout(item, index);

  const top = Number(layout.top.replace('px', ''));

  return top >= container.value.scrollTop - 1000 && top <= container.value.scrollTop + container.value.offsetHeight + 1000;
}

onMounted(() => {
  container.value.addEventListener('scroll', () => {

    if (container.value.scrollTop > scrollPosition.value) {
      scrollDirection.value = 'down';
    } else {
      scrollDirection.value = 'up';
    }

    scrollPosition.value = container.value.scrollTop;
  });
})
</script>

<template>
  <main class="flex flex-col items-center p-4 bg-slate-100 h-screen overflow-hidden">
    <header class="sticky top-0 z-10 bg-slate-100 w-full p-4 flex flex-col items-center gap-4">
      <h1 class="text-2xl font-semibold mb-4">Vue Infinite Masonry</h1>

      <p class="text-sm text-gray-500 text-center mb-4">
        🚀 Built by <a href="https://wyxos.com" target="_blank" class="underline hover:text-black">wyxos.com</a> •
        💾 <a href="https://github.com/wyxos/vue-infinite-masonry" target="_blank" class="underline hover:text-black">Source on GitHub</a>
      </p>

      <div class="flex gap-4">
        {{ columnHeights }}
        <p>Scroll position: {{ scrollPosition }}</p>
        <p>Scroll direction: {{ scrollDirection }}</p>
      </div>
    </header>


    <div ref="container" class="masonry-container overflow-auto flex-1 w-full">
      <div :style="{ height: `${maximumHeight}px` }" class="relative w-full">
        <template v-for="(item, index) in items" :key="item.id">
          <div v-if="isVisible(item, index)"
               class="bg-slate-200 w-full rounded-lg shadow-lg absolute"
               :style="{ width: columnWidth, ...calculateLayout(item, index) }">
            <img :src="item.src" class="w-full h-auto" />
          </div>
        </template>
      </div>
    </div>
  </main>
</template>
