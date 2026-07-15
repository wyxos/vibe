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

import type { FeedRendererProps } from '../core/feed'
import { isNearFeedBottom } from '../core/feed'
import type { VibeItemId } from '../types'
import GalleryFooter from './GalleryFooter.vue'
import MediaCard from './MediaCard.vue'

const VIRTUAL_OVERSCAN = 2

const props = defineProps<FeedRendererProps>()
const emit = defineEmits<{
  error: [postId: VibeItemId]
  loadMore: []
  ready: [postId: VibeItemId]
}>()

const galleryElement = shallowRef<HTMLElement | null>(null)
const activeIndex = shallowRef(0)
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

onMounted(() => {
  window.addEventListener('resize', beginResize)
  window.addEventListener('orientationchange', beginResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', beginResize)
  window.removeEventListener('orientationchange', beginResize)
  resizeObserver?.disconnect()
  if (restoreFrame !== null) cancelAnimationFrame(restoreFrame)
  if (resizeReleaseTimer !== null) clearTimeout(resizeReleaseTimer)
})

defineExpose({ activeIndex, activePostId, loadIfNearBottom })
</script>

<template>
  <main
    ref="galleryElement"
    class="gallery-shell reel-feed"
    data-layout-mode="reel"
    :data-active-post-id="activePostId"
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
        :item="item"
        :item-style="itemStyle(index)"
        :preview-state="previewStates.get(item.postId) ?? 'loading'"
        @ready="emit('ready', item.postId)"
        @error="emit('error', item.postId)"
      />
    </section>

    <GalleryFooter
      :has-error="nextPageError"
      :has-next="hasNext"
      :infinite-scroll="infiniteScroll"
      :is-loading="isLoadingMore"
      @load-more="emit('loadMore')"
    />
  </main>
</template>
