<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
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
  loadMore: []
}>()

const feedRenderer = shallowRef<FeedRendererExpose | null>(null)
const enteringPostIds = shallowRef<ReadonlySet<VibeItemId>>(new Set())
const entryDelays = shallowRef<ReadonlyMap<VibeItemId, number>>(new Map())
const mediaPreviewStates = shallowRef<ReadonlyMap<VibeItemId, MediaPreviewState>>(new Map())
let previousPostIds = new Set<VibeItemId>()
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

function setMediaPreviewState(postId: VibeItemId, state: MediaPreviewState): void {
  if (mediaPreviewStates.value.get(postId) === state) return

  mediaPreviewStates.value = new Map(mediaPreviewStates.value).set(postId, state)
}

async function loadIfNearBottom(): Promise<void> {
  await nextTick()
  feedRenderer.value?.loadIfNearBottom()
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

onBeforeUnmount(() => {
  if (enterReleaseFrame !== null) cancelAnimationFrame(enterReleaseFrame)
})

defineExpose({ loadIfNearBottom })
</script>

<template>
  <div class="vibe-surface">
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
      ref="feedRenderer"
      :has-next="state.next !== null"
      :infinite-scroll="state.infiniteScroll"
      :is-loading-more="state.isLoadingMore"
      :items="state.items"
      :next-page-error="Boolean(state.nextPageError)"
      :preview-states="mediaPreviewStates"
      @error="setMediaPreviewState($event, 'error')"
      @load-more="emit('loadMore')"
      @ready="setMediaPreviewState($event, 'ready')"
    />

    <MasonryFeed
      v-else
      ref="feedRenderer"
      :entering-post-ids="enteringPostIds"
      :entry-delays="entryDelays"
      :has-next="state.next !== null"
      :infinite-scroll="state.infiniteScroll"
      :is-loading-more="state.isLoadingMore"
      :items="state.items"
      :next-page-error="Boolean(state.nextPageError)"
      :preview-states="mediaPreviewStates"
      @error="setMediaPreviewState($event, 'error')"
      @load-more="emit('loadMore')"
      @ready="setMediaPreviewState($event, 'ready')"
    />
  </div>
</template>
