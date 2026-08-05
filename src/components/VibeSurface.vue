<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  shallowRef,
  watch,
  type CSSProperties,
} from 'vue'
import type { MediaPreviewState } from '../core/mediaPreview'
import { clampMediaIndex, mediaAssets, mediaStateKey } from '../core/mediaAsset'
import { mediaLifecycleContext, useReelMediaChangeLifecycle } from '../core/mediaLifecycle'
import type { FeedRendererExpose } from '../core/feed'
import { snapshotState, type VibeRuntimeState } from '../core/runtime'
import type {
  VibeCardRegion,
  VibeFeedFooter,
  VibeFeedFooterActions,
  VibeItemId,
  VibeLayout,
  VibeMediaCardOptions,
  VibeMediaLifecycleContext,
  VibeReelInfoSheetOptions,
  VibeReelItemTarget,
  VibeReelNavigationResult,
  VibeReelOrigin,
} from '../types'
import FeedStatus from './FeedStatus.vue'
import MasonryFeed from './MasonryFeed.vue'
import ReelLayout from './ReelLayout.vue'
import { useReelKeyboard } from './useReelKeyboard'
const ENTRY_STAGGER_MS = 35
const ITEM_MOTION_MS = 420
type ReelOriginStyle = CSSProperties & Record<`--vibe-reel-origin-${string}`, string>

const props = defineProps<{
  canRetryEnd: boolean
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
  feedFooter?: VibeFeedFooter
  feedFooterActions: VibeFeedFooterActions
  mediaCard?: VibeMediaCardOptions
  reelInfoSheet?: VibeReelInfoSheetOptions
  state: VibeRuntimeState
}>()
const emit = defineEmits<{
  activeReelChange: [postId: VibeItemId]
  closeReel: []
  loadMore: []
  mediaReady: [context: VibeMediaLifecycleContext]
  openReel: [postId: VibeItemId]
  reelMediaChange: [context: VibeMediaLifecycleContext]
  reelInfoSheetChange: [enabled: boolean]
  retryEnd: []
  retryForward: []
}>()
const masonryRenderer = shallowRef<FeedRendererExpose | null>(null)
const reelRenderer = shallowRef<FeedRendererExpose | null>(null)
const reelOverlay = shallowRef<HTMLElement | null>(null)
const surfaceElement = shallowRef<HTMLElement | null>(null)
const reelOriginStyle = shallowRef<ReelOriginStyle>({})
const isReelLeaving = shallowRef(false)
const enteringPostIds = shallowRef<ReadonlySet<VibeItemId>>(new Set())
const entryDelays = shallowRef<ReadonlyMap<VibeItemId, number>>(new Map())
const leavingPostIds = shallowRef<ReadonlySet<VibeItemId>>(new Set())
const removalDelays = shallowRef<ReadonlyMap<VibeItemId, number>>(new Map())
const mediaPreviewStates = shallowRef<ReadonlyMap<string, MediaPreviewState>>(new Map())
const mediaOriginalStates = shallowRef<ReadonlyMap<string, MediaPreviewState>>(new Map())
const footerState = computed(() => snapshotState(props.state))
const reelMediaStates = computed(() => props.state.reelMediaSource === 'original'
  ? mediaOriginalStates.value
  : mediaPreviewStates.value)
let previousPostIds = new Set<VibeItemId>(
  props.state.items.map((item) => item.postId),
)
let enterReleaseFrame: number | null = null
let restoreFocusPostId: VibeItemId | null = null
let restoreFocusVisible = false

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

function setMediaPreviewState(
  postId: VibeItemId,
  mediaIndex: number,
  state: MediaPreviewState,
): void {
  const key = mediaStateKey(postId, mediaIndex)
  if (mediaPreviewStates.value.get(key) === state) return

  mediaPreviewStates.value = new Map(mediaPreviewStates.value).set(key, state)
}

function setMediaOriginalState(
  postId: VibeItemId,
  mediaIndex: number,
  state: MediaPreviewState,
): void {
  const key = mediaStateKey(postId, mediaIndex)
  if (mediaOriginalStates.value.get(key) === state) return

  mediaOriginalStates.value = new Map(mediaOriginalStates.value).set(key, state)
}

