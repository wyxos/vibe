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
  type MasonryLayout,
} from '../core/masonry'
import {
  createMasonryViewportIndex,
  queryMasonryViewportIndex,
} from '../core/masonryViewportIndex'
import {
  resolveMasonryMinColumnWidth,
  resolveMasonryOverscan,
} from '../core/masonryOptions'
import type { VibeItemId } from '../types'
import GalleryScrollbar from './GalleryScrollbar.vue'
import FeedFooter from './FeedFooter.vue'
import MediaCard from './MediaCard.vue'

const MIN_GAP = 6
const MAX_GAP = 12
const REMOVAL_REFLOW_SUPPRESSION_MS = 250
let suppressAutomaticLoadUntil = 0

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
const galleryViewportHeight = shallowRef(0)
const galleryContentHeight = shallowRef(0)
const masonryContentTop = shallowRef(0)
const viewportIndexSnapshot = shallowRef<readonly number[]>([])
const overscanIndexSnapshot = shallowRef<readonly number[]>([])
let galleryScrollTop = 0
let masonryResizeObserver: ResizeObserver | null = null
let galleryResizeObserver: ResizeObserver | null = null
let resizeFrame: number | null = null
let viewportFrame: number | null = null

const settledMasonryLayout = computed(() => calculateMasonryLayout(
  props.items,
  masonryWidth.value,
  {
    additionalHeight:
      (props.cardHeader?.height ?? 0) + (props.cardFooter?.height ?? 0),
    gap: masonryGap.value,
    minColumnWidth: resolveMasonryMinColumnWidth(props.masonry),
  },
))

const projectedMasonry = computed(() => {
  if (props.leavingPostIds.size === 0) return null

  const retained = props.items.flatMap((item, index) => (
    props.leavingPostIds.has(item.postId) ? [] : [{ index, item }]
  ))
  const layout = calculateMasonryLayout(
    retained.map(({ item }) => item),
    masonryWidth.value,
    {
      additionalHeight:
        (props.cardHeader?.height ?? 0) + (props.cardFooter?.height ?? 0),
      gap: masonryGap.value,
      minColumnWidth: resolveMasonryMinColumnWidth(props.masonry),
    },
  )

  return {
    indices: retained.map(({ index }) => index),
    layout,
    positions: new Map(retained.map(({ item }, index) => [
      item.postId,
      layout.items[index]!,
    ])),
  }
})

const masonryLayout = computed<MasonryLayout>(() => {
  const settledLayout = settledMasonryLayout.value
  const projected = projectedMasonry.value
  if (!projected) return settledLayout

  return {
    ...projected.layout,
    items: props.items.map((item, index) => (
      props.leavingPostIds.has(item.postId)
        ? settledLayout.items[index]!
        : projected.positions.get(item.postId) ?? settledLayout.items[index]!
    )),
  }
})

const settledViewportIndex = computed(() => createMasonryViewportIndex(
  settledMasonryLayout.value.items,
))
const projectedViewportIndex = computed(() => {
  const projected = projectedMasonry.value
  return projected
    ? createMasonryViewportIndex(projected.layout.items, projected.indices)
    : null
})

const effectiveMasonryHeight = computed(() => Math.max(
  galleryContentHeight.value,
  props.leavingPostIds.size === 0
    ? masonryLayout.value.height
    : settledMasonryLayout.value.height,
))

const masonryStyle = computed<CSSProperties>(() => ({
  height: `${effectiveMasonryHeight.value}px`,
}))

const showLoadMore = computed(() => (
  !props.infiniteScroll
  || (
    galleryViewportHeight.value > 0
    && masonryContentTop.value + masonryLayout.value.height
      <= galleryViewportHeight.value + 1
  )
))

const viewportIndices = computed(() => new Set(viewportIndexSnapshot.value))

const visibleItems = computed(() => {
  return overscanIndexSnapshot.value.flatMap((index) => {
    const item = props.items[index]

    return item ? [{
      fetchPriority: viewportIndices.value.has(index) ? 'high' as const : 'low' as const,
      index,
      item,
    }] : []
  })
})

