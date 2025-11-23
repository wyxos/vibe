<script setup lang="ts">
import { ref, onMounted, watch, computed, withDefaults } from 'vue';

const props = withDefaults(defineProps<{
  item: any;
  remove?: (item: any) => void;
  type?: 'image' | 'video';
  notFound?: boolean;
}>(), {
  // Auto-read from item if not explicitly provided
  type: undefined,
  notFound: undefined
});

const imageLoaded = ref(false);
const imageError = ref(false);
const imageSrc = ref<string | null>(null);
const videoLoaded = ref(false);
const videoError = ref(false);
const videoSrc = ref<string | null>(null);
// Auto-read from props or item object, default to 'image'
const mediaType = computed(() => props.type ?? props.item?.type ?? 'image');
const showNotFound = computed(() => props.notFound ?? props.item?.notFound ?? false);

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

function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('No video source provided'));
      return;
    }

    const video = document.createElement('video');
    const startTime = Date.now();
    const minLoadTime = 300;
    
    video.preload = 'metadata';
    video.muted = true; // Muted for autoplay compatibility
    
    video.onloadedmetadata = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        videoLoaded.value = true;
        videoError.value = false;
        resolve();
      }, remaining);
    };
    
    video.onerror = () => {
      videoError.value = true;
      videoLoaded.value = false;
      reject(new Error('Failed to load video'));
    };
    
    video.src = src;
  });
}

onMounted(async () => {
  // Debug: verify component is mounting
  console.log('[MasonryItem] Component mounted', props.item?.id);
  
  // If notFound is true, skip preloading
  if (showNotFound.value) {
    return;
  }
  
  const src = props.item?.src;
  if (!src) return;
  
  if (mediaType.value === 'video') {
    videoSrc.value = src;
    videoLoaded.value = false;
    videoError.value = false;
    try {
      await preloadVideo(src);
    } catch {
      // Error handled by videoError state
    }
  } else {
    imageSrc.value = src;
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
    if (!newSrc || showNotFound.value) return;
    
    if (mediaType.value === 'video') {
      if (newSrc !== videoSrc.value) {
        videoLoaded.value = false;
        videoError.value = false;
        videoSrc.value = newSrc;
        try {
          await preloadVideo(newSrc);
        } catch {
          // Error handled by videoError state
        }
      }
    } else {
      if (newSrc !== imageSrc.value) {
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
  }
);

// mediaType and showNotFound are now computed, so they automatically react to changes
</script>

<template>
  <div class="relative w-full h-full group">
    <!-- Custom slot content (replaces default if provided) -->
    <slot :item="item" :remove="remove" :imageLoaded="imageLoaded" :imageError="imageError" :videoLoaded="videoLoaded" :videoError="videoError" :showNotFound="showNotFound">
      <!-- Default content when no slot is provided -->
      <div class="w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white relative">
        <!-- Not Found state -->
        <div
          v-if="showNotFound"
          class="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
        >
          <i class="fas fa-search text-3xl mb-3 opacity-50"></i>
          <span class="font-medium">Not Found</span>
          <span class="text-xs mt-1 opacity-75">This item could not be located</span>
        </div>

        <!-- Spinner while loading -->
        <div
          v-else-if="(mediaType === 'image' && !imageLoaded && !imageError) || (mediaType === 'video' && !videoLoaded && !videoError)"
          class="absolute inset-0 flex items-center justify-center bg-slate-100"
        >
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>

        <!-- Error state -->
        <div
          v-else-if="(mediaType === 'image' && imageError) || (mediaType === 'video' && videoError)"
          class="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
        >
          <i :class="mediaType === 'video' ? 'fas fa-video text-2xl mb-2 opacity-50' : 'fas fa-image text-2xl mb-2 opacity-50'"></i>
          <span>Failed to load {{ mediaType }}</span>
        </div>

        <!-- Image (only shown when loaded) -->
        <img
          v-if="mediaType === 'image' && imageLoaded && imageSrc && !showNotFound"
          :src="imageSrc"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />

        <!-- Video (only shown when loaded) -->
        <video
          v-if="mediaType === 'video' && videoLoaded && videoSrc && !showNotFound"
          :src="videoSrc"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          muted
          loop
          playsinline
          @mouseenter="(e) => (e.target as HTMLVideoElement).play()"
          @mouseleave="(e) => (e.target as HTMLVideoElement).pause()"
          @error="videoError = true"
        />

        <!-- Overlay Gradient -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

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
        <div class="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75 pointer-events-none">
          <p class="text-white text-xs font-medium truncate drop-shadow-md">Item #{{ String(item.id).split('-')[0] }}</p>
        </div>
      </div>
    </slot>
  </div>
</template>

