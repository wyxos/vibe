<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'

import type { VibeViewerItem } from './vibeViewer'
import { getItemIcon } from './vibe-root/media'
import { getListRenderableAsset } from './vibe-root/listPreview'
import { defaultVibeAssetLoadQueue, type VibeAssetLoadLease } from './vibe-root/useVibeAssetLoadQueue'

const props = defineProps<{
  active?: boolean
  item: VibeViewerItem
}>()

const renderableAsset = computed(() => getListRenderableAsset(props.item))
const isInView = ref(false)
const isReady = ref(renderableAsset.value.kind === 'fallback')
const rootRef = ref<HTMLElement | null>(null)
const scrollRootRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const canAttachAsset = ref(renderableAsset.value.kind === 'fallback')
const attachedAssetUrl = computed(() => {
  if (!isInView.value || !canAttachAsset.value) {
    return null
  }

  return renderableAsset.value.url
})
const isQueueEligible = computed(() =>
  isInView.value
  && (renderableAsset.value.kind === 'image' || renderableAsset.value.kind === 'video')
  && Boolean(renderableAsset.value.url),
)
const shouldRenderImage = computed(() => renderableAsset.value.kind === 'image' && Boolean(attachedAssetUrl.value))
const shouldRenderVideo = computed(() => renderableAsset.value.kind === 'video' && Boolean(attachedAssetUrl.value))
const shouldShowSpinner = computed(() =>
  isQueueEligible.value && (!canAttachAsset.value || !isReady.value),
)

let intersectionObserver: IntersectionObserver | null = null
let loadLease: VibeAssetLoadLease | null = null

watch(
  [attachedAssetUrl, () => renderableAsset.value.kind],
  () => {
    const isFallback = renderableAsset.value.kind === 'fallback'

    isReady.value = isFallback

    if (isFallback) {
      canAttachAsset.value = true
    }
  },
)

watch(isQueueEligible, () => {
  syncAssetQueue()
})

watch([isInView, isReady, attachedAssetUrl], () => {
  syncVideoPlayback()
})

onMounted(() => {
  if (!rootRef.value || typeof IntersectionObserver === 'undefined') {
    scrollRootRef.value = null
    isInView.value = true
    syncAssetQueue()
    return
  }

  scrollRootRef.value = rootRef.value.closest('[data-testid="vibe-list-scroll"]')

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target !== rootRef.value) {
          continue
        }

        isInView.value = entry.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.5
        syncAssetQueue()
        syncVideoPlayback()
      }
    },
    {
      root: scrollRootRef.value,
      threshold: [0, 0.5, 1],
    },
  )

  intersectionObserver.observe(rootRef.value)
})

onBeforeUnmount(() => {
  teardownAssetLoad()
  intersectionObserver?.disconnect()
  intersectionObserver = null
})

function onImageLoad() {
  isReady.value = true
  releaseLoadLease()
}

function onImageError() {
  isReady.value = true
  releaseLoadLease()
}

function onVideoReady() {
  isReady.value = true
  releaseLoadLease()
  syncVideoPlayback()
}

function onVideoLoading() {
  isReady.value = false
}

function syncAssetQueue() {
  if (renderableAsset.value.kind === 'fallback') {
    teardownAssetLoad(false)
    return
  }

  if (!isQueueEligible.value) {
    teardownAssetLoad()
    return
  }

  if (canAttachAsset.value || loadLease) {
    loadLease?.refresh()
    return
  }

  loadLease = defaultVibeAssetLoadQueue.request({
    assetType: renderableAsset.value.kind,
    getPriority: getLoadPriority,
    onGrant() {
      canAttachAsset.value = true
      isReady.value = false
    },
    url: renderableAsset.value.url ?? props.item.url,
  })
}

function syncVideoPlayback() {
  const video = videoRef.value
  if (!video || renderableAsset.value.kind !== 'video') {
    return
  }

  if (attachedAssetUrl.value && isInView.value && isReady.value) {
    video.muted = true
    video.loop = true
    video.playsInline = true
    void video.play().catch(() => {})
    return
  }

  try {
    video.currentTime = 0
  }
  catch {
    // Ignore reset failures for streams or not-yet-ready media elements.
  }

  video.pause()
}

function teardownAssetLoad(resetMedia = true) {
  if (resetMedia) {
    resetVideoPlayback()
  }

  releaseLoadLease()
  canAttachAsset.value = renderableAsset.value.kind === 'fallback'
  isReady.value = renderableAsset.value.kind === 'fallback'
}

function releaseLoadLease() {
  loadLease?.release()
  loadLease = null
}

function resetVideoPlayback() {
  const video = videoRef.value

  if (!video) {
    return
  }

  try {
    video.currentTime = 0
  }
  catch {
    // Ignore reset failures for streams or not-yet-ready media elements.
  }

  video.pause()
}

function getLoadPriority() {
  const rootElement = rootRef.value

  if (!rootElement) {
    return Number.POSITIVE_INFINITY
  }

  const itemBounds = rootElement.getBoundingClientRect()

  if (scrollRootRef.value) {
    const scrollBounds = scrollRootRef.value.getBoundingClientRect()
    const viewportCenter = scrollBounds.top + (scrollBounds.height / 2)

    return Math.abs(((itemBounds.top + itemBounds.bottom) / 2) - viewportCenter)
  }

  const viewportCenter = window.innerHeight / 2

  return Math.abs(((itemBounds.top + itemBounds.bottom) / 2) - viewportCenter)
}
</script>

<template>
  <div
    ref="rootRef"
    class="group relative h-full w-full overflow-hidden border bg-[#0a0b0f] text-[#f7f1ea] transition-[border-color,transform] duration-300"
    :class="props.active ? 'border-white/28' : 'border-white/12 hover:border-white/24'"
  >
    <div
      v-if="shouldShowSpinner"
      data-testid="vibe-list-card-spinner"
      class="pointer-events-none absolute inset-0 z-[2] grid place-items-center bg-black/18"
    >
      <span class="inline-flex h-12 w-12 items-center justify-center border border-white/14 bg-black/55 backdrop-blur-[18px]">
        <LoaderCircle class="h-5 w-5 animate-spin stroke-[1.9] text-[#f7f1ea]/78" aria-hidden="true" />
      </span>
    </div>

    <img
      v-if="shouldRenderImage && attachedAssetUrl"
      :src="attachedAssetUrl"
      :alt="renderableAsset.label"
      draggable="false"
      class="block h-full w-full object-cover transition-opacity duration-300"
      :class="isReady ? 'opacity-100' : 'opacity-0'"
      @load="onImageLoad"
      @error="onImageError"
    />

    <video
      v-else-if="shouldRenderVideo && attachedAssetUrl"
      ref="videoRef"
      :src="attachedAssetUrl"
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
