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
  <main class="flex flex-col h-screen overflow-hidden bg-slate-50 relative">
    <!-- Floating Header -->
    <header class="fixed top-4 left-0 right-0 z-20 w-full max-w-4xl mx-auto px-4 pointer-events-none">
      <div class="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-4 flex items-center justify-between transition-all duration-300 hover:shadow-xl pointer-events-auto">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-inner">
            <i class="fas fa-layer-group text-white text-lg"></i>
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-800 leading-tight">VIBE</h1>
            <p class="text-xs text-slate-500 font-medium">Vue Infinite Block Engine</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div v-if="masonry" class="hidden md:flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :class="masonry.isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'"></span>
              {{ masonry.isLoading ? 'Loading...' : 'Ready' }}
            </span>
            <span class="w-px h-3 bg-slate-300"></span>
            <span>{{ items.length }} items</span>
          </div>

          <button
            @click="showLayoutControls = !showLayoutControls"
            class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            :class="{ 'text-blue-600 bg-blue-50': showLayoutControls }"
            title="Layout Controls"
          >
            <i class="fas fa-sliders"></i>
          </button>

          <a href="https://github.com/wyxos/vibe" target="_blank" class="p-2 text-slate-400 hover:text-slate-800 transition-colors" title="View on GitHub">
            <i class="fab fa-github text-xl"></i>
          </a>
        </div>
      </div>

      <!-- Layout Controls Panel -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0"
      >
        <div v-if="showLayoutControls" class="mt-2 bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-xl p-6 pointer-events-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Column Settings -->
            <div>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Column Configuration</h3>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <div v-for="(val, key) in layoutParams.sizes" :key="key" class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-slate-500 uppercase text-center">{{ key }}</label>
                  <input
                    v-model.number="layoutParams.sizes[key]"
                    type="number"
                    min="1"
                    class="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
            
            <!-- Spacing Settings -->
            <div>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Spacing</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-slate-500 uppercase">Header Offset</label>
                  <div class="relative">
                    <input
                      v-model.number="layoutParams.header"
                      type="number"
                      min="0"
                      class="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">px</span>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-slate-500 uppercase">Footer Offset</label>
                  <div class="relative">
                    <input
                      v-model.number="layoutParams.footer"
                      type="number"
                      min="0"
                      class="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </header>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden relative pt-24">
      <masonry v-model:items="items" :get-next-page="getPage" :load-at-page="1" :layout="layout" ref="masonry"></masonry>
    </div>
  </main>
</template>
