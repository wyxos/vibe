<script setup lang="ts">
import Masonry from "./Masonry.vue";
import { ref, reactive, computed } from "vue";
import fixture from "./pages.json";
import type { MasonryItem, GetPageResult } from "./types";

const items = ref<MasonryItem[]>([]);

const masonry = ref<InstanceType<typeof Masonry> | null>(null);

const layoutParams = reactive({
  sizes: {
    base: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 10
  },
  header: 0,
  footer: 0
});

const layout = computed(() => ({
  sizes: { ...layoutParams.sizes },
  header: layoutParams.header,
  footer: layoutParams.footer
}));

const showLayoutControls = ref(false);

const getPage = async (page: number): Promise<GetPageResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Check if the page exists in the fixture
      const pageData = (fixture as any[])[page - 1] as { items: MasonryItem[] } | undefined;

      if (!pageData) {
        // Return empty items if page doesn't exist
        resolve({
          items: [],
          nextPage: null // null indicates no more pages
        });
        return;
      }

      const output: GetPageResult = {
        items: pageData.items,
        nextPage: page < (fixture as any[]).length ? page + 1 : null
      };

      resolve(output);
    }, 1000);
  });
};
</script>
<template>
  <main class="flex flex-col items-center p-4 bg-slate-100 h-screen overflow-hidden">
    <header class="sticky top-0 z-10 bg-slate-100 w-full p-4 flex flex-col items-center gap-4 max-h-[80vh] overflow-y-auto">
      <h1 class="text-2xl font-semibold mb-4">VIBE</h1>
      <p>Vue Infinite Block Engine</p>

      <p class="text-sm text-gray-500 text-center mb-4">
        🚀 Built by <a href="https://wyxos.com" target="_blank" class="underline hover:text-black">wyxos.com</a> •
        💾 <a href="https://github.com/wyxos/vibe" target="_blank" class="underline hover:text-black">Source on GitHub</a>
      </p>

      <div v-if="masonry" class="flex gap-4">
        <p>Loading: <span class="bg-blue-500 text-white p-2 rounded">{{ masonry.isLoading }}</span></p>
        <p>Showing: <span class="bg-blue-500 text-white p-2 rounded">{{ items.length }}</span></p>
      </div>

      <div class="w-full max-w-4xl">
        <button
          @click="showLayoutControls = !showLayoutControls"
          class="w-full bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded cursor-pointer text-sm font-medium transition-colors"
        >
          {{ showLayoutControls ? '▼' : '▶' }} Layout Controls
        </button>
        
        <div v-if="showLayoutControls" class="mt-4 p-4 bg-white rounded border border-slate-300">
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600 font-medium">Base</label>
              <input
                v-model.number="layoutParams.sizes.base"
                type="number"
                min="1"
                class="w-full px-2 py-1 border border-slate-300 rounded text-sm"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600 font-medium">SM</label>
              <input
                v-model.number="layoutParams.sizes.sm"
                type="number"
                min="1"
                class="w-full px-2 py-1 border border-slate-300 rounded text-sm"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600 font-medium">MD</label>
              <input
                v-model.number="layoutParams.sizes.md"
                type="number"
                min="1"
                class="w-full px-2 py-1 border border-slate-300 rounded text-sm"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600 font-medium">LG</label>
              <input
                v-model.number="layoutParams.sizes.lg"
                type="number"
                min="1"
                class="w-full px-2 py-1 border border-slate-300 rounded text-sm"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600 font-medium">XL</label>
              <input
                v-model.number="layoutParams.sizes.xl"
                type="number"
                min="1"
                class="w-full px-2 py-1 border border-slate-300 rounded text-sm"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600 font-medium">2XL</label>
              <input
                v-model.number="layoutParams.sizes['2xl']"
                type="number"
                min="1"
                class="w-full px-2 py-1 border border-slate-300 rounded text-sm"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600 font-medium">Header (px)</label>
              <input
                v-model.number="layoutParams.header"
                type="number"
                min="0"
                class="w-full px-2 py-1 border border-slate-300 rounded text-sm"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600 font-medium">Footer (px)</label>
              <input
                v-model.number="layoutParams.footer"
                type="number"
                min="0"
                class="w-full px-2 py-1 border border-slate-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
    <masonry v-model:items="items" :get-next-page="getPage" :load-at-page="1" :layout="layout" ref="masonry"></masonry>
  </main>
</template>
