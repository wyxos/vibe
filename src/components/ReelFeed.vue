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

import type { ReelFeedProps } from '../core/feed'
import { isNearFeedBottom } from '../core/feed'
import { mediaAssets, mediaStateKey } from '../core/mediaAsset'
import type { VibeItemId } from '../types'
import CardRegion from './CardRegion.vue'
import GalleryFooter from './GalleryFooter.vue'
import MediaCard from './MediaCard.vue'

const VIRTUAL_OVERSCAN = 2

const props = defineProps<ReelFeedProps>()
const emit = defineEmits<{
  activeChange: [postId: VibeItemId]
  error: [postId: VibeItemId, mediaIndex: number]
  loadMore: []
  mediaChange: [postId: VibeItemId, mediaIndex: number]
  ready: [postId: VibeItemId, mediaIndex: number]
  retryEnd: []
}>()

const galleryElement = shallowRef<HTMLElement | null>(null)
const initialIndex = props.initialPostId === null || props.initialPostId === undefined
  ? -1
  : props.items.findIndex((item) => item.postId === props.initialPostId)
const activeIndex = shallowRef(Math.max(0, initialIndex))
const isResizing = shallowRef(false)
let viewportHeight = 0
let resizeObserver: ResizeObserver | null = null
let restoreFrame: number | null = null
let resizeReleaseTimer: ReturnType<typeof setTimeout> | null = null

const trackStyle = computed<CSSProperties>(() => ({
  gridTemplateRows: `repeat(${props.items.length}, 100cqh)`,
}))

const visibleItems = computed(() => {
  const first = Math.max(0, activeIndex.value - VIRTUAL_OVERSCAN)
  const last = Math.min(props.items.length - 1, activeIndex.value + VIRTUAL_OVERSCAN)

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

  if (!isResizing.value) activeIndex.value = nearestIndex(element)
  if (props.infiniteScroll && isNearFeedBottom(element)) emit('loadMore')
}

function restoreActiveItem(): void {
  const element = galleryElement.value
  if (!element) return

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
  if (element && isNearFeedBottom(element)) emit('loadMore')
}

function changeActiveMedia(direction: -1 | 1): boolean {
  const item = activeItem.value
  if (!item) return false

  const mediaCount = mediaAssets(item).length
  if (mediaCount <= 1) return false

  const nextIndex = (activeMediaIndex.value + direction + mediaCount) % mediaCount
  emit('mediaChange', item.postId, nextIndex)
  return true
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
    activeIndex.value = Math.min(activeIndex.value, Math.max(0, length - 1))
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

defineExpose({ activeIndex, activePostId, changeActiveMedia, loadIfNearBottom })
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
      v-if="cardHeader && activeItem"
      :index="activeIndex"
      :item="activeItem"
      layout="reel"
      :loaded-count="items.length"
      :media-index="activeMediaIndex"
      :media-source="mediaSource"
      placement="header"
      :region="cardHeader"
      :total="total"
    />

    <div
      ref="galleryElement"
      class="gallery-shell reel-feed"
      :data-active-post-id="activePostId"
      :data-active-media-index="activeMediaIndex"
      @scroll.passive="onScroll"
    >
      <section
        class="reel-track"
        :style="trackStyle"
        aria-label="Media gallery"
      >
        <MediaCard
          v-for="({ fetchPriority, item, index }) in visibleItems"
          :key="item.postId"
          class="reel-item"
          :entering="false"
          :fetch-priority="fetchPriority"
          :index="index"
          :item="item"
          :item-style="itemStyle(index)"
          layout="reel"
          :loaded-count="items.length"
          :media-index="mediaIndices.get(item.postId) ?? 0"
          :media-source="mediaSource"
          :preview-state="previewStates.get(mediaStateKey(
            item.postId,
            mediaIndices.get(item.postId) ?? 0,
          )) ?? 'loading'"
          :total="total"
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
    </div>

    <CardRegion
      v-if="cardFooter && activeItem"
      :index="activeIndex"
      :item="activeItem"
      layout="reel"
      :loaded-count="items.length"
      :media-index="activeMediaIndex"
      :media-source="mediaSource"
      placement="footer"
      :region="cardFooter"
      :total="total"
    />
  </main>
</template>
