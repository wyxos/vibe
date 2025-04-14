<script setup>
import Masonry from "./Masonry.vue";
import {ref} from "vue";
import fixture from "./pages.json";

const items = ref([])

const masonry = ref(null)

const getPage = async (page) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let output = {
        items: fixture[page - 1].items,
        nextPage: page + 1
      };

      resolve(output)
    }, 1000)
  })
}
</script>
<template>
  <main class="flex flex-col items-center p-4 bg-slate-100 h-screen overflow-hidden">
    <header class="sticky top-0 z-10 bg-slate-100 w-full p-4 flex flex-col items-center gap-4">
      <h1 class="text-2xl font-semibold mb-4">VIBE</h1>
      <p>Vue Infinite Block Engine</p>

      <p class="text-sm text-gray-500 text-center mb-4">
        🚀 Built by <a href="https://wyxos.com" target="_blank" class="underline hover:text-black">wyxos.com</a> •
        💾 <a href="https://github.com/wyxos/vibe" target="_blank" class="underline hover:text-black">Source on GitHub</a>
      </p>

      <div v-if="masonry">
        <p>Loading: <span class="bg-blue-500 text-white p-2 rounded">{{ masonry.isLoading }}</span></p>
      </div>
    </header>
    <masonry v-model:items="items" :get-next-page="getPage" ref="masonry">
      <template #item="{item, onRemove}">
        <img :src="item.src" class="w-full"/>
        <button class="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer" @click="onRemove(item)">
          <i class="fas fa-trash"></i>
        </button>
      </template>
    </masonry>
  </main>
</template>




