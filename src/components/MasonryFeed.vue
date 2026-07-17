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
} from '../core/masonry'
import type { VibeItemId } from '../types'
import GalleryScrollbar from './GalleryScrollbar.vue'
import GalleryFooter from './GalleryFooter.vue'
import MediaCard from './MediaCard.vue'

const MIN_COLUMN_WIDTH = 240
const MIN_GAP = 6
const MAX_GAP = 12
const VIRTUAL_OVERSCAN_MIN = 800
const VIRTUAL_OVERSCAN_FACTOR = 1.5

const props = defineProps<MasonryFeedProps>()
const emit = defineEmits<{
  activate: [postId: VibeItemId, input: 'keyboard' | 'pointer']
  error: [postId: VibeItemId, mediaIndex: number]
  loadMore: []
  mediaChange: [postId: VibeItemId, mediaIndex: number]
  ready: [postId: VibeItemId, mediaIndex: number]
  retryEnd: []
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

const masonryLayout = computed(() => calculateMasonryLayout(
  props.items,
  masonryWidth.value,
  {
    additionalHeight:
      (props.cardHeader?.height ?? 0) + (props.cardFooter?.height ?? 0),
    gap: masonryGap.value,
    minColumnWidth: MIN_COLUMN_WIDTH,
  },
))

const masonryStyle = computed<CSSProperties>(() => ({
  height: `${masonryLayout.value.height}px`,
}))

const visibleItems = computed(() => {
  const overscan = Math.max(
    VIRTUAL_OVERSCAN_MIN,
    galleryViewportHeight.value * VIRTUAL_OVERSCAN_FACTOR,
  )
  const viewport = {
    scrollTop: galleryScrollTop.value - masonryContentTop.value,
    viewportHeight: galleryViewportHeight.value,
  }
  const indices = calculateVisibleMasonryIndices(
    masonryLayout.value.items,
    { ...viewport, overscan },
  )
  const viewportIndices = new Set(calculateVisibleMasonryIndices(
    masonryLayout.value.items,
    { ...viewport, overscan: 0 },
  ))

  return indices.flatMap((index) => {
    const item = props.items[index]

    return item ? [{
      fetchPriority: viewportIndices.has(index) ? 'high' as const : 'low' as const,
      index,
      item,
    }] : []
  })
})

function itemStyle(index: number): CSSProperties {
  const position = masonryLayout.value.items[index]
  const postId = props.items[index]?.postId
  if (!position) return {}

  const entryOffset = postId !== undefined && props.enteringPostIds.has(postId)
    ? calculateMasonryEntryOffset({
        containerHeight: masonryLayout.value.height,
        gap: masonryGap.value,
      })
    : 0

  return {
    '--masonry-entry-delay': `${postId === undefined ? 0 : props.entryDelays.get(postId) ?? 0}ms`,
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    transform: `translate3d(0, ${entryOffset}px, 0)`,
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
  if (props.infiniteScroll && isNearFeedBottom(element)) emit('loadMore')
}

function loadIfNearBottom(): void {
  const element = galleryElement.value
  if (element && isNearFeedBottom(element)) emit('loadMore')
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

defineExpose({ loadIfNearBottom })
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
          :fetch-priority="fetchPriority"
          :card-footer="cardFooter"
          :card-header="cardHeader"
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

      <GalleryFooter
        :can-retry-end="canRetryEnd"
        :has-error="nextPageError"
        :has-next="hasNext"
        :infinite-scroll="infiniteScroll"
        :is-loading="isLoadingMore"
        @load-more="emit('loadMore')"
        @retry-end="emit('retryEnd')"
      />
    </main>

    <GalleryScrollbar
      :content-size="masonryLayout.height"
      :controls-id="galleryId"
      :scroll-element="galleryElement"
      :suspended="suspended"
    />
  </div>
</template>
