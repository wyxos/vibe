<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'

import { getFakeMediaPage, type FakeMediaPage } from '@/demo/fakeServer'
import MasonryFeed from '@/demo/MasonryFeed.vue'
import type { MediaPreviewState } from '@/demo/mediaPreview'
import ReelFeed from '@/demo/ReelFeed.vue'
import { shouldForceSingleColumnForElement } from '@/demo/responsiveFeed'

const ENTRY_STAGGER_MS = 35

interface FeedRendererExpose {
  loadIfNearBottom: () => void
}

const appElement = shallowRef<HTMLElement | null>(null)
const feedRenderer = shallowRef<FeedRendererExpose | null>(null)
const mediaPage = shallowRef<FakeMediaPage | null>(null)
const mediaPageError = shallowRef<unknown>(null)
const nextPageError = shallowRef<unknown>(null)
const reelMode = shallowRef(false)
const infiniteScroll = shallowRef(true)
const isLoadingMore = shallowRef(false)
const enteringPostIds = shallowRef<ReadonlySet<number>>(new Set())
const entryDelays = shallowRef<ReadonlyMap<number, number>>(new Map())
const mediaPreviewStates = shallowRef<ReadonlyMap<number, MediaPreviewState>>(new Map())
let previousPostIds = new Set<number>()
let responsiveResizeObserver: ResizeObserver | null = null
let enterReleaseFrame: number | null = null

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

function updateResponsiveMode(): void {
  const element = appElement.value
  if (element) reelMode.value = shouldForceSingleColumnForElement(element)
}

function setMediaPreviewState(postId: number, state: MediaPreviewState): void {
  if (mediaPreviewStates.value.get(postId) === state) return

  mediaPreviewStates.value = new Map(mediaPreviewStates.value).set(postId, state)
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

async function onInfiniteScrollChange(): Promise<void> {
  if (!infiniteScroll.value) return

  await nextTick()
  feedRenderer.value?.loadIfNearBottom()
}

watch(appElement, (element) => {
  responsiveResizeObserver?.disconnect()
  responsiveResizeObserver = null
  if (!element) return

  updateResponsiveMode()
  if (typeof ResizeObserver === 'undefined') return

  responsiveResizeObserver = new ResizeObserver(updateResponsiveMode)
  responsiveResizeObserver.observe(element)
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
    enteringPostIds.value = new Set([...enteringPostIds.value, ...addedPostIds])
    scheduleEnterRelease()
  },
  { flush: 'sync' },
)

onMounted(async () => {
  window.addEventListener('resize', updateResponsiveMode)

  try {
    mediaPage.value = await getFakeMediaPage(null)
  } catch (error: unknown) {
    mediaPageError.value = error
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateResponsiveMode)
  responsiveResizeObserver?.disconnect()
  if (enterReleaseFrame !== null) cancelAnimationFrame(enterReleaseFrame)
})

defineExpose({
  infiniteScroll,
  isLoadingMore,
  loadNextPage,
  mediaPage,
  mediaPageError,
  reelMode,
})
</script>

<template>
  <div
    ref="appElement"
    class="app-shell"
  >
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
      v-if="mediaPageError"
      class="gallery-shell"
      role="alert"
    >
      <p class="gallery-status">
        Unable to load media.
      </p>
    </main>

    <main
      v-else-if="!mediaPage"
      class="gallery-shell"
      role="status"
    >
      <p class="gallery-status">
        Loading media…
      </p>
    </main>

    <main
      v-else-if="mediaPage.items.length === 0"
      class="gallery-shell"
    >
      <p class="gallery-status">
        No media found.
      </p>
    </main>

    <ReelFeed
      v-else-if="reelMode"
      ref="feedRenderer"
      :has-next="Boolean(mediaPage.meta.next)"
      :infinite-scroll="infiniteScroll"
      :is-loading-more="isLoadingMore"
      :items="mediaPage.items"
      :next-page-error="Boolean(nextPageError)"
      :preview-states="mediaPreviewStates"
      @error="setMediaPreviewState($event, 'error')"
      @load-more="loadNextPage"
      @ready="setMediaPreviewState($event, 'ready')"
    />

    <MasonryFeed
      v-else
      ref="feedRenderer"
      :entering-post-ids="enteringPostIds"
      :entry-delays="entryDelays"
      :has-next="Boolean(mediaPage.meta.next)"
      :infinite-scroll="infiniteScroll"
      :is-loading-more="isLoadingMore"
      :items="mediaPage.items"
      :next-page-error="Boolean(nextPageError)"
      :preview-states="mediaPreviewStates"
      @error="setMediaPreviewState($event, 'error')"
      @load-more="loadNextPage"
      @ready="setMediaPreviewState($event, 'ready')"
    />
  </div>
</template>