function mergeOrderedIndices(first: readonly number[], second: readonly number[]): number[] {
  return [...new Set([...first, ...second])]
    .sort((left, right) => left - right)
}

function indexSnapshotsMatch(
  first: readonly number[],
  second: readonly number[],
): boolean {
  return first.length === second.length
    && first.every((index, position) => index === second[position])
}

function calculateIndexSnapshot(overscan: number): number[] {
  const viewport = {
    scrollTop: galleryScrollTop - masonryContentTop.value,
    viewportHeight: galleryViewportHeight.value,
  }
  const projected = projectedViewportIndex.value
  const target = queryMasonryViewportIndex(
    projected ?? settledViewportIndex.value,
    { ...viewport, overscan },
  ).indices
  const settled = props.leavingPostIds.size === 0
    ? []
    : queryMasonryViewportIndex(
        settledViewportIndex.value,
        { ...viewport, overscan },
      ).indices

  return mergeOrderedIndices(target, settled)
}

function updateIndexSnapshots(): void {
  const viewport = props.suspended ? [] : calculateIndexSnapshot(0)
  const overscan = calculateIndexSnapshot(resolveMasonryOverscan(
    props.masonry,
    galleryViewportHeight.value,
  ))

  if (!indexSnapshotsMatch(viewportIndexSnapshot.value, viewport)) {
    viewportIndexSnapshot.value = viewport
  }
  if (!indexSnapshotsMatch(overscanIndexSnapshot.value, overscan)) {
    overscanIndexSnapshot.value = overscan
  }
}

function scheduleIndexSnapshotUpdate(): void {
  if (viewportFrame !== null) return

  viewportFrame = -1
  const requestedFrame = requestAnimationFrame(() => {
    viewportFrame = null
    updateIndexSnapshots()
  })
  if (viewportFrame !== null) viewportFrame = requestedFrame
}

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
        containerHeight: Math.max(
          galleryContentHeight.value,
          settledMasonryLayout.value.height,
        ),
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

  galleryScrollTop = gallery.scrollTop
  galleryViewportHeight.value = gallery.clientHeight
  const styles = gallery.ownerDocument.defaultView?.getComputedStyle(gallery)
  const verticalPadding = (Number.parseFloat(styles?.paddingTop ?? '') || 0)
    + (Number.parseFloat(styles?.paddingBottom ?? '') || 0)
  galleryContentHeight.value = Math.max(0, gallery.clientHeight - verticalPadding)

  const masonry = masonryElement.value
  if (!masonry) return

  masonryContentTop.value = masonry.getBoundingClientRect().top
    - gallery.getBoundingClientRect().top
    + gallery.scrollTop
  updateIndexSnapshots()
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

  galleryScrollTop = element.scrollTop
  scheduleIndexSnapshotUpdate()
  if (Date.now() >= suppressAutomaticLoadUntil
    && !props.loadMoreLocked && props.infiniteScroll && isNearFeedBottom(element)) {
    emit('loadMore')
  }
}

function loadIfNearBottom(): void {
  const element = galleryElement.value
  if (Date.now() >= suppressAutomaticLoadUntil
    && !props.loadMoreLocked && element && isNearFeedBottom(element)) emit('loadMore')
}

watch(() => props.items.length, (count, previous) => {
  if (count > 0 && count < previous) {
    suppressAutomaticLoadUntil = Date.now() + REMOVAL_REFLOW_SUPPRESSION_MS
  }
})

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

watch(
  [settledMasonryLayout, masonryLayout, () => props.suspended, () => props.masonry],
  updateIndexSnapshots,
  { flush: 'post' },
)

onBeforeUnmount(() => {
  masonryResizeObserver?.disconnect()
  galleryResizeObserver?.disconnect()
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
  if (viewportFrame !== null) cancelAnimationFrame(viewportFrame)
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
