<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';

const props = withDefaults(defineProps<{
  item: any;
  remove?: (item: any) => void;
  type?: 'image' | 'video';
  notFound?: boolean;
  headerHeight?: number;
  footerHeight?: number;
  // Swipe-mode integration
  isActive?: boolean;
  inSwipeMode?: boolean;
  // Preload threshold: when to start preloading (0.0 to 1.0, default 1.0 = fully in view)
  preloadThreshold?: number;
}>(), {
  // Auto-read from item if not explicitly provided
  type: undefined,
  notFound: undefined,
  headerHeight: 0,
  footerHeight: 0,
  isActive: false,
  inSwipeMode: false,
  preloadThreshold: 1.0
});

const emit = defineEmits<{
  (e: 'preload:success', payload: { item: any; type: 'image' | 'video'; src: string }): void
  (e: 'preload:error', payload: { item: any; type: 'image' | 'video'; src: string; error?: unknown }): void
  (e: 'mouse-enter', payload: { item: any; type: 'image' | 'video' }): void
  (e: 'mouse-leave', payload: { item: any; type: 'image' | 'video' }): void
  (e: 'in-view', payload: { item: any; type: 'image' | 'video' }): void
}>()

const imageLoaded = ref(false);
const imageError = ref(false);
const imageSrc = ref<string | null>(null);
const videoLoaded = ref(false);
const videoError = ref(false);
const videoSrc = ref<string | null>(null);
const isInView = ref(false);
const isFullyInView = ref(false); // Track when fully visible (for in-view event)
const isLoading = ref(false);
const showMedia = ref(false); // Controls fade-in animation
const containerRef = ref<HTMLElement | null>(null);
const videoEl = ref<HTMLVideoElement | null>(null);
let intersectionObserver: IntersectionObserver | null = null;

// Auto-read from props or item object, default to 'image'
const mediaType = computed(() => props.type ?? props.item?.type ?? 'image');
const showNotFound = computed(() => props.notFound ?? props.item?.notFound ?? false);
const isSwipeMode = computed(() => !!props.inSwipeMode);

function emitMouseEnter(type: 'image' | 'video'): void {
  emit('mouse-enter', { item: props.item, type });
}

function emitMouseLeave(type: 'image' | 'video'): void {
  emit('mouse-leave', { item: props.item, type });
}

function onVideoTap(event: Event): void {
  // In swipe mode, let native controls handle play/pause
  if (isSwipeMode.value) return;

  const el = event.target as HTMLVideoElement | null;
  if (!el) return;
  if (el.paused) {
    void el.play();
  } else {
    el.pause();
  }
}

function onVideoMouseEnter(event: Event): void {
  const el = event.target as HTMLVideoElement | null;
  if (!el) return;

  // In swipe mode, don't auto-play on hover
  if (!isSwipeMode.value) {
    void el.play();
  }
  emitMouseEnter('video');
}

function onVideoMouseLeave(event: Event): void {
  const el = event.target as HTMLVideoElement | null;
  if (!el) return;

  // In swipe mode, don't auto-pause on hover leave
  if (!isSwipeMode.value) {
    el.pause();
  }
  emitMouseLeave('video');
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!src) {
      const err = new Error('No image source provided');
      emit('preload:error', { item: props.item, type: 'image', src, error: err });
      reject(err);
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
        emit('preload:success', { item: props.item, type: 'image', src });
        resolve();
      }, remaining);
    };
    img.onerror = () => {
      imageError.value = true;
      imageLoaded.value = false;
      isLoading.value = false;
      const err = new Error('Failed to load image');
      emit('preload:error', { item: props.item, type: 'image', src, error: err });
      reject(err);
    };
    img.src = src;
  });
}

