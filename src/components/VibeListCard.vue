<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'

import type { VibeViewerItem } from './vibeViewer'
import { getItemIcon } from './vibe-root/media'
import { getListRenderableAsset } from './vibe-root/listPreview'

const props = defineProps<{
  active?: boolean
  item: VibeViewerItem
}>()

const renderableAsset = computed(() => getListRenderableAsset(props.item))
const isHovered = ref(false)
const isInView = ref(false)
const isReady = ref(renderableAsset.value.kind === 'fallback')
const rootRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

let intersectionObserver: IntersectionObserver | null = null

watch(
  () => renderableAsset.value.url,
  () => {
    isReady.value = renderableAsset.value.kind === 'fallback'
  },
)

watch([isHovered, isInView, isReady], () => {
  syncVideoPlayback()
})

onMounted(() => {
  if (!rootRef.value || typeof IntersectionObserver === 'undefined') {
    isInView.value = true
    return
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target !== rootRef.value) {
          continue
        }

        isInView.value = entry.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.5
        syncVideoPlayback()
      }
    },
    {
      root: rootRef.value.closest('[data-testid="vibe-list-scroll"]'),
      threshold: [0, 0.5, 1],
    },
  )

  intersectionObserver.observe(rootRef.value)
})

onBeforeUnmount(() => {
  intersectionObserver?.disconnect()
  intersectionObserver = null
})

function onImageLoad() {
  isReady.value = true
}

function onImageError() {
  isReady.value = true
}

function onVideoReady() {
  isReady.value = true
  syncVideoPlayback()
}

function onVideoLoading() {
  isReady.value = false
}

function syncVideoPlayback() {
  const video = videoRef.value
  if (!video || renderableAsset.value.kind !== 'video') {
    return
  }

  if (isHovered.value && isInView.value && isReady.value) {
    video.muted = true
    video.loop = true
    video.playsInline = true
    void video.play().catch(() => {})
    return
  }

  video.pause()
}
</script>

<template>
  <div
    ref="rootRef"
    class="group relative h-full w-full overflow-hidden border bg-[#0a0b0f] text-[#f7f1ea] transition-[border-color,transform] duration-300"
    :class="props.active ? 'border-white/28' : 'border-white/12 hover:border-white/24'"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div
      v-if="renderableAsset.kind !== 'fallback' && !isReady"
      data-testid="vibe-list-card-spinner"
      class="pointer-events-none absolute inset-0 z-[2] grid place-items-center bg-black/18"
    >
      <span class="inline-flex h-12 w-12 items-center justify-center border border-white/14 bg-black/55 backdrop-blur-[18px]">
        <LoaderCircle class="h-5 w-5 animate-spin stroke-[1.9] text-[#f7f1ea]/78" aria-hidden="true" />
      </span>
    </div>

    <img
      v-if="renderableAsset.kind === 'image' && renderableAsset.url"
      :src="renderableAsset.url"
      :alt="renderableAsset.label"
      draggable="false"
      class="block h-full w-full object-cover transition-opacity duration-300"
      :class="isReady ? 'opacity-100' : 'opacity-0'"
      @load="onImageLoad"
      @error="onImageError"
    />

    <video
      v-else-if="renderableAsset.kind === 'video' && renderableAsset.url"
      ref="videoRef"
      :src="renderableAsset.url"
      muted
      loop
      playsinline
      preload="metadata"
      class="block h-full w-full object-cover transition-opacity duration-300"
      :class="isReady ? 'opacity-100' : 'opacity-0'"
      @canplay="onVideoReady"
      @error="onImageError"
      @loadstart="onVideoLoading"
      @playing="onVideoReady"
      @stalled="onVideoLoading"
      @waiting="onVideoLoading"
    />

    <div
      v-else
      class="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_65%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
    >
      <div class="inline-flex h-14 w-14 items-center justify-center border border-white/16 bg-black/20">
        <component :is="getItemIcon(props.item.type)" class="h-6 w-6 stroke-[1.8] text-[#f7f1ea]/78" aria-hidden="true" />
      </div>
    </div>

  </div>
</template>