function markMediaPreviewError(postId: VibeItemId, mediaIndex: number): void {
  setMediaPreviewState(postId, mediaIndex, 'error')
}

function markMediaPreviewReady(postId: VibeItemId, mediaIndex: number): void {
  setMediaPreviewState(postId, mediaIndex, 'ready')
  emitMediaReady(postId, mediaIndex, 'masonry', null)
}

function markMediaOriginalError(postId: VibeItemId, mediaIndex: number): void {
  setMediaOriginalState(postId, mediaIndex, 'error')
}

function markReelMediaError(postId: VibeItemId, mediaIndex: number): void {
  if (props.state.reelMediaSource === 'original') {
    markMediaOriginalError(postId, mediaIndex)
    return
  }
  markMediaPreviewError(postId, mediaIndex)
}

function markReelMediaReady(postId: VibeItemId, mediaIndex: number): void {
  if (props.state.reelMediaSource === 'original') {
    setMediaOriginalState(postId, mediaIndex, 'ready')
  } else {
    setMediaPreviewState(postId, mediaIndex, 'ready')
  }
  emitMediaReady(postId, mediaIndex, 'reel', props.state.reelOrigin ?? 'reel')
}

function emitMediaReady(
  postId: VibeItemId,
  mediaIndex: number,
  layout: VibeLayout,
  origin: VibeReelOrigin | null,
): void {
  const context = mediaLifecycleContext(props.state, postId, mediaIndex, layout, origin)
  if (context) emit('mediaReady', context)
}

function setMediaIndex(postId: VibeItemId, mediaIndex: number): void {
  const item = props.state.items.find((candidate) => candidate.postId === postId)
  if (!item) return

  const nextIndex = clampMediaIndex(item, mediaIndex)
  if ((props.state.mediaIndices.get(postId) ?? 0) === nextIndex) return

  props.state.mediaIndices = new Map(props.state.mediaIndices).set(postId, nextIndex)
}

async function loadIfNearBottom(): Promise<void> {
  await nextTick()
  const renderer = props.state.layout === 'reel' || props.state.reelOrigin === 'masonry'
    ? reelRenderer.value
    : masonryRenderer.value
  renderer?.loadIfNearBottom()
}

function changeActiveReelMedia(direction: -1 | 1): boolean {
  if (props.state.isLoading || props.state.items.length === 0) return false
  if (props.state.layout !== 'reel' && props.state.reelOrigin !== 'masonry') return false

  return reelRenderer.value?.changeActiveMedia?.(direction) ?? false
}

function moveActiveReelPost(direction: -1 | 1): boolean {
  if (props.state.isLoading || props.state.items.length === 0) return false
  if (props.state.layout !== 'reel' && props.state.reelOrigin !== 'masonry') return false

  return reelRenderer.value?.moveActivePost?.(direction) ?? false
}

function navigateToReelItem(target: VibeReelItemTarget): VibeReelNavigationResult {
  const reelActive = props.state.layout === 'reel' || props.state.reelOrigin === 'masonry'
  if (!reelActive || props.state.isLoading) return 'reel-inactive'

  const item = props.state.items.find((candidate) => candidate.postId === target.postId)
  if (!item) return 'not-found'

  const mediaIndex = mediaAssets(item).findIndex((media) => media.mediaId === target.mediaId)
  if (mediaIndex < 0) return 'not-found'

  return reelRenderer.value?.navigateToItem?.(target.postId, mediaIndex)
    ? 'navigated'
    : 'reel-inactive'
}

function getAutoScrollElement(): HTMLElement | null {
  if (props.state.layout !== 'masonry' || props.state.reelOrigin === 'masonry') return null
  return masonryRenderer.value?.getScrollElement?.() ?? null
}

function activateMasonryItem(
  postId: VibeItemId,
  input: 'keyboard' | 'pointer',
): void {
  restoreFocusPostId = postId
  restoreFocusVisible = input === 'keyboard'
  reelOriginStyle.value = getReelOriginStyle(postId)
  emit('openReel', postId)
  void nextTick(() => reelOverlay.value?.focus())
}

