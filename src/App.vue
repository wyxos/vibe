<script setup lang="ts">
import {
  computed,
  nextTick,
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
const LOAD_MORE_THRESHOLD = 240

const mediaPage = shallowRef<FakeMediaPage | null>(null)
const mediaPageError = shallowRef<unknown>(null)
const nextPageError = shallowRef<unknown>(null)
const galleryElement = shallowRef<HTMLElement | null>(null)
const masonryElement = shallowRef<HTMLElement | null>(null)
const masonryWidth = shallowRef(0)
const masonryGap = shallowRef(MIN_GAP)
const infiniteScroll = shallowRef(true)
const isLoadingMore = shallowRef(false)
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

function isNearGalleryBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= LOAD_MORE_THRESHOLD
}

async function loadNextPage(): Promise<void> {
  const currentPage = mediaPage.value
  const cursor = currentPage?.meta.next

  if (!currentPage || !cursor || isLoadingMore.value) return

  isLoadingMore.value = true
  nextPageError.value = null

  try {
    const nextPage = await getFakeMediaPage(cursor)
    const existingPostIds = new Set(currentPage.items.map((item) => item.postId))

    mediaPage.value = {
      items: [
        ...currentPage.items,
        ...nextPage.items.filter((item) => !existingPostIds.has(item.postId)),
      ],
      meta: nextPage.meta,
    }
  } catch (error: unknown) {
    nextPageError.value = error
  } finally {
    isLoadingMore.value = false
  }
}

function onGalleryScroll(event: Event): void {
  if (!infiniteScroll.value) return

  const element = event.currentTarget as HTMLElement | null
  if (element && isNearGalleryBottom(element)) void loadNextPage()
}

async function onInfiniteScrollChange(): Promise<void> {
  if (!infiniteScroll.value) return

  await nextTick()

  const element = galleryElement.value
  if (element && isNearGalleryBottom(element)) void loadNextPage()
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

defineExpose({
  infiniteScroll,
  isLoadingMore,
  loadNextPage,
  mediaPage,
  mediaPageError,
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <h1 class="app-title">
        Vibe
      </h1>

      <label class="toggle-control">
        <span>Infinite scroll</span>
        <input
          v-model="infiniteScroll"
          data-test="infinite-scroll-toggle"
          class="toggle-input"
          type="checkbox"
          @change="onInfiniteScrollChange"
        >
        <span
          class="toggle-track"
          aria-hidden="true"
        >
          <span class="toggle-thumb" />
        </span>
      </label>
    </header>

    <main
      ref="galleryElement"
      class="gallery-shell"
      @scroll.passive="onGalleryScroll"
    >
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

      <template v-else>
        <section
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

        <footer
          v-if="mediaPage.meta.next || isLoadingMore || nextPageError"
          class="gallery-footer"
        >
          <p
            v-if="isLoadingMore"
            class="load-more-status"
            role="status"
          >
            Loading more…
          </p>

          <button
            v-else-if="!infiniteScroll || nextPageError"
            data-test="load-more"
            class="load-more-button"
            type="button"
            @click="loadNextPage"
          >
            {{ nextPageError ? 'Try again' : 'Load more' }}
          </button>

          <span
            v-else
            class="gallery-sentinel"
            aria-hidden="true"
          />
        </footer>
      </template>
    </main>
  </div>
</template>

<style scoped>
.gallery-status {
  display: grid;
  min-height: calc(100% - 1.75rem);
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

.gallery-footer {
  display: grid;
  min-height: 5rem;
  place-items: center;
}

.gallery-sentinel {
  width: 1px;
  height: 2rem;
}

.load-more-status {
  margin: 0;
  color: #a3a3a3;
  font: 500 0.8125rem/1.5 system-ui, sans-serif;
}

.load-more-button {
  min-width: 8rem;
  min-height: 2.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid #404040;
  border-radius: 999px;
  color: #f5f5f5;
  background: #171717;
  cursor: pointer;
  font: 600 0.8125rem/1 system-ui, sans-serif;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.load-more-button:hover {
  border-color: #737373;
  background: #262626;
}

.load-more-button:active {
  transform: translateY(1px);
}

.load-more-button:focus-visible {
  outline: 2px solid #a3a3a3;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .masonry,
  .masonry-item,
  .toggle-track,
  .toggle-thumb,
  .load-more-button {
    transition: none;
  }
}

</style>
