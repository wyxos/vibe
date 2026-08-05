<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  useId,
  watch,
  type CSSProperties,
} from 'vue'

import type { MasonryFeedProps } from '../core/feed'
import { isNearFeedBottom } from '../core/feed'
import { mediaStateKey } from '../core/mediaAsset'
import {
  calculateMasonryEntryOffset,
  calculateMasonryLayout,
  calculateVisibleMasonryIndices,
  type MasonryLayout,
} from '../core/masonry'
import type { VibeItemId } from '../types'
import GalleryScrollbar from './GalleryScrollbar.vue'
import FeedFooter from './FeedFooter.vue'
import MediaCard from './MediaCard.vue'

const MIN_COLUMN_WIDTH = 240
const MIN_GAP = 6
const MAX_GAP = 12
const VIRTUAL_OVERSCAN_MIN = 800
const VIRTUAL_OVERSCAN_FACTOR = 1.5

const props = withDefaults(defineProps<MasonryFeedProps>(), {
  leavingPostIds: () => new Set(),
  removalDelays: () => new Map(),
})
const emit = defineEmits<{
  activate: [postId: VibeItemId, input: 'keyboard' | 'pointer']
  error: [postId: VibeItemId, mediaIndex: number]
  loadMore: []
  mediaChange: [postId: VibeItemId, mediaIndex: number]
  ready: [postId: VibeItemId, mediaIndex: number]
  retryEnd: []
  visible: [postId: VibeItemId, mediaIndex: number]
}>()

const galleryElement = shallowRef<HTMLElement | null>(null)
const galleryId = `vibe-masonry-${useId()}`
const masonryElement = shallowRef<HTMLElement | null>(null)
const masonryWidth = shallowRef(0)
const masonryGap = shallowRef(MIN_GAP)
const galleryScrollTop = shallowRef(0)
const galleryViewportHeight = shallowRef(0)
const masonryContentTop = shallowRef(0)
let masonryResizeObserver: ResizeObserver | null = null
let galleryResizeObserver: ResizeObserver | null = null
let resizeFrame: number | null = null

const settledMasonryLayout = computed(() => calculateMasonryLayout(
  props.items,
  masonryWidth.value,
  {
    additionalHeight:
      (props.cardHeader?.height ?? 0) + (props.cardFooter?.height ?? 0),
    gap: masonryGap.value,
    minColumnWidth: MIN_COLUMN_WIDTH,
  },
))

const masonryLayout = computed<MasonryLayout>(() => {
  const settledLayout = settledMasonryLayout.value
  if (props.leavingPostIds.size === 0) return settledLayout

  const retainedItems = props.items.filter(
    (item) => !props.leavingPostIds.has(item.postId),
  )
  const projectedLayout = calculateMasonryLayout(
    retainedItems,
    masonryWidth.value,
    {
      additionalHeight:
        (props.cardHeader?.height ?? 0) + (props.cardFooter?.height ?? 0),
      gap: masonryGap.value,
      minColumnWidth: MIN_COLUMN_WIDTH,
    },
  )
  const projectedPositions = new Map(
    retainedItems.map((item, index) => [
      item.postId,
      projectedLayout.items[index]!,
    ]),
  )

  return {
    ...projectedLayout,
    items: props.items.map((item, index) => (
      props.leavingPostIds.has(item.postId)
        ? settledLayout.items[index]!
        : projectedPositions.get(item.postId) ?? settledLayout.items[index]!
    )),
  }
})

const masonryStyle = computed<CSSProperties>(() => ({
  height: `${props.leavingPostIds.size === 0
    ? masonryLayout.value.height
    : settledMasonryLayout.value.height}px`,
}))

const showLoadMore = computed(() => (
  !props.infiniteScroll
  || (
    galleryViewportHeight.value > 0
    && masonryContentTop.value + masonryLayout.value.height
      <= galleryViewportHeight.value + 1
  )
))

