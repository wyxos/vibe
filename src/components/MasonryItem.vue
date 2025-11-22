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
  <div class="relative w-full h-full">
    <!-- Custom slot content (replaces default if provided) -->
    <slot :item="item" :remove="remove" :imageLoaded="imageLoaded" :imageError="imageError">
      <!-- Default content when no slot is provided -->
      <!-- Spinner while loading -->
      <div
        v-if="!imageLoaded && !imageError"
        class="absolute inset-0 flex items-center justify-center bg-gray-100"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>

      <!-- Error state -->
      <div
        v-if="imageError"
        class="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm"
      >
        Failed to load image
      </div>

      <!-- Image (only shown when loaded) -->
      <img
        v-if="imageLoaded && imageSrc"
        :src="imageSrc"
        class="w-full"
        loading="lazy"
        decoding="async"
      />

      <!-- Remove button -->
      <button
        v-if="remove"
        class="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer hover:bg-red-600 transition-colors"
        @click="remove(item)"
        aria-label="Remove item"
      >
        <i class="fas fa-trash"></i>
      </button>
    </slot>
  </div>
</template>

