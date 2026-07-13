<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  type CSSProperties,
} from 'vue'

import {
  getFakeMediaPage,
  type FakeMediaPage,
} from '@/demo/fakeServer'
import {
  calculateMasonryEntryOffset,
  calculateMasonryLayout,
} from '@/demo/masonry'

const MIN_COLUMN_WIDTH = 240
const MIN_GAP = 6
const MAX_GAP = 12
const ENTRY_STAGGER_MS = 35

const mediaPage = shallowRef<FakeMediaPage | null>(null)
const mediaPageError = shallowRef<unknown>(null)
const masonryElement = shallowRef<HTMLElement | null>(null)
const masonryWidth = shallowRef(0)
const masonryGap = shallowRef(MIN_GAP)
const enteringPostIds = shallowRef<ReadonlySet<number>>(new Set())
const entryDelays = shallowRef<ReadonlyMap<number, number>>(new Map())
let previousPostIds = new Set<number>()
let resizeObserver: ResizeObserver | null = null
let resizeFrame: number | null = null
let enterReleaseFrame: number | null = null

const masonryLayout = computed(() => calculateMasonryLayout(
  mediaPage.value?.items ?? [],
  masonryWidth.value,
  {
    gap: masonryGap.value,
    minColumnWidth: MIN_COLUMN_WIDTH,
  },
))

const masonryStyle = computed<CSSProperties>(() => ({
  height: `${masonryLayout.value.height}px`,
}))

const masonryItemStyles = computed<CSSProperties[]>(() => (
  masonryLayout.value.items.map((item, index) => {
    const postId = mediaPage.value?.items[index]?.postId
    const entryOffset = postId !== undefined && enteringPostIds.value.has(postId)
      ? masonryEntryOffset()
      : 0
    const entryDelay = postId === undefined
      ? 0
      : entryDelays.value.get(postId) ?? 0

    return {
      '--masonry-entry-delay': `${entryDelay}ms`,
      top: `${item.y}px`,
      left: `${item.x}px`,
      width: `${item.width}px`,
      height: `${item.height}px`,
      transform: `translate3d(0, ${entryOffset}px, 0)`,
    }
  })
))

function masonryEntryOffset(): number {
  return calculateMasonryEntryOffset({
    containerHeight: masonryLayout.value.height,
    gap: masonryGap.value,
  })
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scheduleEnterRelease(): void {
  if (enterReleaseFrame !== null) cancelAnimationFrame(enterReleaseFrame)

  enterReleaseFrame = requestAnimationFrame(() => {
    enterReleaseFrame = requestAnimationFrame(() => {
      enterReleaseFrame = null
      enteringPostIds.value = new Set()
    })
  })
}

function measureMasonry(element: HTMLElement): void {
  const viewportWidth = element.ownerDocument.documentElement.clientWidth

  masonryWidth.value = element.clientWidth
  masonryGap.value = Math.min(
    MAX_GAP,
    Math.max(MIN_GAP, viewportWidth * 0.0075),
  )
}

function isVideo(src: string): boolean {
  try {
    return /\.(mp4|webm|mov)$/i.test(new URL(src).pathname)
  } catch {
    return /\.(mp4|webm|mov)(?:$|\?)/i.test(src)
  }
}

onMounted(async () => {
  try {
    mediaPage.value = await getFakeMediaPage(null)
  } catch (error: unknown) {
    mediaPageError.value = error
  }
})

watch(masonryElement, (element) => {
  resizeObserver?.disconnect()
  resizeObserver = null

  if (resizeFrame !== null) {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = null
  }

  if (!element) return

  measureMasonry(element)

  if (typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver(([entry]) => {
    const observedWidth = entry?.contentRect.width ?? element.clientWidth
    if (Math.abs(observedWidth - masonryWidth.value) < 0.5) return

    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null
      measureMasonry(element)
    })
  })
  resizeObserver.observe(element)
})

watch(
  () => mediaPage.value?.items.map((item) => item.postId) ?? [],
  (postIds) => {
    const addedPostIds = postIds.filter((postId) => !previousPostIds.has(postId))
    previousPostIds = new Set(postIds)

    if (addedPostIds.length === 0 || prefersReducedMotion()) return

    const nextEntryDelays = new Map<number, number>()
    postIds.forEach((postId) => {
      const existingDelay = entryDelays.value.get(postId)
      if (existingDelay !== undefined) nextEntryDelays.set(postId, existingDelay)
    })
    addedPostIds.forEach((postId, index) => {
      nextEntryDelays.set(postId, index * ENTRY_STAGGER_MS)
    })
    entryDelays.value = nextEntryDelays

    enteringPostIds.value = new Set([
      ...enteringPostIds.value,
      ...addedPostIds,
    ])
    scheduleEnterRelease()
  },
  { flush: 'sync' },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
  if (enterReleaseFrame !== null) cancelAnimationFrame(enterReleaseFrame)
})

defineExpose({ mediaPage, mediaPageError })
</script>

<template>
  <main class="gallery-shell">
    <p
      v-if="mediaPageError"
      class="gallery-status"
      role="alert"
    >
      Unable to load media.
    </p>

    <p
      v-else-if="!mediaPage"
      class="gallery-status"
      role="status"
    >
      Loading media…
    </p>

    <p
      v-else-if="mediaPage.items.length === 0"
      class="gallery-status"
    >
      No media found.
    </p>

    <section
      v-else
      ref="masonryElement"
      class="masonry"
      :class="{ 'masonry--ready': masonryWidth > 0 }"
      :style="masonryStyle"
      aria-label="Media gallery"
    >
      <article
        v-for="(item, index) in mediaPage.items"
        :key="item.postId"
        class="masonry-item"
        :class="{ 'masonry-item--entering': enteringPostIds.has(item.postId) }"
        :style="masonryItemStyles[index]"
      >
        <video
          v-if="isVideo(item.preview.src)"
          class="media-preview"
          :src="item.preview.src"
          :width="item.preview.width ?? undefined"
          :height="item.preview.height ?? undefined"
          autoplay
          loop
          muted
          playsinline
          preload="metadata"
        />

        <img
          v-else
          class="media-preview"
          :src="item.preview.src"
          :width="item.preview.width ?? undefined"
          :height="item.preview.height ?? undefined"
          alt=""
          decoding="async"
        >
      </article>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html) {
  min-width: 320px;
  color-scheme: dark;
  background: #080808;
}

:global(body) {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: #080808;
}

.gallery-shell {
  min-height: 100vh;
  padding: clamp(0.375rem, 1vw, 0.875rem);
}

.gallery-status {
  display: grid;
  min-height: calc(100vh - 1.75rem);
  margin: 0;
  place-items: center;
  color: #a3a3a3;
  font: 500 0.875rem/1.5 system-ui, sans-serif;
}

.masonry {
  position: relative;
  overflow: clip;
  opacity: 0;
  transition: opacity 160ms ease;
}

.masonry--ready {
  opacity: 1;
}

.masonry-item {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #171717;
  transition:
    width 160ms ease,
    height 160ms ease,
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1) var(--masonry-entry-delay, 0ms);
}

.masonry-item--entering {
  transition: none;
  will-change: transform;
}

.media-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #171717;
}

@media (prefers-reduced-motion: reduce) {
  .masonry,
  .masonry-item {
    transition: none;
  }
}

</style>
