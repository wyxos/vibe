<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, watch,
  type CSSProperties } from 'vue'
import { isNearFeedBottom, type ReelFeedProps } from '../core/feed'
import { mediaAssetAt, mediaAssets, mediaPlaybackVariantForSource,
  mediaStateKey } from '../core/mediaAsset'
import { isTimedMedia } from '../core/mediaType'
import { transitionReelScroll } from '../core/reelScrollTransition'
import type { VibeItemId, VibeReelAudioState } from '../types'
import CardRegion from './CardRegion.vue'
import FeedFooter from './FeedFooter.vue'
import MediaCard from './MediaCard.vue'
import ReelAutoAdvanceProgress from './ReelAutoAdvanceProgress.vue'
const MEDIA_TRANSITION_MS = 300
const REMOVAL_REFLOW_SUPPRESSION_MS = 250
let suppressAutomaticLoadUntil = 0
const props = withDefaults(defineProps<ReelFeedProps>(), {
  reelForward: () => ({ error: null, status: 'idle' }),
})
const emit = defineEmits<{
  activeChange: [postId: VibeItemId]
  error: [postId: VibeItemId, mediaIndex: number]
  loadMore: []
  mediaChange: [postId: VibeItemId, mediaIndex: number]
  ready: [postId: VibeItemId, mediaIndex: number]
  reelAudioChange: [state: VibeReelAudioState]
  retryEnd: []
  retryForward: []
}>()
const galleryElement = shallowRef<HTMLElement | null>(null)
const reelControlsElement = shallowRef<HTMLElement | null>(null)
const initialIndex = props.initialPostId === null || props.initialPostId === undefined
  ? -1
  : props.items.findIndex((item) => item.postId === props.initialPostId)
const activeIndex = shallowRef(Math.max(0, initialIndex))
const isFooterVisible = shallowRef(false)
const isResizing = shallowRef(false)
let viewportHeight = 0
let resizeObserver: ResizeObserver | null = null
let restoreFrame: number | null = null
let resizeReleaseTimer: ReturnType<typeof setTimeout> | null = null
const trackStyle = computed<CSSProperties>(() => ({
  gridTemplateRows: `repeat(${props.items.length}, 100cqh)`,
}))
const visibleItems = computed(() => {
  const first = Math.max(0, activeIndex.value - 2)
  const last = Math.min(props.items.length - 1, activeIndex.value + 2)

  return props.items.slice(first, last + 1).map((item, offset) => ({
    fetchPriority: first + offset === activeIndex.value ? 'high' as const : 'low' as const,
    index: first + offset,
    item,
  }))
})
const activePostId = computed(() => props.items[activeIndex.value]?.postId)
const activeItem = computed(() => props.items[activeIndex.value])
const activeMediaIndex = computed(() => {
  const postId = activePostId.value
  return postId === undefined ? 0 : props.mediaIndices.get(postId) ?? 0
})
const activePreviewState = computed(() => {
  const postId = activePostId.value
  if (postId === undefined) return 'loading'
  return props.previewStates.get(mediaStateKey(postId, activeMediaIndex.value)) ?? 'loading'
})
const activeMedia = computed(() => activeItem.value
  ? mediaAssetAt(activeItem.value, activeMediaIndex.value)
  : null)
const activeMediaVariant = computed(() => activeMedia.value
  ? mediaPlaybackVariantForSource(activeMedia.value, props.mediaSource ?? 'preview')
  : null)
