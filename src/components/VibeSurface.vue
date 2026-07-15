<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  type CSSProperties,
} from 'vue'

import type { MediaPreviewState } from '../core/mediaPreview'
import type { VibeRuntimeState } from '../core/runtime'
import type { VibeCardRegion, VibeItemId } from '../types'
import MasonryFeed from './MasonryFeed.vue'
import ReelFeed from './ReelFeed.vue'

const ENTRY_STAGGER_MS = 35

interface FeedRendererExpose {
  loadIfNearBottom: () => void
}

type ReelOriginStyle = CSSProperties & Record<`--vibe-reel-origin-${string}`, string>

const props = defineProps<{
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
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
const reelOriginStyle = shallowRef<ReelOriginStyle>({})
const isReelLeaving = shallowRef(false)
const enteringPostIds = shallowRef<ReadonlySet<VibeItemId>>(new Set())
const entryDelays = shallowRef<ReadonlyMap<VibeItemId, number>>(new Map())
const mediaPreviewStates = shallowRef<ReadonlyMap<VibeItemId, MediaPreviewState>>(new Map())
const mediaOriginalStates = shallowRef<ReadonlyMap<VibeItemId, MediaPreviewState>>(new Map())
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

function setMediaOriginalState(postId: VibeItemId, state: MediaPreviewState): void {
  if (mediaOriginalStates.value.get(postId) === state) return

  mediaOriginalStates.value = new Map(mediaOriginalStates.value).set(postId, state)
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
  reelOriginStyle.value = getReelOriginStyle(postId)
  emit('openReel', postId)
  void nextTick(() => reelOverlay.value?.focus())
}

function findMasonryCard(postId: VibeItemId): HTMLElement | null {
  const cards = surfaceElement.value
    ?.querySelectorAll<HTMLElement>('.masonry-feed [data-post-id]') ?? []

  return Array.from(cards).find((card) => card.dataset.postId === String(postId)) ?? null
}

function focusMasonryCard(postId: VibeItemId): void {
  const card = findMasonryCard(postId)
  const activator = card?.querySelector<HTMLElement>('.media-card-activator')
  const focusTarget = activator ?? card
  focusTarget?.focus()
}

function getReelOriginStyle(postId: VibeItemId): ReelOriginStyle {
  const surface = surfaceElement.value
  const card = findMasonryCard(postId)
  if (surface === null || card === null) return {}

  const surfaceRect = surface.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()

  return {
    '--vibe-reel-origin-top': `${Math.max(0, cardRect.top - surfaceRect.top)}px`,
    '--vibe-reel-origin-right': `${Math.max(0, surfaceRect.right - cardRect.right)}px`,
    '--vibe-reel-origin-bottom': `${Math.max(0, surfaceRect.bottom - cardRect.bottom)}px`,
    '--vibe-reel-origin-left': `${Math.max(0, cardRect.left - surfaceRect.left)}px`,
  }
}

function closeMasonryReel(): void {
  if (props.state.reelOrigin !== 'masonry') return

  restoreFocusPostId ??= props.state.activeReelPostId
  isReelLeaving.value = true
  emit('closeReel')
}

function finishReelLeave(): void {
  const postId = restoreFocusPostId
  isReelLeaving.value = false
  restoreFocusPostId = null
  reelOriginStyle.value = {}
  void nextTick(() => {
    if (postId !== null) focusMasonryCard(postId)
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
      :card-footer="cardFooter"
      :card-header="cardHeader"
      :infinite-scroll="state.infiniteScroll"
      :is-loading-more="state.isLoadingMore"
      :items="state.items"
      :initial-post-id="state.activeReelPostId"
      :next-page-error="Boolean(state.nextPageError)"
      :preview-states="mediaPreviewStates"
      :total="state.total"
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
        :card-footer="cardFooter"
        :card-header="cardHeader"
        :has-next="state.next !== null"
        :infinite-scroll="state.infiniteScroll"
        :is-loading-more="state.isLoadingMore"
        :items="state.items"
        :next-page-error="Boolean(state.nextPageError)"
        :preview-states="mediaPreviewStates"
        :suspended="state.reelOrigin === 'masonry' || isReelLeaving"
        :total="state.total"
        @activate="activateMasonryItem"
        @error="setMediaPreviewState($event, 'error')"
        @load-more="emit('loadMore')"
        @ready="setMediaPreviewState($event, 'ready')"
      />

      <Transition
        name="vibe-reel-viewer"
        @after-leave="finishReelLeave"
      >
        <section
          v-if="state.reelOrigin === 'masonry'"
          ref="reelOverlay"
          class="vibe-reel-overlay"
          role="dialog"
          aria-label="Media viewer"
          aria-modal="true"
          tabindex="-1"
          :style="reelOriginStyle"
        >
          <ReelFeed
            ref="reelRenderer"
            :card-footer="cardFooter"
            :card-header="cardHeader"
            :has-next="state.next !== null"
            :infinite-scroll="state.infiniteScroll"
            :initial-post-id="state.activeReelPostId"
            :is-loading-more="state.isLoadingMore"
            :items="state.items"
            media-source="original"
            :next-page-error="Boolean(state.nextPageError)"
            :preview-states="mediaOriginalStates"
            :total="state.total"
            @active-change="emit('activeReelChange', $event)"
            @error="setMediaOriginalState($event, 'error')"
            @load-more="emit('loadMore')"
            @ready="setMediaOriginalState($event, 'ready')"
          />
        </section>
      </Transition>
    </template>
  </div>
</template>
