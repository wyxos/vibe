<script setup lang="ts">
import Masonry from "../Masonry.vue";
import { ref, reactive, computed, watch, nextTick } from "vue";
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
  footer: 40
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

// Device Simulation
const deviceMode = ref<'auto' | 'phone' | 'tablet' | 'desktop'>('auto');
const deviceOrientation = ref<'portrait' | 'landscape'>('portrait');

const deviceDimensions = computed(() => {
  let baseDimensions: { width: number; height: number } | null = null;

  switch (deviceMode.value) {
    case 'phone':
      baseDimensions = { width: 375, height: 667 };
      break;
    case 'tablet':
      baseDimensions = { width: 768, height: 1024 };
      break;
    case 'desktop':
      // Desktop is typically landscape, but allow portrait too
      baseDimensions = { width: 1280, height: 720 };
      break;
    default:
      return null;
  }

  // Swap dimensions for landscape orientation (except desktop which is already landscape by default)
  if (deviceOrientation.value === 'landscape' && deviceMode.value !== 'desktop') {
    return { width: baseDimensions.height, height: baseDimensions.width };
  }

  // For desktop, swap if portrait is selected
  if (deviceMode.value === 'desktop' && deviceOrientation.value === 'portrait') {
    return { width: baseDimensions.height, height: baseDimensions.width };
  }

  return baseDimensions;
});

const containerStyle = computed(() => {
  const dimensions = deviceDimensions.value;
  if (!dimensions) {
    return { width: '100%', height: '100%' };
  }

  const borderRadius = deviceMode.value === 'phone' ? '20px' : deviceMode.value === 'tablet' ? '12px' : '8px';

  return {
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    maxWidth: '100%',
    margin: '0 auto',
    border: '1px solid #e2e8f0',
    borderRadius,
    overflow: 'hidden'
  };
});

// Override container dimensions when device simulation is active
watch([deviceMode, deviceOrientation, masonry], () => {
  if (masonry.value && deviceDimensions.value) {
    // Use nextTick to ensure masonry is fully initialized
    nextTick(() => {
      if (masonry.value && masonry.value.setFixedDimensions) {
        masonry.value.setFixedDimensions({
          width: deviceDimensions.value.width,
          height: deviceDimensions.value.height
        });
      }
    });
  } else if (masonry.value && !deviceDimensions.value) {
    // Clear fixed dimensions when in auto mode
    nextTick(() => {
      if (masonry.value && masonry.value.setFixedDimensions) {
        masonry.value.setFixedDimensions(null);
      }
    });
  }
}, { immediate: true });