function findMasonryCard(postId: VibeItemId): HTMLElement | null {
  const cards = surfaceElement.value
    ?.querySelectorAll<HTMLElement>('.masonry-feed [data-post-id]') ?? []

  return Array.from(cards).find((card) => card.dataset.postId === String(postId)) ?? null
}

function startItemRemoval(postIds: readonly VibeItemId[]): number {
  if (
    props.state.layout !== 'masonry'
    || props.state.reelOrigin !== null
    || prefersReducedMotion()
  ) return 0

  const removalPostIds = [...new Set(postIds)]
  const visiblePostIds = removalPostIds.filter(findMasonryCard)
  if (visiblePostIds.length === 0) return 0

  const nextDelays = new Map(removalDelays.value)
  visiblePostIds.forEach((postId, index) => {
    nextDelays.set(postId, index * ENTRY_STAGGER_MS)
  })
  enteringPostIds.value = new Set(
    [...enteringPostIds.value].filter((postId) => !visiblePostIds.includes(postId)),
  )
  leavingPostIds.value = new Set([...leavingPostIds.value, ...removalPostIds])
  removalDelays.value = nextDelays
  return ITEM_MOTION_MS + ((visiblePostIds.length - 1) * ENTRY_STAGGER_MS)
}

function focusMasonryCard(postId: VibeItemId, showFocusRing: boolean): void {
  const card = findMasonryCard(postId)
  const activator = card?.querySelector<HTMLElement>('.media-card-activator')
  const focusTarget = activator ?? card
  if (!focusTarget) return

  focusTarget.classList.toggle('media-card-focus-silent', !showFocusRing)
  if (!showFocusRing) {
    focusTarget.addEventListener('blur', () => {
      focusTarget.classList.remove('media-card-focus-silent')
    }, { once: true })
  }
  focusTarget?.focus({ preventScroll: true })
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
  const showFocusRing = restoreFocusVisible
  isReelLeaving.value = false
  restoreFocusPostId = null
  restoreFocusVisible = false
  reelOriginStyle.value = {}
  void nextTick(() => {
    if (postId !== null) focusMasonryCard(postId, showFocusRing)
  })
}

useReelKeyboard({
  closeMasonryReel,
  element: () => surfaceElement.value,
  isReelLeaving: () => isReelLeaving.value,
  reelRenderer: () => reelRenderer.value,
  setReelInfoSheet: (enabled) => emit('reelInfoSheetChange', enabled),
  state: props.state,
})

useReelMediaChangeLifecycle(props.state, (context) => emit('reelMediaChange', context))

