<script setup lang="ts">
import type { Component } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LoaderCircle, TriangleAlert } from 'lucide-vue-next'

import type { VibeViewerItem } from './viewer'
import { getItemIcon } from './viewer-core/media'
import { getListRenderableAsset } from './viewer-core/listPreview'
import { getVibeAssetErrorLabel, resolveVibeAssetErrorKind, type VibeAssetErrorKind } from './viewer-core/loadError'
import { playMediaElement } from './viewer-core/mediaPlayback'
import { defaultAssetLoadQueue, type VibeAssetLoadLease } from './viewer-core/useAssetLoadQueue'

const props = withDefaults(defineProps<{
  active?: boolean
  index?: number
  item: VibeViewerItem
}>(), {
  active: false,
  index: 0,
})
const emit = defineEmits<{
  open: []
}>()
defineSlots<{
  'grid-item-overlay'?: (props: {
    active: boolean
    focused: boolean
    hovered: boolean
    index: number
    item: VibeViewerItem
    openFullscreen: () => void
  }) => unknown
  'item-icon'?: (props: { icon: Component; item: VibeViewerItem }) => unknown
}>()

const renderableAsset = computed(() => getListRenderableAsset(props.item))
const isInView = ref(false)
const isFocused = ref(false)
const isHovered = ref(false)
const isReady = ref(renderableAsset.value.kind === 'fallback')
const loadErrorKind = ref<VibeAssetErrorKind | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
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
const shouldRenderError = computed(() => Boolean(loadErrorKind.value))
const shouldShowSpinner = computed(() =>
  isQueueEligible.value && !loadErrorKind.value && (!canAttachAsset.value || !isReady.value),
)

let intersectionObserver: IntersectionObserver | null = null
let loadLease: VibeAssetLoadLease | null = null