const activeMediaWaitsForEnd = computed(() => (
  activePreviewState.value === 'ready'
  && Boolean(activeMediaVariant.value && isTimedMedia(
    activeMediaVariant.value.type,
    activeMediaVariant.value.src,
  ))
))
const autoAdvanceKey = computed(() => [
  activePostId.value,
  activeMediaIndex.value,
  props.items.length,
  props.loadMoreLocked,
  props.reelAutoAdvance.enabled,
  props.reelAutoAdvance.includePostItems,
  props.reelAutoAdvance.intervalMs,
].join(':'))
const autoAdvanceLabel = computed(() => {
  const item = activeItem.value
  const hasNextPostItem = Boolean(
    item
    && props.reelAutoAdvance.includePostItems
    && activeMediaIndex.value < mediaAssets(item).length - 1,
  )
  const seconds = props.reelAutoAdvance.intervalMs / 1_000
  return `Auto advance to the next ${hasNextPostItem ? 'post item' : 'post'} in ${seconds}s`
})
const showAutoAdvance = computed(() => (
  props.reelAutoAdvance.enabled
  && props.reelForward.status === 'idle'
  && activeItem.value !== undefined
  && activePreviewState.value !== 'loading'
  && !activeMediaWaitsForEnd.value
))
const showLoadMore = computed(() => !props.infiniteScroll || props.items.length <= 1)
const forwardMessage = computed(() => {
  if (props.reelForward.status === 'loading') return 'Loading the next media…'
  if (props.reelForward.status === 'error') return 'Unable to load the next media.'
  return 'You reached the end of this feed.'
})

function itemStyle(index: number): CSSProperties {
  return { gridRow: `${index + 1}` }
}

function nearestIndex(element: HTMLElement): number {
  const height = viewportHeight || element.clientHeight
  if (height <= 0 || props.items.length === 0) return 0

  return Math.min(
    props.items.length - 1,
    Math.max(0, Math.round(element.scrollTop / height)),
  )
}

function onScroll(event: Event): void {
  const element = event.currentTarget as HTMLElement | null
  if (!element) return

  const height = viewportHeight || element.clientHeight
  const lastItemAnchor = Math.max(0, props.items.length - 1) * height
  isFooterVisible.value = props.items.length > 0
    && element.scrollTop > lastItemAnchor + 1

  if (!isResizing.value) activeIndex.value = nearestIndex(element)
  if (Date.now() >= suppressAutomaticLoadUntil
    && !props.loadMoreLocked && props.infiniteScroll && isNearFeedBottom(element)) {
    emit('loadMore')
  }
}

function restoreActiveItem(): void {
  const element = galleryElement.value
  if (!element) return

  isFooterVisible.value = false
  setResizeState(true)
  viewportHeight = element.clientHeight
  element.scrollTop = activeIndex.value * viewportHeight

  if (restoreFrame !== null) cancelAnimationFrame(restoreFrame)
  restoreFrame = requestAnimationFrame(() => {
    element.scrollTop = activeIndex.value * element.clientHeight
    viewportHeight = element.clientHeight
    restoreFrame = null
  })

  scheduleResizeRelease()
}

function scheduleResizeRelease(): void {
  if (resizeReleaseTimer !== null) clearTimeout(resizeReleaseTimer)

  resizeReleaseTimer = setTimeout(() => {
    resizeReleaseTimer = null
    const element = galleryElement.value
    if (element) {
      viewportHeight = element.clientHeight
      element.scrollTop = activeIndex.value * viewportHeight
    }
    setResizeState(false)
  }, 120)
}

function beginResize(): void {
  setResizeState(true)
  const element = galleryElement.value
  if (element) {
    viewportHeight = element.clientHeight
    element.scrollTop = activeIndex.value * viewportHeight
  }
  scheduleResizeRelease()
}

function setResizeState(resizing: boolean): void {
  isResizing.value = resizing
  galleryElement.value?.toggleAttribute('data-resizing', resizing)
}

function loadIfNearBottom(): void {
  const element = galleryElement.value
  if (Date.now() >= suppressAutomaticLoadUntil
    && !props.loadMoreLocked && element && isNearFeedBottom(element)) emit('loadMore')
}

watch(() => props.items.length, (count, previous) => {
  if (count > 0 && count < previous) suppressAutomaticLoadUntil = Date.now()
    + REMOVAL_REFLOW_SUPPRESSION_MS
})

function changeActiveMedia(direction: -1 | 1): boolean {
  const item = activeItem.value
  if (!item) return false

  const mediaCount = mediaAssets(item).length
  if (mediaCount <= 1) return false

  const nextIndex = (activeMediaIndex.value + direction + mediaCount) % mediaCount
  emit('mediaChange', item.postId, nextIndex)
  return true
}

