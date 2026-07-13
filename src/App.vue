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
import { calculateMasonryLayout } from '@/demo/masonry'

const MIN_COLUMN_WIDTH = 240
const MIN_GAP = 6
const MAX_GAP = 12

const mediaPage = shallowRef<FakeMediaPage | null>(null)
const mediaPageError = shallowRef<unknown>(null)
const masonryElement = shallowRef<HTMLElement | null>(null)
const masonryWidth = shallowRef(0)
const masonryGap = shallowRef(MIN_GAP)
let resizeObserver: ResizeObserver | null = null
let resizeFrame: number | null = null

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
  masonryLayout.value.items.map((item) => ({
    width: `${item.width}px`,
    height: `${item.height}px`,
    transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
  }))
))

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

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
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
    transform 160ms ease;
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
