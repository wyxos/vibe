<script setup>
// create an array of 20 items with unique uuid
import { v4 as uuidv4 } from 'uuid';
import {computed, onMounted, ref, watchEffect} from "vue";

const columns = ref(7);
const scrollPosition = ref(0);
const scrollDirection = ref('down');

const items = ref(Array.from({ length: 5000 }, () => {
  const width = Math.floor(Math.random() * 300) + 200;
  const height = Math.floor(Math.random() * 300) + 200;

  return {
    id: uuidv4(),
    width,
    height,
    src: `https://picsum.photos/${width}/${height}?random=${uuidv4()}`,
  };
}));

const columnHeights = computed(() => {
  const heights = Array(columns.value).fill(0);

  items.value.forEach((item, index) => {
    const column = index % columns.value;
    heights[column] += item.height;
  });

  return heights;
});

const internalColumnHeights = ref([]);

const maximumHeight = computed(() => Math.max(...internalColumnHeights.value));

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
    const previousItem = items.value[previousIndex];
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

const layouts = ref([]); // contains { id, top, left, width, height, src }

watchEffect(() => {
  if (!container.value) return;

  const containerWidth = container.value.offsetWidth;
  const colWidth = containerWidth / columns.value;
  const colHeights = Array(columns.value).fill(0);

  // 👇 Touching this makes it reactive
  const _ = items.value.length;

  layouts.value = items.value.map((item, index) => {
    const columnIndex = index % columns.value;
    const scaledHeight = (item.height / item.width) * colWidth;
    const top = colHeights[columnIndex];
    const left = columnIndex * colWidth;

    colHeights[columnIndex] += scaledHeight;

    internalColumnHeights.value = colHeights;

    return {
      ...item,
      width: colWidth,
      height: scaledHeight,
      top,
      left
    };
  });
});

const visibleItems = computed(() => {
  const scroll = scrollPosition.value;
  const viewHeight = container.value?.offsetHeight || 0;

  return layouts.value.filter(item => {
    return (
        item.top + item.height >= scroll - 200 &&
        item.top <= scroll + viewHeight + 200
    );
  });
});

const count = ref(5);

const updateItems = (action) => {
  if (action === 'add') {
    items.value.push(...Array.from({ length: count.value }, () => {
      const width = Math.floor(Math.random() * 300) + 200;
      const height = Math.floor(Math.random() * 300) + 200;

      return {
        id: uuidv4(),
        width,
        height,
        src: `https://picsum.photos/${width}/${height}?random=${uuidv4()}`,
      };
    }));
  } else {
    items.value.splice(-count.value);
  }
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
        <p>Scroll position: {{ scrollPosition }}</p>
        <p>Scroll direction: {{ scrollDirection }}</p>

        <input type="number" v-model="count">

        <button @click="updateItems('add')" type="button" class="bg-blue-950 p-2 text-white rounded cursor-pointer">
          Add
        </button>

        <button @click="updateItems('remove')" type="button" class="bg-blue-950 p-2 text-white rounded cursor-pointer">
          Remove
        </button>

        {{ items.length }}
      </div>
    </header>


    <div ref="container" class="masonry-container overflow-auto flex-1 w-full">
      <div :style="{ height: `${maximumHeight}px` }" class="relative w-full">
        <template v-for="item in visibleItems" :key="item.id">
          <div
              class="absolute bg-slate-200 rounded-lg shadow-lg"
              :style="{
      top: item.top + 'px',
      left: item.left + 'px',
      width: item.width + 'px',
      height: item.height + 'px'
    }"
          >
            <img :src="item.src" class="w-full h-auto" />
          </div>
        </template>
      </div>
    </div>
  </main>
</template>