function moveActivePost(direction: -1 | 1): boolean {
  const nextIndex = activeIndex.value + direction
  if (!galleryElement.value || nextIndex < 0 || nextIndex >= props.items.length) return false

  advanceToPost(nextIndex)
  return true
}

function navigateToItem(postId: VibeItemId, mediaIndex: number): boolean {
  const index = props.items.findIndex((item) => item.postId === postId)
  const item = props.items[index]
  if (!galleryElement.value || !item || mediaIndex < 0 || mediaIndex > item.items.length) {
    return false
  }

  if ((props.mediaIndices.get(postId) ?? 0) !== mediaIndex) {
    emit('mediaChange', postId, mediaIndex)
  }
  if (index !== activeIndex.value) advanceToPost(index)
  return true
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollToPost(index: number): Promise<void> {
  const element = galleryElement.value
  if (!element) return Promise.resolve()

  const top = index * (viewportHeight || element.clientHeight)
  activeIndex.value = index
  return transitionReelScroll(element, top, prefersReducedMotion())
}

function advanceToPost(index: number): void {
  void scrollToPost(index)
}

async function transitionActivePost(postId: VibeItemId): Promise<boolean> {
  const index = props.items.findIndex((item) => item.postId === postId)
  if (index < 0 || index === activeIndex.value) return false
  await scrollToPost(index)
  return true
}

async function transitionActiveMedia(direction: -1 | 1): Promise<boolean> {
  if (!changeActiveMedia(direction)) return false
  if (!prefersReducedMotion()) {
    await new Promise((resolve) => setTimeout(resolve, MEDIA_TRANSITION_MS))
  }
  return true
}

function onAutoAdvanceComplete(): void {
  if (!props.reelAutoAdvance.enabled) return
  const item = activeItem.value
  if (!item) return

  if (
    props.reelAutoAdvance.includePostItems
    && activeMediaIndex.value < mediaAssets(item).length - 1
  ) {
    emit('mediaChange', item.postId, activeMediaIndex.value + 1)
    return
  }

  const nextIndex = activeIndex.value + 1
  const nextItem = props.items[nextIndex]
  if (!nextItem) {
    if (props.hasNext && !props.loadMoreLocked) emit('loadMore')
    return
  }

  if (
    props.reelAutoAdvance.includePostItems
    && (props.mediaIndices.get(nextItem.postId) ?? 0) !== 0
  ) emit('mediaChange', nextItem.postId, 0)
  advanceToPost(nextIndex)
}

function onMediaEnded(postId: VibeItemId, mediaIndex: number): void {
  if (
    !props.reelAutoAdvance.enabled
    || postId !== activePostId.value
    || mediaIndex !== activeMediaIndex.value
    || !activeMediaWaitsForEnd.value
  ) return

  onAutoAdvanceComplete()
}

watch(galleryElement, (element) => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (!element) return

  viewportHeight = element.clientHeight
  if (typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver(restoreActiveItem)
  resizeObserver.observe(element)
})

watch(
  () => props.items.length,
  async (length) => {
    const requestedPostId = props.initialPostId
    const requestedIndex = requestedPostId === null || requestedPostId === undefined
      ? -1
      : props.items.findIndex(({ postId }) => postId === requestedPostId)
    activeIndex.value = requestedIndex >= 0
      ? requestedIndex
      : Math.min(activeIndex.value, Math.max(0, length - 1))
    await nextTick()
    restoreActiveItem()
  },
)

watch(activePostId, (postId) => {
  if (postId !== undefined) emit('activeChange', postId)
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', beginResize)
  window.addEventListener('orientationchange', beginResize)
  if (initialIndex >= 0) void nextTick(restoreActiveItem)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', beginResize)
  window.removeEventListener('orientationchange', beginResize)
  resizeObserver?.disconnect()
  if (restoreFrame !== null) cancelAnimationFrame(restoreFrame)
  if (resizeReleaseTimer !== null) clearTimeout(resizeReleaseTimer)
})

defineExpose({
  activeIndex,
  activePostId,
  changeActiveMedia,
  loadIfNearBottom,
  moveActivePost,
  navigateToItem,
  transitionActiveMedia,
  transitionActivePost,
})
</script>

<template>
  <main
    class="reel-shell"
    :class="{
      'reel-shell--has-footer': Boolean(cardFooter),
      'reel-shell--has-header': Boolean(cardHeader),
    }"
    data-layout-mode="reel"
  >
    <CardRegion
      v-if="cardHeader && activeItem && reelForward.status === 'idle'"
      :index="activeIndex"
      :item="activeItem"
      layout="reel"
      :loaded-count="items.length"
      :media-index="activeMediaIndex"
      :media-source="mediaSource"
      placement="header"
      :region="cardHeader"
      :style="mediaCard?.header"
      :total="total"
    />

    <div class="reel-viewport">
      <div
        ref="galleryElement"
        class="gallery-shell reel-feed"
        :data-active-post-id="activePostId"
        :data-active-media-index="activeMediaIndex"
        @scroll.passive="onScroll"
      >
        <div
          v-if="reelForward.status !== 'idle'"
          class="reel-forward-status"
          :role="reelForward.status === 'error' ? 'alert' : 'status'"
          :data-status="reelForward.status"
        >
          <p>{{ forwardMessage }}</p>
          <button
            v-if="reelForward.status === 'error' || reelForward.status === 'end'"
            class="reel-forward-retry"
            type="button"
            @click="emit('retryForward')"
          >
            Retry
          </button>
        </div>

        <section
          v-else
          class="reel-track"
          :style="trackStyle"
          aria-label="Media gallery"
        >
          <MediaCard
            v-for="({ fetchPriority, item, index }) in visibleItems"
            :key="item.postId"
            :active="index === activeIndex && !isFooterVisible"
            :advance-on-media-end="props.reelAutoAdvance.enabled && index === activeIndex"
            class="reel-item"
            :entering="false"
            :fetch-priority="fetchPriority"
            :index="index"
            :item="item"
            :item-style="itemStyle(index)"
            :media-card="mediaCard"
            layout="reel"
            :loaded-count="items.length"
            :media-index="mediaIndices.get(item.postId) ?? 0"
            :media-source="mediaSource"
            :preview-state="previewStates.get(mediaStateKey(
              item.postId,
              mediaIndices.get(item.postId) ?? 0,
            )) ?? 'loading'"
            :reel-controls-target="reelControlsElement"
            :reel-audio-state="reelAudioState"
            stationary-reel-controls
            :total="total"
            @media-change="emit('mediaChange', item.postId, $event)"
            @ended="onMediaEnded(item.postId, $event)"
            @ready="emit('ready', item.postId, $event)"
            @reel-audio-change="emit('reelAudioChange', $event)"
            @error="emit('error', item.postId, $event)"
          />
        </section>

        <FeedFooter
          v-if="reelForward.status === 'idle'"
          :actions="feedFooterActions"
          :can-retry-end="canRetryEnd"
          :feed-footer="feedFooter"
          :has-error="nextPageError"
          :has-next="hasNext"
          :is-loading="isLoadingMore"
          :load-more-locked="loadMoreLocked"
          :show-load-more="showLoadMore"
          :state="state"
          @load-more="emit('loadMore')"
          @retry-end="emit('retryEnd')"
        />
      </div>

      <div
        ref="reelControlsElement"
        class="reel-media-controls-host"
        data-test="reel-media-controls-host"
      />
    </div>

    <CardRegion
      v-if="cardFooter && activeItem && reelForward.status === 'idle'"
      :index="activeIndex"
      :item="activeItem"
      layout="reel"
      :loaded-count="items.length"
      :media-index="activeMediaIndex"
      :media-source="mediaSource"
      placement="footer"
      :region="cardFooter"
      :style="mediaCard?.footer"
      :total="total"
    />

    <ReelAutoAdvanceProgress
      v-if="showAutoAdvance"
      :key="autoAdvanceKey"
      :duration-ms="reelAutoAdvance.intervalMs"
      :label="autoAdvanceLabel"
      @complete="onAutoAdvanceComplete"
    />
  </main>
</template>
