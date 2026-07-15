<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'

import type { MediaPreviewState } from '../core/mediaPreview'
import type { VibeRuntimeState } from '../core/runtime'
import type { VibeItemId } from '../types'
import MasonryFeed from './MasonryFeed.vue'
import ReelFeed from './ReelFeed.vue'

const ENTRY_STAGGER_MS = 35

interface FeedRendererExpose {
  loadIfNearBottom: () => void
}

const props = defineProps<{
  state: VibeRuntimeState
}>()

const emit = defineEmits<{
  activeReelChange: [postId: VibeItemId]
  closeReel: []
  loadMore: []
  openReel: [postId: VibeItemId]
}>()

const masonryRenderer = shallowRef<FeedRendererExpose | null>(null)
const reelRenderer = shallowRef<FeedRendererExpose | null>(null)
const reelOverlay = shallowRef<HTMLElement | null>(null)
const surfaceElement = shallowRef<HTMLElement | null>(null)
const enteringPostIds = shallowRef<ReadonlySet<VibeItemId>>(new Set())
const entryDelays = shallowRef<ReadonlyMap<VibeItemId, number>>(new Map())
const mediaPreviewStates = shallowRef<ReadonlyMap<VibeItemId, MediaPreviewState>>(new Map())
let previousPostIds = new Set<VibeItemId>()
let enterReleaseFrame: number | null = null
let restoreFocusPostId: VibeItemId | null = null

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

function setMediaPreviewState(postId: VibeItemId, state: MediaPreviewState): void {
  if (mediaPreviewStates.value.get(postId) === state) return

  mediaPreviewStates.value = new Map(mediaPreviewStates.value).set(postId, state)
}

async function loadIfNearBottom(): Promise<void> {
  await nextTick()
  const renderer = props.state.layout === 'reel' || props.state.reelOrigin === 'masonry'
    ? reelRenderer.value
    : masonryRenderer.value
  renderer?.loadIfNearBottom()
}

function activateMasonryItem(postId: VibeItemId): void {
  restoreFocusPostId = postId
  emit('openReel', postId)
  void nextTick(() => reelOverlay.value?.focus())
}

function closeMasonryReel(): void {
  if (props.state.reelOrigin !== 'masonry') return

  const postId = restoreFocusPostId ?? props.state.activeReelPostId
  emit('closeReel')
  void nextTick(() => {
    if (postId === null) return

    const cards = surfaceElement.value
      ?.querySelectorAll<HTMLElement>('.masonry-feed [data-post-id]') ?? []
    Array.from(cards).find((card) => card.dataset.postId === String(postId))?.focus()
    restoreFocusPostId = null
  })
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || props.state.reelOrigin !== 'masonry') return

  event.preventDefault()
  closeMasonryReel()
}

watch(
  () => props.state.items.map((item) => item.postId),
  (postIds) => {
    const addedPostIds = postIds.filter((postId) => !previousPostIds.has(postId))
    previousPostIds = new Set(postIds)
    if (addedPostIds.length === 0 || prefersReducedMotion()) return

    const nextEntryDelays = new Map<VibeItemId, number>()
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

onMounted(() => window.addEventListener('keydown', onKeydown))

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (enterReleaseFrame !== null) cancelAnimationFrame(enterReleaseFrame)
})

defineExpose({ loadIfNearBottom })
</script>

<template>
  <div
    ref="surfaceElement"
    class="vibe-surface"
  >
    <main
      v-if="state.error"
      class="gallery-shell"
      role="alert"
    >
      <p class="gallery-status">
        Unable to load media.
      </p>
    </main>

    <main
      v-else-if="state.isLoading"
      class="gallery-shell"
      role="status"
    >
      <p class="gallery-status">
        Loading media…
      </p>
    </main>

    <main
      v-else-if="state.items.length === 0"
      class="gallery-shell"
    >
      <p class="gallery-status">
        No media found.
      </p>
    </main>

    <ReelFeed
      v-else-if="state.layout === 'reel'"
      ref="reelRenderer"
      :has-next="state.next !== null"
      :infinite-scroll="state.infiniteScroll"
      :is-loading-more="state.isLoadingMore"
      :items="state.items"
      :initial-post-id="state.activeReelPostId"
      :next-page-error="Boolean(state.nextPageError)"
      :preview-states="mediaPreviewStates"
      @active-change="emit('activeReelChange', $event)"
      @error="setMediaPreviewState($event, 'error')"
      @load-more="emit('loadMore')"
      @ready="setMediaPreviewState($event, 'ready')"
    />

    <template v-else>
      <MasonryFeed
        ref="masonryRenderer"
        :entering-post-ids="enteringPostIds"
        :entry-delays="entryDelays"
        :has-next="state.next !== null"
        :infinite-scroll="state.infiniteScroll"
        :is-loading-more="state.isLoadingMore"
        :items="state.items"
        :next-page-error="Boolean(state.nextPageError)"
        :preview-states="mediaPreviewStates"
        :suspended="state.reelOrigin === 'masonry'"
        @activate="activateMasonryItem"
        @error="setMediaPreviewState($event, 'error')"
        @load-more="emit('loadMore')"
        @ready="setMediaPreviewState($event, 'ready')"
      />

      <section
        v-if="state.reelOrigin === 'masonry'"
        ref="reelOverlay"
        class="vibe-reel-overlay"
        role="dialog"
        aria-label="Media viewer"
        aria-modal="true"
        tabindex="-1"
      >
        <ReelFeed
          ref="reelRenderer"
          :has-next="state.next !== null"
          :infinite-scroll="state.infiniteScroll"
          :initial-post-id="state.activeReelPostId"
          :is-loading-more="state.isLoadingMore"
          :items="state.items"
          :next-page-error="Boolean(state.nextPageError)"
          :preview-states="mediaPreviewStates"
          @active-change="emit('activeReelChange', $event)"
          @error="setMediaPreviewState($event, 'error')"
          @load-more="emit('loadMore')"
          @ready="setMediaPreviewState($event, 'ready')"
        />
      </section>
    </template>
  </div>
</template>