watch(
  () => props.state.items.map((item) => item.postId),
  (postIds) => {
    const addedPostIds = postIds.filter((postId) => !previousPostIds.has(postId))
    const currentPostIds = new Set(postIds)
    previousPostIds = new Set(postIds)
    leavingPostIds.value = new Set(
      [...leavingPostIds.value].filter((postId) => currentPostIds.has(postId)),
    )
    removalDelays.value = new Map(
      [...removalDelays.value].filter(([postId]) => currentPostIds.has(postId)),
    )
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

defineExpose({
  changeActiveReelMedia,
  getAutoScrollElement,
  loadIfNearBottom,
  moveActiveReelPost,
  navigateToReelItem,
  startItemRemoval,
  transitionActiveReelMedia: (direction: -1 | 1) => reelRenderer.value?.transitionActiveMedia?.(direction) ?? Promise.resolve(false),
  transitionActiveReelPost: (postId: VibeItemId) => reelRenderer.value?.transitionActivePost?.(postId) ?? Promise.resolve(false),
})
</script>

<template>
  <div
    ref="surfaceElement"
    class="vibe-surface"
  >
    <ReelLayout
      v-if="state.layout === 'reel' && (state.items.length > 0 || state.reelForward.status !== 'idle')"
      ref="reelRenderer"
      :can-retry-end="canRetryEnd"
      :has-next="state.next !== null"
      :card-footer="cardFooter"
      :card-header="cardHeader"
      :feed-footer="feedFooter"
      :feed-footer-actions="feedFooterActions"
      :forward-index="state.reelForwardIndex"
      :forward-item="state.reelForwardItem"
      :media-card="mediaCard"
      :infinite-scroll="state.infiniteScroll"
      :is-loading-more="state.isLoadingMore"
      :items="state.items"
      :load-more-locked="state.loadMoreLocked"
      :media-source="state.reelMediaSource"
      :media-indices="state.mediaIndices"
      :initial-post-id="state.activeReelPostId"
      :info-sheet="reelInfoSheet"
      :info-sheet-enabled="state.reelInfoSheet.enabled"
      :info-sheet-overlay="state.reelInfoSheetOverlay"
      :next-page-error="Boolean(state.nextPageError)"
      origin="reel"
      :preview-states="reelMediaStates"
      :reel-auto-advance="state.reelAutoAdvance"
      :reel-forward="state.reelForward"
      :state="footerState"
      :total="state.total"
      @active-change="emit('activeReelChange', $event)"
      @close-info-sheet="emit('reelInfoSheetChange', false)"
      @error="markReelMediaError"
      @load-more="emit('loadMore')"
      @media-change="setMediaIndex"
      @ready="markReelMediaReady"
      @retry-end="emit('retryEnd')"
      @retry-forward="emit('retryForward')"
    />

    <FeedStatus
      v-else-if="state.error || state.isLoading || (state.items.length === 0 && state.reelForward.status === 'idle')"
      :actions="feedFooterActions"
      :can-retry-end="canRetryEnd"
      :feed-footer="feedFooter"
      :state="footerState"
      @load-more="emit('loadMore')"
      @retry-end="emit('retryEnd')"
    />

    <template v-else>
      <MasonryFeed
        ref="masonryRenderer"
        :can-retry-end="canRetryEnd"
        :entering-post-ids="enteringPostIds"
        :entry-delays="entryDelays"
        :leaving-post-ids="leavingPostIds"
        :removal-delays="removalDelays"
        :card-footer="cardFooter"
        :card-header="cardHeader"
        :feed-footer="feedFooter"
        :feed-footer-actions="feedFooterActions"
        :media-card="mediaCard"
        :has-next="state.next !== null"
        :infinite-scroll="state.infiniteScroll"
        :is-loading-more="state.isLoadingMore"
        :items="state.items"
        :load-more-locked="state.loadMoreLocked"
        :media-indices="state.mediaIndices"
        :next-page-error="Boolean(state.nextPageError)"
        :preview-states="mediaPreviewStates"
        :suspended="state.reelOrigin === 'masonry' || isReelLeaving"
        :state="footerState"
        :total="state.total"
        @activate="activateMasonryItem"
        @error="markMediaPreviewError"
        @load-more="emit('loadMore')"
        @media-change="setMediaIndex"
        @ready="markMediaPreviewReady"
        @retry-end="emit('retryEnd')"
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
          <ReelLayout
            ref="reelRenderer"
            :can-retry-end="canRetryEnd"
            :card-footer="cardFooter"
            :card-header="cardHeader"
            :feed-footer="feedFooter"
            :feed-footer-actions="feedFooterActions"
            :forward-index="state.reelForwardIndex"
            :forward-item="state.reelForwardItem"
            :media-card="mediaCard"
            :has-next="state.next !== null"
            :infinite-scroll="state.infiniteScroll"
            :initial-post-id="state.activeReelPostId"
            :info-sheet="reelInfoSheet"
            :info-sheet-enabled="state.reelInfoSheet.enabled"
            :info-sheet-overlay="state.reelInfoSheetOverlay"
            :is-loading-more="state.isLoadingMore"
            :items="state.items"
            :load-more-locked="state.loadMoreLocked"
            :media-indices="state.mediaIndices"
            media-source="original"
            :next-page-error="Boolean(state.nextPageError)"
            origin="masonry"
            :preview-states="mediaOriginalStates"
            :reel-auto-advance="state.reelAutoAdvance"
            :reel-forward="state.reelForward"
            :state="footerState"
            :total="state.total"
            @active-change="emit('activeReelChange', $event)"
            @close-info-sheet="emit('reelInfoSheetChange', false)"
            @error="markMediaOriginalError"
            @load-more="emit('loadMore')"
            @media-change="setMediaIndex"
            @ready="markReelMediaReady"
            @retry-end="emit('retryEnd')"
            @retry-forward="emit('retryForward')"
          />
        </section>
      </Transition>
    </template>
  </div>
</template>
