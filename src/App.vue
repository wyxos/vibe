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
  calculateVisibleMasonryIndices,
} from '@/demo/masonry'
import {
  mediaErrorLabel,
  mediaErrorStatus,
  type MediaPreviewState,
} from '@/demo/mediaPreview'

const MIN_COLUMN_WIDTH = 240
const MIN_GAP = 6
const MAX_GAP = 12
const ENTRY_STAGGER_MS = 35
const LOAD_MORE_THRESHOLD = 240
const VIRTUAL_OVERSCAN_MIN = 800
const VIRTUAL_OVERSCAN_FACTOR = 1.5

const mediaPage = shallowRef<FakeMediaPage | null>(null)
const mediaPageError = shallowRef<unknown>(null)
const nextPageError = shallowRef<unknown>(null)
const galleryElement = shallowRef<HTMLElement | null>(null)
const masonryElement = shallowRef<HTMLElement | null>(null)
const masonryWidth = shallowRef(0)
const masonryGap = shallowRef(MIN_GAP)
const galleryScrollTop = shallowRef(0)
const galleryViewportHeight = shallowRef(0)
const masonryContentTop = shallowRef(0)
const infiniteScroll = shallowRef(true)
const isLoadingMore = shallowRef(false)
const enteringPostIds = shallowRef<ReadonlySet<number>>(new Set())
const entryDelays = shallowRef<ReadonlyMap<number, number>>(new Map())
const mediaPreviewStates = shallowRef<ReadonlyMap<number, MediaPreviewState>>(new Map())
let previousPostIds = new Set<number>()
let resizeObserver: ResizeObserver | null = null
let galleryResizeObserver: ResizeObserver | null = null
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

const visibleMasonryItems = computed(() => {
  const media = mediaPage.value?.items ?? []
  const overscan = Math.max(
    VIRTUAL_OVERSCAN_MIN,
    galleryViewportHeight.value * VIRTUAL_OVERSCAN_FACTOR,
  )
  const indices = calculateVisibleMasonryIndices(
    masonryLayout.value.items,
    {
      scrollTop: galleryScrollTop.value - masonryContentTop.value,
      viewportHeight: galleryViewportHeight.value,
      overscan,
    },
  )
  const viewportIndices = new Set(calculateVisibleMasonryIndices(
    masonryLayout.value.items,
    {
      scrollTop: galleryScrollTop.value - masonryContentTop.value,
      viewportHeight: galleryViewportHeight.value,
      overscan: 0,
    },
  ))

  return indices.flatMap((index) => {
    const item = media[index]

    return item ? [{
      fetchPriority: viewportIndices.has(index) ? 'high' as const : 'low' as const,
      index,
      item,
    }] : []
  })
})

function masonryEntryOffset(): number {
  return calculateMasonryEntryOffset({
    containerHeight: masonryLayout.value.height,
    gap: masonryGap.value,
  })
}

function masonryItemStyle(index: number): CSSProperties {
  const position = masonryLayout.value.items[index]
  const postId = mediaPage.value?.items[index]?.postId

  if (!position) return {}

  const entryOffset = postId !== undefined && enteringPostIds.value.has(postId)
    ? masonryEntryOffset()
    : 0
  const entryDelay = postId === undefined
    ? 0
    : entryDelays.value.get(postId) ?? 0

  return {
    '--masonry-entry-delay': `${entryDelay}ms`,
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    transform: `translate3d(0, ${entryOffset}px, 0)`,
  }
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
  measureVirtualViewport()
}

function measureVirtualViewport(): void {
  const gallery = galleryElement.value
  const masonry = masonryElement.value

  if (!gallery) return

  galleryScrollTop.value = gallery.scrollTop
  galleryViewportHeight.value = gallery.clientHeight

  if (!masonry) return

  masonryContentTop.value = masonry.getBoundingClientRect().top
    - gallery.getBoundingClientRect().top
    + gallery.scrollTop
}

function isVideo(src: string): boolean {
  try {
    return /\.(mp4|webm|mov)$/i.test(new URL(src).pathname)
  } catch {
    return /\.(mp4|webm|mov)(?:$|\?)/i.test(src)
  }
}

function mediaPreviewState(postId: number): MediaPreviewState {
  return mediaPreviewStates.value.get(postId) ?? 'loading'
}

function setMediaPreviewState(postId: number, state: MediaPreviewState): void {
  if (mediaPreviewStates.value.get(postId) === state) return

  mediaPreviewStates.value = new Map(mediaPreviewStates.value).set(postId, state)
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
  const element = event.currentTarget as HTMLElement | null
  if (!element) return

  galleryScrollTop.value = element.scrollTop

  if (infiniteScroll.value && isNearGalleryBottom(element)) void loadNextPage()
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

watch(galleryElement, (element) => {
  galleryResizeObserver?.disconnect()
  galleryResizeObserver = null

  if (!element) return

  measureVirtualViewport()

  if (typeof ResizeObserver === 'undefined') return

  galleryResizeObserver = new ResizeObserver(() => {
    measureVirtualViewport()
  })
  galleryResizeObserver.observe(element)
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
  galleryResizeObserver?.disconnect()
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
            v-for="({ fetchPriority, item, index }) in visibleMasonryItems"
            :key="item.postId"
            :data-post-id="item.postId"
            class="masonry-item"
            :class="{
              'masonry-item--entering': enteringPostIds.has(item.postId),
              'masonry-item--error': mediaPreviewState(item.postId) === 'error',
            }"
            :style="masonryItemStyle(index)"
            :aria-busy="mediaPreviewState(item.postId) === 'loading'"
          >
            <div
              v-if="mediaPreviewState(item.postId) === 'loading'"
              data-test="media-loading"
              class="media-loading"
              aria-hidden="true"
            >
              <span class="media-loading-shimmer" />
            </div>

            <div
              v-else-if="mediaPreviewState(item.postId) === 'error'"
              data-test="media-error"
              class="media-error"
              role="img"
              :aria-label="`${mediaErrorStatus(item.preview.src)} ${mediaErrorLabel(item.preview.src)}`"
            >
              <strong class="media-error-code">
                {{ mediaErrorStatus(item.preview.src) }}
              </strong>
              <span>{{ mediaErrorLabel(item.preview.src) }}</span>
            </div>

            <video
              v-if="isVideo(item.preview.src)"
              class="media-preview"
              :class="{ 'media-preview--ready': mediaPreviewState(item.postId) === 'ready' }"
              :src="item.preview.src"
              :width="item.preview.width ?? undefined"
              :height="item.preview.height ?? undefined"
              autoplay
              loop
              muted
              playsinline
              :preload="fetchPriority === 'high' ? 'auto' : 'metadata'"
              @loadedmetadata="setMediaPreviewState(item.postId, 'ready')"
              @error="setMediaPreviewState(item.postId, 'error')"
            />

            <img
              v-else
              class="media-preview"
              :class="{ 'media-preview--ready': mediaPreviewState(item.postId) === 'ready' }"
              :src="item.preview.src"
              :width="item.preview.width ?? undefined"
              :height="item.preview.height ?? undefined"
              :fetchpriority="fetchPriority"
              alt=""
              decoding="async"
              loading="eager"
              @load="setMediaPreviewState(item.postId, 'ready')"
              @error="setMediaPreviewState(item.postId, 'error')"
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
