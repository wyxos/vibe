<script setup>
import InfiniteMasonry from "./InfiniteMasonry.vue";
import {ref} from "vue";
import {v4 as uuidv4} from "uuid";

const scrollPosition = ref(0);
const scrollDirection = ref('down');

const items = ref(Array.from({ length: 30 }, () => {
  const width = Math.floor(Math.random() * 300) + 200;
  const height = Math.floor(Math.random() * 300) + 200;

  return {
    id: uuidv4(),
    width,
    height,
    src: `https://picsum.photos/${width}/${height}?random=${uuidv4()}`,
  };
}));

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

const onScroll = (value, direction) => {
  scrollPosition.value = value;
  scrollDirection.value = direction;
}
</script>

<template>
  <main class="flex flex-col items-center p-4 bg-slate-100 h-screen overflow-hidden">
    <header class="sticky top-0 z-10 bg-slate-100 w-full p-4 flex flex-col items-center gap-4">
      <h1 class="text-2xl font-semibold mb-4">Vue Infinite Masonry</h1>

      <p class="text-sm text-gray-500 text-center mb-4">
        🚀 Built by <a href="https://wyxos.com" target="_blank" class="underline hover:text-black">wyxos.com</a> •
        💾 <a href="https://github.com/wyxos/vue-infinite-masonry" target="_blank" class="underline hover:text-black">Source on GitHub</a>
      </p>

      <div class="flex gap-4 items-center">
        <p>Scroll position: {{ scrollPosition }}</p>
        <p>Scroll direction: {{ scrollDirection }}</p>

        <input type="number" v-model="count" class="border-2 border-slate-200 rounded h-full px-2 w-20">

        <button @click="updateItems('add')" type="button" class="bg-blue-950 p-2 text-white rounded cursor-pointer min-w-30">
          Add
        </button>

        <button @click="updateItems('remove')" type="button" class="bg-blue-950 p-2 text-white rounded cursor-pointer min-w-30">
          Remove
        </button>

        <p>Total: {{ items.length }}</p>
      </div>
    </header>


    <infinite-masonry :items="items" @scroll="onScroll"></infinite-masonry>
  </main>
</template>