function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!src) {
      const err = new Error('No video source provided');
      emit('preload:error', { item: props.item, type: 'video', src, error: err });
      reject(err);
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
        emit('preload:success', { item: props.item, type: 'video', src });
        resolve();
      }, remaining);
    };

    video.onerror = () => {
      videoError.value = true;
      videoLoaded.value = false;
      isLoading.value = false;
      const err = new Error('Failed to load video');
      emit('preload:error', { item: props.item, type: 'video', src, error: err });
      reject(err);
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

  // Calculate thresholds: we need both preloadThreshold and 1.0 (fully in view)
  const thresholds = [props.preloadThreshold, 1.0].filter((t, i, arr) => arr.indexOf(t) === i).sort((a, b) => a - b);

  // Use Intersection Observer to detect when item comes into view
  // Start preloading at preloadThreshold, emit in-view when fully visible (1.0)
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const ratio = entry.intersectionRatio;
        const isFullyVisible = ratio >= 1.0;
        const shouldPreload = ratio >= props.preloadThreshold;

        // Emit in-view event when fully visible (only once)
        if (isFullyVisible && !isFullyInView.value) {
          isFullyInView.value = true;
          emit('in-view', { item: props.item, type: mediaType.value });
        }

        // Start preloading when threshold is reached
        if (shouldPreload && !isInView.value) {
          isInView.value = true;
          startPreloading();
        } else if (!entry.isIntersecting) {
          // Reset isInView when item leaves viewport (optional, for re-loading if needed)
          // But we don't reset here to prevent re-triggering on scroll
        }
      });
    },
    {
      // Trigger at both preloadThreshold and 1.0 (fully in view)
      threshold: thresholds
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

// Auto-play / pause in swipe mode when active item changes
watch(
  () => props.isActive,
  (active) => {
    if (!isSwipeMode.value || !videoEl.value) return;
    if (active) {
      void videoEl.value.play();
    } else {
      videoEl.value.pause();
    }
  }
);

// Note: We don't watch isInView here because startPreloading() is already called
// from the IntersectionObserver callback, and we want to prevent re-triggering
</script>

<template>
  <div ref="containerRef" class="relative w-full h-full flex flex-col">
    <!-- Header section (gutter top) -->
    <div v-if="headerHeight > 0" class="relative z-10" :style="{ height: `${headerHeight}px` }">
      <slot name="header" :item="item" :remove="remove" :imageLoaded="imageLoaded" :imageError="imageError"
        :videoLoaded="videoLoaded" :videoError="videoError" :showNotFound="showNotFound" :isLoading="isLoading"
        :mediaType="mediaType" />
    </div>

    <!-- Body section (main content) -->
    <div class="flex-1 relative min-h-0">
      <!-- Custom slot content (replaces default if provided) -->
      <slot :item="item" :remove="remove" :imageLoaded="imageLoaded" :imageError="imageError" :videoLoaded="videoLoaded"
        :videoError="videoError" :showNotFound="showNotFound" :isLoading="isLoading" :mediaType="mediaType"
        :imageSrc="imageSrc" :videoSrc="videoSrc" :showMedia="showMedia">
        <!-- Default content when no slot is provided -->
        <div class="w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative">
          <!-- Not Found state -->
          <div v-if="showNotFound"
            class="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center">
            <i class="fas fa-search text-3xl mb-3 opacity-50"></i>
            <span class="font-medium">Not Found</span>
            <span class="text-xs mt-1 opacity-75">This item could not be located</span>
          </div>

          <!-- Media content (image or video) -->
          <div v-else class="relative w-full h-full">
            <!-- Image (always rendered when src exists, fades in when loaded) -->
            <img v-if="mediaType === 'image' && imageSrc" :src="imageSrc" :class="[
              'w-full h-full object-cover transition-opacity duration-700 ease-in-out',
              imageLoaded && showMedia ? 'opacity-100' : 'opacity-0'
            ]" style="position: absolute; top: 0; left: 0;" loading="lazy" decoding="async" alt=""
              @mouseenter="emitMouseEnter('image')" @mouseleave="emitMouseLeave('image')" />

            <!-- Video (always rendered when src exists, fades in when loaded) -->
            <video v-if="mediaType === 'video' && videoSrc" ref="videoEl" :src="videoSrc" :class="[
              'w-full h-full object-cover transition-opacity duration-700 ease-in-out',
              videoLoaded && showMedia ? 'opacity-100' : 'opacity-0'
            ]" style="position: absolute; top: 0; left: 0;" muted loop playsinline
              :autoplay="isSwipeMode && props.isActive" :controls="isSwipeMode" @click.stop="onVideoTap"
              @touchend.stop.prevent="onVideoTap" @mouseenter="onVideoMouseEnter" @mouseleave="onVideoMouseLeave"
              @error="videoError = true" />

            <!-- Placeholder background while loading or if not loaded yet (fades out when media appears) -->
            <div v-if="!imageLoaded && !videoLoaded && !imageError && !videoError" :class="[
              'absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500',
              showMedia ? 'opacity-0 pointer-events-none' : 'opacity-100'
            ]">
              <!-- Media type indicator badge - shown BEFORE preloading starts -->
              <div
                class="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <!-- Allow custom icon via slot, fallback to default -->
                <slot name="placeholder-icon" :mediaType="mediaType">
                  <i
                    :class="mediaType === 'video' ? 'fas fa-video text-xl text-slate-400' : 'fas fa-image text-xl text-slate-400'"></i>
                </slot>
              </div>
            </div>

            <!-- Spinner (only shown when loading) -->
            <div v-if="isLoading"
              class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10">
              <div class="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            </div>

            <!-- Error state -->
            <div v-if="(mediaType === 'image' && imageError) || (mediaType === 'video' && videoError)"
              class="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center">
              <i
                :class="mediaType === 'video' ? 'fas fa-video text-2xl mb-2 opacity-50' : 'fas fa-image text-2xl mb-2 opacity-50'"></i>
              <span>Failed to load {{ mediaType }}</span>
            </div>
          </div>
        </div>
      </slot>
    </div>

    <!-- Footer section (gutter bottom) -->
    <div v-if="footerHeight > 0" class="relative z-10" :style="{ height: `${footerHeight}px` }">
      <slot name="footer" :item="item" :remove="remove" :imageLoaded="imageLoaded" :imageError="imageError"
        :videoLoaded="videoLoaded" :videoError="videoError" :showNotFound="showNotFound" :isLoading="isLoading"
        :mediaType="mediaType" />
    </div>
  </div>
</template>