watch(
  [attachedAssetUrl, () => renderableAsset.value.kind],
  () => {
    const isFallback = renderableAsset.value.kind === 'fallback'

    isReady.value = isFallback
    loadErrorKind.value = null

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
  if (!isCurrentAssetElement(imageRef.value)) {
    return
  }

  isReady.value = true
  loadErrorKind.value = null
  releaseLoadLease()
}

async function onImageError() {
  if (!isCurrentAssetElement(imageRef.value)) {
    return
  }

  isReady.value = false
  loadErrorKind.value = 'generic'
  loadErrorKind.value = await resolveVibeAssetErrorKind(attachedAssetUrl.value ?? props.item.url)
  releaseLoadLease()
}

function onVideoReady() {
  if (!isCurrentAssetElement(videoRef.value)) {
    return
  }

  isReady.value = true
  loadErrorKind.value = null
  releaseLoadLease()
  syncVideoPlayback()
}

function onVideoLoading() {
  if (!isCurrentAssetElement(videoRef.value)) {
    return
  }

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

  loadLease = defaultAssetLoadQueue.request({
    assetType: renderableAsset.value.kind,
    getPriority: getLoadPriority,
    onGrant() {
      canAttachAsset.value = true
      isReady.value = false
      loadErrorKind.value = null
    },
    url: renderableAsset.value.url ?? props.item.url,
  })
}

function syncVideoPlayback() {
  const video = videoRef.value
  if (!video || renderableAsset.value.kind !== 'video') {
    return
  }

  if (loadErrorKind.value) {
    video.pause()
    return
  }

  if (attachedAssetUrl.value && isInView.value && isReady.value) {
    video.muted = true
    video.loop = true
    video.playsInline = true
    playMediaElement(video)
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
  canAttachAsset.value = renderableAsset.value.kind === 'fallback'
  loadErrorKind.value = null
  isReady.value = renderableAsset.value.kind === 'fallback'

  if (resetMedia) {
    abortImageLoad()
    abortVideoLoad()
  }

  releaseLoadLease()
}

function releaseLoadLease() {
  loadLease?.release()
  loadLease = null
}

function abortImageLoad() {
  const image = imageRef.value

  if (!image) {
    return
  }

  try {
    image.removeAttribute('src')
    image.src = ''
  }
  catch {
    // Ignore abort failures if the image element is already detached.
  }
}

function abortVideoLoad() {
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

  try {
    video.removeAttribute('src')
    video.load()
  }
  catch {
    // Ignore abort failures if the video element is already detached.
  }
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

function isCurrentAssetElement(element: HTMLImageElement | HTMLVideoElement | null) {
  const expectedUrl = normalizeAssetUrl(attachedAssetUrl.value)

  if (!element || !expectedUrl) {
    return false
  }

  const actualUrl = normalizeAssetUrl(('currentSrc' in element && element.currentSrc) || element.getAttribute('src'))

  return actualUrl === expectedUrl
}

function normalizeAssetUrl(url: string | null) {
  if (!url) {
    return null
  }

  try {
    return new URL(url, window.location.href).href
  }
  catch {
    return url
  }
}

function openFullscreen() {
  emit('open')
}

function onFocusIn() {
  isFocused.value = true
}

function onFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget

  if (rootRef.value && nextTarget instanceof Node && rootRef.value.contains(nextTarget)) {
    return
  }

  isFocused.value = false
}
</script>

<template>
  <div
    ref="rootRef"
    data-testid="vibe-list-card-inner"
    class="group relative h-full w-full overflow-hidden border bg-[#0a0b0f] text-[#f7f1ea] transition-[border-color,transform] duration-300"
    :class="props.active ? 'border-white/28' : 'border-white/12 hover:border-white/24'"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @pointerenter="isHovered = true"
    @pointerleave="isHovered = false"
  >
    <button
      type="button"
      data-testid="vibe-list-card-open"
      class="absolute inset-0 z-[1] block h-full w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
      :aria-label="props.item.title || `Open item ${props.index + 1}`"
      @click="openFullscreen"
    />

    <div
      v-if="shouldShowSpinner"
      data-testid="vibe-list-card-spinner"
      class="pointer-events-none absolute inset-0 z-[4] grid place-items-center bg-black/18"
    >
      <span class="inline-flex h-12 w-12 items-center justify-center border border-white/14 bg-black/55 backdrop-blur-[18px]">
        <LoaderCircle class="h-5 w-5 animate-spin stroke-[1.9] text-[#f7f1ea]/78" aria-hidden="true" />
      </span>
    </div>

    <img
      v-if="shouldRenderImage && attachedAssetUrl && !shouldRenderError"
      ref="imageRef"
      :src="attachedAssetUrl"
      :alt="renderableAsset.label"
      draggable="false"
      class="block h-full w-full object-cover transition-opacity duration-300"
      :class="isReady ? 'opacity-100' : 'opacity-0'"
      @load="onImageLoad"
      @error="onImageError"
    />

    <video
      v-else-if="shouldRenderVideo && attachedAssetUrl && !shouldRenderError"
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
      v-else-if="shouldRenderError"
      data-testid="vibe-list-card-error"
      :data-kind="loadErrorKind"
      class="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.12),transparent_65%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
    >
      <div class="grid justify-items-center gap-3 px-4 text-center">
        <TriangleAlert class="h-6 w-6 stroke-[1.8] text-[#f7f1ea]/78" aria-hidden="true" />
        <span class="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/72">
          {{ getVibeAssetErrorLabel(loadErrorKind!) }}
        </span>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_65%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
    >
      <div class="inline-flex h-14 w-14 items-center justify-center border border-white/16 bg-black/20">
        <slot name="item-icon" :icon="getItemIcon(props.item.type)" :item="props.item">
          <component :is="getItemIcon(props.item.type)" class="h-6 w-6 stroke-[1.8] text-[#f7f1ea]/78" aria-hidden="true" />
        </slot>
      </div>
    </div>

    <div class="pointer-events-none absolute inset-0 z-[3]">
      <slot
        name="grid-item-overlay"
        :active="props.active"
        :focused="isFocused"
        :hovered="isHovered"
        :index="props.index"
        :item="props.item"
        :open-fullscreen="openFullscreen"
      />
    </div>
  </div>
</template>
