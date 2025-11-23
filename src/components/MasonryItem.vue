<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, withDefaults, nextTick } from 'vue';

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
const isInView = ref(false);
const isLoading = ref(false);
const showMedia = ref(false); // Controls fade-in animation
const containerRef = ref<HTMLElement | null>(null);
let intersectionObserver: IntersectionObserver | null = null;

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
      setTimeout(async () => {
        imageLoaded.value = true;
        imageError.value = false;
        isLoading.value = false;
        // Wait for Vue to update DOM, then trigger fade-in
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 100));
        showMedia.value = true;
        resolve();
      }, remaining);
    };
    img.onerror = () => {
      imageError.value = true;
      imageLoaded.value = false;
      isLoading.value = false;
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
      
      setTimeout(async () => {
        videoLoaded.value = true;
        videoError.value = false;
        isLoading.value = false;
        // Wait for Vue to update DOM, then trigger fade-in
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 100));
        showMedia.value = true;
        resolve();
      }, remaining);
    };
    
    video.onerror = () => {
      videoError.value = true;
      videoLoaded.value = false;
      isLoading.value = false;
      reject(new Error('Failed to load video'));
    };
    
    video.src = src;
  });
}

async function startPreloading() {
  // Skip preloading if:
  // - not in view
  // - already loading
  // - already loaded (prevent re-triggering)
  // - notFound is true
  if (!isInView.value || isLoading.value || showNotFound.value) {
    return;
  }

  // Don't start preloading if media is already loaded
  if ((mediaType.value === 'video' && videoLoaded.value) || 
      (mediaType.value === 'image' && imageLoaded.value)) {
    return;
  }

  const src = props.item?.src;
  if (!src) return;

  isLoading.value = true;
  showMedia.value = false; // Reset fade-in state

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
}

onMounted(() => {
  // Set up Intersection Observer to detect when item comes into view
  // We set it up even for notFound items, but skip preloading
  if (!containerRef.value) return;

  // Use Intersection Observer to detect when item's full height is in view
  // Only start preloading when the entire item is visible (intersectionRatio >= 1.0)
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Only trigger when the entire item height is fully visible (intersectionRatio >= 1.0)
        if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
          // Only set isInView if it's not already set (prevent re-triggering)
          if (!isInView.value) {
            isInView.value = true;
            startPreloading();
          }
        } else if (!entry.isIntersecting) {
          // Reset isInView when item leaves viewport (optional, for re-loading if needed)
          // But we don't reset here to prevent re-triggering on scroll
        }
      });
    },
    {
      // Only trigger when item is 100% visible (full height in view)
      threshold: [1.0]
    }
  );

  intersectionObserver.observe(containerRef.value);
});

onUnmounted(() => {
  // Clean up Intersection Observer to prevent memory leaks
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
});

watch(
  () => props.item?.src,
  async (newSrc) => {
    if (!newSrc || showNotFound.value) return;
    
    // Reset states when src changes
    if (mediaType.value === 'video') {
      if (newSrc !== videoSrc.value) {
        videoLoaded.value = false;
        videoError.value = false;
        videoSrc.value = newSrc;
        if (isInView.value) {
          isLoading.value = true;
          try {
            await preloadVideo(newSrc);
          } catch {
            // Error handled by videoError state
          }
        }
      }
    } else {
      if (newSrc !== imageSrc.value) {
        imageLoaded.value = false;
        imageError.value = false;
        imageSrc.value = newSrc;
        if (isInView.value) {
          isLoading.value = true;
          try {
            await preloadImage(newSrc);
          } catch {
            // Error handled by imageError state
          }
        }
      }
    }
  }
);

// Note: We don't watch isInView here because startPreloading() is already called
// from the IntersectionObserver callback, and we want to prevent re-triggering
</script>

<template>
  <div ref="containerRef" class="relative w-full h-full group">
    <!-- Custom slot content (replaces default if provided) -->
    <slot :item="item" :remove="remove" :imageLoaded="imageLoaded" :imageError="imageError" :videoLoaded="videoLoaded" :videoError="videoError" :showNotFound="showNotFound" :isLoading="isLoading" :mediaType="mediaType">
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

        <!-- Media content (image or video) -->
        <div v-else class="relative w-full h-full">
          <!-- Image (always rendered when src exists, fades in when loaded) -->
          <img
            v-if="mediaType === 'image' && imageSrc"
            :src="imageSrc"
            :class="[
              'w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105',
              imageLoaded && showMedia ? 'opacity-100' : 'opacity-0'
            ]"
            style="position: absolute; top: 0; left: 0;"
            loading="lazy"
            decoding="async"
            alt=""
          />

          <!-- Video (always rendered when src exists, fades in when loaded) -->
          <video
            v-if="mediaType === 'video' && videoSrc"
            :src="videoSrc"
            :class="[
              'w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105',
              videoLoaded && showMedia ? 'opacity-100' : 'opacity-0'
            ]"
            style="position: absolute; top: 0; left: 0;"
            muted
            loop
            playsinline
            @mouseenter="(e) => (e.target as HTMLVideoElement).play()"
            @mouseleave="(e) => (e.target as HTMLVideoElement).pause()"
            @error="videoError = true"
          />

          <!-- Placeholder background while loading or if not loaded yet (fades out when media appears) -->
          <div
            v-if="!imageLoaded && !videoLoaded && !imageError && !videoError"
            :class="[
              'absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500',
              showMedia ? 'opacity-0 pointer-events-none' : 'opacity-100'
            ]"
          >
            <!-- Media type indicator - shown BEFORE preloading starts -->
            <div class="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <i :class="mediaType === 'video' ? 'fas fa-video text-xl text-slate-400' : 'fas fa-image text-xl text-slate-400'"></i>
            </div>
          </div>

          <!-- Spinner underneath the graphic (only shown when loading) -->
          <div
            v-if="isLoading"
            class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center"
          >
            <div class="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          </div>

          <!-- Error state -->
          <div
            v-if="(mediaType === 'image' && imageError) || (mediaType === 'video' && videoError)"
            class="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
          >
            <i :class="mediaType === 'video' ? 'fas fa-video text-2xl mb-2 opacity-50' : 'fas fa-image text-2xl mb-2 opacity-50'"></i>
            <span>Failed to load {{ mediaType }}</span>
          </div>
        </div>

        <!-- Media type indicator badge (top-left corner) -->
        <div
          v-if="!showNotFound && (imageLoaded || videoLoaded || isLoading)"
          class="absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          :title="mediaType === 'video' ? 'Video' : 'Image'"
        >
          <i :class="mediaType === 'video' ? 'fas fa-video text-xs' : 'fas fa-image text-xs'"></i>
        </div>

        <!-- Overlay Gradient -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        <!-- Remove button -->
        <button
          v-if="remove"
          class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer z-10"
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
