<template>
  <main class="flex flex-col h-screen overflow-hidden bg-slate-50 relative pt-[112px]">
    <!-- Fixed Sub-Header -->
    <header class="fixed top-[53px] left-0 right-0 z-20 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-end">
        <!-- Right: Controls -->
        <div class="flex items-center gap-3">
          <!-- Status Pill -->
          <div v-if="masonry" class="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <span class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full shadow-sm" :class="masonry.isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'"></span>
              {{ masonry.isLoading ? 'Loading...' : 'Ready' }}
            </span>
            <span class="w-px h-3 bg-slate-200"></span>
            <span>{{ items.length }} items</span>
          </div>

          <div class="h-8 w-px bg-slate-100 mx-1 hidden md:block"></div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-1">
            <button
              @click="showLayoutControls = !showLayoutControls"
              class="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              :class="{ 'text-blue-600 bg-blue-50 ring-2 ring-blue-100': showLayoutControls }"
              title="Layout Settings"
            >
              <i class="fas fa-sliders text-sm"></i>
            </button>

            <a 
              href="https://github.com/wyxos/vibe" 
              target="_blank" 
              class="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200" 
              title="View on GitHub"
            >
              <i class="fab fa-github text-lg"></i>
            </a>
          </div>
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
        <div v-if="showLayoutControls" class="absolute top-full right-4 mt-2 w-full max-w-lg bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl p-6 pointer-events-auto z-30">
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
                    class="w-full min-w-[3rem] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
    <div class="flex flex-1 overflow-hidden relative p-5">
      <masonry v-model:items="items" :get-next-page="getPage" :load-at-page="1" :layout="layout" ref="masonry">
        <!-- MasonryItem is used automatically, but you can customize it -->
      </masonry>
    </div>
  </main>
</template>

<script setup lang="ts">
import Masonry from "../Masonry.vue";
import { ref, reactive, computed } from "vue";
import fixture from "../pages.json";
import type { MasonryItem, GetPageResult } from "../types";

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
