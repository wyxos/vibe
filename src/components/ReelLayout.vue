<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'

import type { ReelLayoutProps } from '../core/feed'
import { mediaAssetAt, mediaAssets } from '../core/mediaAsset'
import type {
  VibeItemId,
  VibeReelInfoSheetProps,
} from '../types'
import ReelFeed from './ReelFeed.vue'

interface ReelFeedExpose {
  changeActiveMedia: (direction: -1 | 1) => boolean
  loadIfNearBottom: () => void
  moveActivePost: (direction: -1 | 1) => boolean
}

const props = defineProps<ReelLayoutProps>()
const emit = defineEmits<{
  activeChange: [postId: VibeItemId]
  closeInfoSheet: []
  error: [postId: VibeItemId, mediaIndex: number]
  loadMore: []
  mediaChange: [postId: VibeItemId, mediaIndex: number]
  ready: [postId: VibeItemId, mediaIndex: number]
  retryEnd: []
}>()

const reelFeed = shallowRef<ReelFeedExpose | null>(null)
const sheetElement = shallowRef<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

const activeIndex = computed(() => {
  const index = props.initialPostId === null || props.initialPostId === undefined
    ? -1
    : props.items.findIndex((item) => item.postId === props.initialPostId)

  return Math.max(0, index)
})
const activeItem = computed(() => props.items[activeIndex.value])
const activeMediaIndex = computed(() => {
  const postId = activeItem.value?.postId
  return postId === undefined ? 0 : props.mediaIndices.get(postId) ?? 0
})
const sheetVisible = computed(() => Boolean(
  props.infoSheet && props.infoSheetEnabled && activeItem.value,
))
const sheetContext = computed<VibeReelInfoSheetProps | null>(() => {
  const item = activeItem.value
  if (!item) return null

  return {
    close: closeInfoSheet,
    index: activeIndex.value,
    item,
    layout: 'reel',
    loadedCount: props.items.length,
    mediaCount: mediaAssets(item).length,
    mediaIndex: activeMediaIndex.value,
    mediaItem: mediaAssetAt(item, activeMediaIndex.value),
    mediaSource: props.mediaSource ?? 'preview',
    origin: props.origin,
    total: props.total,
  }
})

function closeInfoSheet(): void {
  emit('closeInfoSheet')
}

function changeActiveMedia(direction: -1 | 1): boolean {
  return reelFeed.value?.changeActiveMedia(direction) ?? false
}

function loadIfNearBottom(): void {
  reelFeed.value?.loadIfNearBottom()
}

function moveActivePost(direction: -1 | 1): boolean {
  return reelFeed.value?.moveActivePost(direction) ?? false
}

function relayError(postId: VibeItemId, mediaIndex: number): void {
  emit('error', postId, mediaIndex)
}

function relayMediaChange(postId: VibeItemId, mediaIndex: number): void {
  emit('mediaChange', postId, mediaIndex)
}

function relayReady(postId: VibeItemId, mediaIndex: number): void {
  emit('ready', postId, mediaIndex)
}

watch(
  () => ({ overlay: props.infoSheetOverlay, visible: sheetVisible.value }),
  async (current, previous) => {
    if (current.visible && !previous?.visible) {
      previousFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      if (current.overlay) {
        await nextTick()
        sheetElement.value?.focus({ preventScroll: true })
      }
      return
    }

    if (!current.visible && previous?.visible && previousFocus?.isConnected) {
      const focusTarget = previousFocus
      previousFocus = null
      await nextTick()
      focusTarget.focus({ preventScroll: true })
    }
  },
)

onBeforeUnmount(() => {
  previousFocus = null
})

defineExpose({ changeActiveMedia, loadIfNearBottom, moveActivePost })
</script>

<template>
  <section
    class="reel-layout"
    :class="`reel-layout--${infoSheetOverlay ? 'overlay' : 'layout'}`"
    :data-info-sheet-open="sheetVisible || undefined"
    :data-info-sheet-mode="infoSheetOverlay ? 'overlay' : 'layout'"
  >
    <div
      class="reel-layout-main"
      :aria-hidden="infoSheetOverlay && sheetVisible || undefined"
      :inert="infoSheetOverlay && sheetVisible || undefined"
    >
      <ReelFeed
        ref="reelFeed"
        :can-retry-end="canRetryEnd"
        :card-footer="cardFooter"
        :card-header="cardHeader"
        :feed-footer="feedFooter"
        :feed-footer-actions="feedFooterActions"
        :has-next="hasNext"
        :infinite-scroll="infiniteScroll"
        :initial-post-id="initialPostId"
        :is-loading-more="isLoadingMore"
        :items="items"
        :load-more-locked="loadMoreLocked"
        :media-indices="mediaIndices"
        :media-source="mediaSource"
        :next-page-error="nextPageError"
        :preview-states="previewStates"
        :reel-auto-advance="reelAutoAdvance"
        :state="state"
        :total="total"
        @active-change="emit('activeChange', $event)"
        @error="relayError"
        @load-more="emit('loadMore')"
        @media-change="relayMediaChange"
        @ready="relayReady"
        @retry-end="emit('retryEnd')"
      />
    </div>

    <Transition name="vibe-info-sheet">
      <div
        v-if="sheetVisible && infoSheet && sheetContext"
        class="reel-info-sheet-layer"
        data-test="reel-info-sheet"
      >
        <aside
          ref="sheetElement"
          class="reel-info-sheet"
          :role="infoSheetOverlay ? 'dialog' : 'complementary'"
          aria-label="Reel information"
          :aria-modal="infoSheetOverlay ? 'true' : undefined"
          :tabindex="infoSheetOverlay ? -1 : undefined"
          :data-active-post-id="activeItem?.postId"
        >
          <component
            :is="infoSheet.component"
            v-bind="sheetContext"
          />
        </aside>
      </div>
    </Transition>
  </section>
</template>