const viewportIndices = computed(() => {
  if (props.suspended) return new Set<number>()

  const viewport = {
    scrollTop: galleryScrollTop.value - masonryContentTop.value,
    viewportHeight: galleryViewportHeight.value,
  }
  const target = calculateVisibleMasonryIndices(
    masonryLayout.value.items,
    { ...viewport, overscan: 0 },
  )
  const settled = props.leavingPostIds.size === 0
    ? []
    : calculateVisibleMasonryIndices(
        settledMasonryLayout.value.items,
        { ...viewport, overscan: 0 },
      )
  return new Set([...target, ...settled])
})

const visibleItems = computed(() => {
  const overscan = Math.max(
    VIRTUAL_OVERSCAN_MIN,
    galleryViewportHeight.value * VIRTUAL_OVERSCAN_FACTOR,
  )
  const viewport = {
    scrollTop: galleryScrollTop.value - masonryContentTop.value,
    viewportHeight: galleryViewportHeight.value,
  }
  const targetIndices = calculateVisibleMasonryIndices(
    masonryLayout.value.items,
    { ...viewport, overscan },
  )
  const settledIndices = props.leavingPostIds.size === 0
    ? []
    : calculateVisibleMasonryIndices(
        settledMasonryLayout.value.items,
        { ...viewport, overscan },
      )
  const indices = [...new Set([...targetIndices, ...settledIndices])]
    .sort((first, second) => first - second)
  return indices.flatMap((index) => {
    const item = props.items[index]

    return item ? [{
      fetchPriority: viewportIndices.value.has(index) ? 'high' as const : 'low' as const,
      index,
      item,
    }] : []
  })
})

let visibleReadyMedia = new Set<string>()
watch(
  () => [...viewportIndices.value].flatMap((index) => {
    const item = props.items[index]
    if (!item) return []
    const mediaIndex = props.mediaIndices.get(item.postId) ?? 0
    const key = mediaStateKey(item.postId, mediaIndex)
    return props.previewStates.get(key) === 'ready'
      ? [{ key, mediaIndex, postId: item.postId }]
      : []
  }),
  (visibleMedia) => {
    const next = new Set(visibleMedia.map(({ key }) => key))
    visibleMedia.forEach(({ key, mediaIndex, postId }) => {
      if (!visibleReadyMedia.has(key)) emit('visible', postId, mediaIndex)
    })
    visibleReadyMedia = next
  },
  { immediate: true, flush: 'post' },
)

function itemStyle(index: number): CSSProperties {
  const position = masonryLayout.value.items[index]
  const postId = props.items[index]?.postId
  if (!position) return {}

  const entering = postId !== undefined && props.enteringPostIds.has(postId)
  const leaving = postId !== undefined && props.leavingPostIds.has(postId)
  const entryOffset = entering || leaving
    ? calculateMasonryEntryOffset({
        containerHeight: settledMasonryLayout.value.height,
        gap: masonryGap.value,
      })
    : 0
  const motionDelay = postId === undefined
    ? 0
    : leaving
      ? props.removalDelays.get(postId) ?? 0
      : entering
        ? props.entryDelays.get(postId) ?? 0
        : 0

  return {
    '--masonry-entry-delay': `${motionDelay}ms`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    transform: `translate3d(${position.x}px, ${position.y + entryOffset}px, 0)`,
  }
}

function measureViewport(): void {
  const gallery = galleryElement.value
  if (!gallery) return

  galleryScrollTop.value = gallery.scrollTop
  galleryViewportHeight.value = gallery.clientHeight

  const masonry = masonryElement.value
  if (!masonry) return

  masonryContentTop.value = masonry.getBoundingClientRect().top
    - gallery.getBoundingClientRect().top
    + gallery.scrollTop
}

