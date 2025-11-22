<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  item: any;
  remove?: (item: any) => void;
}>();

const imageLoaded = ref(false);
const imageError = ref(false);
const imageSrc = ref<string | null>(null);

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('No image source provided'));
      return;
    }

    const img = new Image();
    const startTime = Date.now();
    const minLoadTime = 300; // Minimum time to show spinner (300ms)
    
    img.onload = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      // Ensure spinner shows for at least minLoadTime
      setTimeout(() => {
        imageLoaded.value = true;
        imageError.value = false;
        resolve();
      }, remaining);
    };
    img.onerror = () => {
      imageError.value = true;
      imageLoaded.value = false;
      reject(new Error('Failed to load image'));
    };
    img.src = src;
  });
}

onMounted(async () => {
  // Debug: verify component is mounting
  console.log('[MasonryItem] Component mounted', props.item?.id);
  
  const src = props.item?.src;
  if (src) {
    imageSrc.value = src;
    // Reset state to ensure spinner shows
    imageLoaded.value = false;
    imageError.value = false;
    try {
      await preloadImage(src);
    } catch {
      // Error handled by imageError state
    }
  }
});

watch(
  () => props.item?.src,
  async (newSrc) => {
    if (newSrc && newSrc !== imageSrc.value) {
      imageLoaded.value = false;
      imageError.value = false;
      imageSrc.value = newSrc;
      try {
        await preloadImage(newSrc);
      } catch {
        // Error handled by imageError state
      }
    }
  }
);
</script>

<template>
  <div class="relative w-full h-full group">
    <!-- Custom slot content (replaces default if provided) -->
    <slot :item="item" :remove="remove" :imageLoaded="imageLoaded" :imageError="imageError">
      <!-- Default content when no slot is provided -->
      <div class="w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white relative">
        <!-- Spinner while loading -->
        <div
          v-if="!imageLoaded && !imageError"
          class="absolute inset-0 flex items-center justify-center bg-slate-100"
        >
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>

        <!-- Error state -->
        <div
          v-if="imageError"
          class="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
        >
          <i class="fas fa-image text-2xl mb-2 opacity-50"></i>
          <span>Failed to load image</span>
        </div>

        <!-- Image (only shown when loaded) -->
        <img
          v-if="imageLoaded && imageSrc"
          :src="imageSrc"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />

        <!-- Overlay Gradient -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <!-- Remove button -->
        <button
          v-if="remove"
          class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer"
          @click.stop="remove(item)"
          aria-label="Remove item"
        >
          <i class="fas fa-times text-sm"></i>
        </button>
        
        <!-- Item Info (Optional, visible on hover) -->
        <div class="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75">
          <p class="text-white text-xs font-medium truncate drop-shadow-md">Item #{{ item.id.split('-')[0] }}</p>
        </div>
      </div>
    </slot>
  </div>
</template>