// Add hover overlays to masonry items
watch(() => items.value, () => {
  nextTick(() => {
    const masonryItems = document.querySelectorAll('.demo-masonry .masonry-item');
    masonryItems.forEach((el) => {
      if ((el as HTMLElement).hasAttribute('data-overlay-added')) return;

      const itemId = el.getAttribute('data-id');
      if (itemId) {
        const item = items.value.find((i: any) => `${i.page}-${i.id}` === itemId);
        if (item) {
          const container = el.querySelector('.relative.w-full.h-full.flex.flex-col') as HTMLElement;
          if (container && !container.querySelector('.demo-item-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'demo-item-overlay absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none';
            overlay.innerHTML = `
              <div class="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-xs">
                <div class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                  <i class="fas ${item.type === 'video' ? 'fa-video' : 'fa-image'} text-[8px]"></i>
                </div>
                <span class="font-medium">#${String(item.id).split('-')[0]}</span>
              </div>
            `;
            container.classList.add('group');
            container.appendChild(overlay);
            (el as HTMLElement).setAttribute('data-overlay-added', 'true');
          }
        }
      }
    });
  });
}, { deep: true });
</script>

<template>
  <main class="flex flex-col h-screen overflow-hidden bg-slate-50 relative pt-[112px]">
    <!-- Fixed Sub-Header -->
    <header
      class="fixed top-[53px] left-0 right-0 z-20 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-end">
        <!-- Right: Controls -->
        <div class="flex items-center gap-3">
          <!-- Status Pill -->
          <div v-if="masonry"
            class="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <span class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full shadow-sm"
                :class="masonry.isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'"></span>
              {{ masonry.isLoading ? 'Loading...' : 'Ready' }}
            </span>
            <span class="w-px h-3 bg-slate-200"></span>
            <span>{{ items.length }} items</span>
            <span class="w-px h-3 bg-slate-200"></span>
            <span class="uppercase font-semibold text-slate-500">{{ masonry.currentBreakpoint }}</span>
            <span class="w-px h-3 bg-slate-200"></span>
            <span>{{ Math.round(masonry.containerWidth) }}×{{ Math.round(masonry.containerHeight) }}</span>
            <span v-if="masonry.currentPage != null" class="w-px h-3 bg-slate-200"></span>
            <span v-if="masonry.currentPage != null" class="text-slate-500">Page {{ masonry.currentPage }}</span>
          </div>

          <div class="h-8 w-px bg-slate-100 mx-1 hidden md:block"></div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-1">
            <button @click="showLayoutControls = !showLayoutControls"
              class="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              :class="{ 'text-blue-600 bg-blue-50 ring-2 ring-blue-100': showLayoutControls }" title="Layout Settings">
              <i class="fas fa-sliders text-sm"></i>
            </button>

            <a href="https://github.com/wyxos/vibe" target="_blank"
              class="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200"
              title="View on GitHub">
              <i class="fab fa-github text-lg"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Layout Controls Panel -->
      <transition enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in" leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0">
        <div v-if="showLayoutControls"
          class="absolute top-full left-4 right-4 md:left-auto md:right-4 mt-2 md:w-full md:max-w-lg bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl p-4 md:p-6 pointer-events-auto z-30">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <!-- Column Settings -->
            <div>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Column Configuration</h3>
              <div class="grid grid-cols-3 gap-2 sm:gap-3">
                <div v-for="(val, key) in layoutParams.sizes" :key="key" class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-slate-500 uppercase text-center">{{ key }}</label>
                  <input v-model.number="layoutParams.sizes[key]" type="number" min="1"
                    class="w-full px-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>
            </div>

            <!-- Spacing Settings -->
            <div>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Spacing</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-slate-500 uppercase">Header Offset</label>
                  <div class="relative">
                    <input v-model.number="layoutParams.header" type="number" min="0"
                      class="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">px</span>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-slate-500 uppercase">Footer Offset</label>
                  <div class="relative">
                    <input v-model.number="layoutParams.footer" type="number" min="0"
                      class="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">px</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Device Simulation -->
            <div class="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Device Simulation</h3>
              <div class="space-y-4">
                <div class="flex flex-wrap gap-2">
                  <button v-for="mode in ['auto', 'phone', 'tablet', 'desktop']" :key="mode"
                    @click="deviceMode = mode as any"
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                    :class="deviceMode === mode ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                    <i class="fas mr-2" :class="{
                      'fa-desktop': mode === 'desktop' || mode === 'auto',
                      'fa-mobile-alt': mode === 'phone',
                      'fa-tablet-alt': mode === 'tablet'
                    }"></i>
                    {{ mode }}
                  </button>
                </div>
                <div v-if="deviceMode !== 'auto'" class="flex flex-wrap gap-2">
                  <button v-for="orientation in ['portrait', 'landscape']" :key="orientation"
                    @click="deviceOrientation = orientation as any"
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                    :class="deviceOrientation === orientation ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                    <i class="fas mr-2" :class="{
                      'fa-mobile-alt': orientation === 'portrait',
                      'fa-mobile-alt fa-rotate-90': orientation === 'landscape'
                    }"></i>
                    {{ orientation }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </header>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden relative p-5 transition-all duration-300 ease-in-out"
      :class="{ 'bg-slate-200/50': deviceMode !== 'auto' }">
      <div :style="containerStyle" class="transition-all duration-500 ease-in-out bg-slate-50 shadow-sm relative">
        <masonry v-model:items="items" :get-page="getPage" :load-at-page="1" :layout="layout"
          :layout-mode="deviceMode === 'phone' || deviceMode === 'tablet' ? 'swipe' : 'auto'" ref="masonry" init="auto"
          class="demo-masonry">
          <template #item-footer="{ item, remove }">
            <div class="h-full flex items-center justify-between px-3">
              <button v-if="remove"
                class="px-2.5 py-1 rounded-full bg-white/90 text-slate-700 text-[11px] shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                @click.stop="remove(item)">
                Remove
              </button>
              <div class="text-[11px] text-slate-600">
                {{ item.width }}×{{ item.height }}
              </div>
            </div>
          </template>
        </masonry>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Hover overlay for masonry items */
.demo-masonry :deep(.masonry-item:hover .demo-item-overlay) {
  opacity: 1;
}
</style>