function measureMasonry(element: HTMLElement): void {
  const viewportWidth = element.ownerDocument.documentElement.clientWidth
  masonryWidth.value = element.clientWidth
  masonryGap.value = Math.min(MAX_GAP, Math.max(MIN_GAP, viewportWidth * 0.0075))
  measureViewport()
}

function onScroll(event: Event): void {
  const element = event.currentTarget as HTMLElement | null
  if (!element) return

  galleryScrollTop.value = element.scrollTop
  if (!props.loadMoreLocked && props.infiniteScroll && isNearFeedBottom(element)) {
    emit('loadMore')
  }
}

function loadIfNearBottom(): void {
  const element = galleryElement.value
  if (!props.loadMoreLocked && element && isNearFeedBottom(element)) emit('loadMore')
}

function getScrollElement(): HTMLElement | null {
  return galleryElement.value
}

watch(masonryElement, (element) => {
  masonryResizeObserver?.disconnect()
  masonryResizeObserver = null
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
  if (!element) return

  measureMasonry(element)
  if (typeof ResizeObserver === 'undefined') return

  masonryResizeObserver = new ResizeObserver(([entry]) => {
    const observedWidth = entry?.contentRect.width ?? element.clientWidth
    if (Math.abs(observedWidth - masonryWidth.value) < 0.5) return

    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null
      measureMasonry(element)
    })
  })
  masonryResizeObserver.observe(element)
})

watch(galleryElement, (element) => {
  galleryResizeObserver?.disconnect()
  galleryResizeObserver = null
  if (!element) return

  measureViewport()
  if (typeof ResizeObserver === 'undefined') return

  galleryResizeObserver = new ResizeObserver(measureViewport)
  galleryResizeObserver.observe(element)
})

onBeforeUnmount(() => {
  masonryResizeObserver?.disconnect()
  galleryResizeObserver?.disconnect()
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
})

defineExpose({ getScrollElement, loadIfNearBottom })
</script>

<template>
  <div class="masonry-feed-shell">
    <main
      :id="galleryId"
      ref="galleryElement"
      class="gallery-shell masonry-feed"
      :class="{ 'masonry-feed--suspended': suspended }"
      data-layout-mode="masonry"
      :aria-hidden="suspended || undefined"
      :inert="suspended || undefined"
      @scroll.passive="onScroll"
    >
      <section
        ref="masonryElement"
        class="masonry"
        :class="{ 'masonry--ready': masonryWidth > 0 }"
        :style="masonryStyle"
        aria-label="Media gallery"
      >
        <MediaCard
          v-for="({ fetchPriority, item, index }) in visibleItems"
          :key="item.postId"
          class="masonry-item"
          :entering="enteringPostIds.has(item.postId)"
          :leaving="leavingPostIds.has(item.postId)"
          :fetch-priority="fetchPriority"
          :card-footer="cardFooter"
          :card-header="cardHeader"
          :media-card="mediaCard"
          :index="index"
          :item="item"
          :item-style="itemStyle(index)"
          interactive
          layout="masonry"
          :loaded-count="items.length"
          :media-index="mediaIndices.get(item.postId) ?? 0"
          :preview-state="previewStates.get(mediaStateKey(
            item.postId,
            mediaIndices.get(item.postId) ?? 0,
          )) ?? 'loading'"
          :total="total"
          @activate="emit('activate', item.postId, $event)"
          @media-change="emit('mediaChange', item.postId, $event)"
          @ready="emit('ready', item.postId, $event)"
          @error="emit('error', item.postId, $event)"
        />
      </section>

    </main>

    <div
      v-if="feedFooter || isLoadingMore || nextPageError || (hasNext && showLoadMore) || (!hasNext && canRetryEnd)"
      class="masonry-feed-status-overlay"
    >
      <FeedFooter
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

    <GalleryScrollbar
      :content-size="masonryLayout.height"
      :controls-id="galleryId"
      :scroll-element="galleryElement"
      :suspended="suspended"
    />
  </div>
</template>
