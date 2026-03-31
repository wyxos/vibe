<script setup lang="ts">
import {
  masonryDefaults,
  type MasonryItemBase,
  type MasonryProps,
  type PageToken,
} from '@/masonry/types'
import { computed, onMounted, provide, ref, shallowRef, useAttrs, watch } from 'vue'

import MasonryCardContent from '@/components/masonry/MasonryCardContent.vue'
import { useMasonryMotion } from '@/components/masonry/useMasonryMotion'
import { useMasonryRuntime } from '@/components/masonry/useMasonryRuntime'
import {
  masonryItemRegistryKey,
  type MasonryItemDefinition,
} from '@/components/masonryItemRegistry'
import type { MasonryPosition } from '@/components/masonry/types'
import { getColumnCount, getColumnWidth } from '@/masonry/layout'
import { buildMasonryLayout, getVisibleIndicesFromBuckets } from '@/masonry/layoutEngine'

defineOptions({ inheritAttrs: false })

export type {
  BackfillStats,
  GetContentFn,
  GetContentResult,
  MasonryItemBase,
  MasonryMode,
  MasonryRestoredPages,
  PageToken,
} from '@/masonry/types'

const props = withDefaults(defineProps<MasonryProps>(), masonryDefaults)

const emit = defineEmits<{
  (e: 'update:items', items: MasonryItemBase[]): void
  (e: 'preloaded', items: MasonryItemBase[]): void
  (e: 'failures', payloads: Array<{ item: MasonryItemBase; error: unknown }>): void
  (e: 'removed', payload: { items: MasonryItemBase[]; ids: string[] }): void
}>()

const attrs = useAttrs()
const masonryItemDefinition = shallowRef<MasonryItemDefinition | null>(null)

provide(masonryItemRegistryKey, (definition: MasonryItemDefinition) => {
  if (masonryItemDefinition.value) {
    if (import.meta.env.DEV) {
      console.warn('[Masonry] Only one <MasonryItem> definition is supported.')
    }
    return
  }
  masonryItemDefinition.value = definition
})

onMounted(() => {
  if (!masonryItemDefinition.value) {
    throw new Error('[Masonry] Missing <MasonryItem> definition. Add <MasonryItem> as a child of <Masonry>.')
  }
})

const passthroughAttrs = computed(() => {
  const { class: _class, ...rest } = attrs as Record<string, unknown>
  return rest
})

const scrollViewportRef = ref<HTMLElement | null>(null)

const gapX = computed(() => props.gapX)
const gapY = computed(() => props.gapY)
const headerHeight = computed(() => props.headerHeight)
const footerHeight = computed(() => props.footerHeight)

const itemHeaderSlotFn = computed(() => masonryItemDefinition.value?.header)
const itemLoaderSlotFn = computed(() => masonryItemDefinition.value?.loader)
const itemFooterSlotFn = computed(() => masonryItemDefinition.value?.footer)
const itemOverlaySlotFn = computed(() => masonryItemDefinition.value?.overlay)
const itemErrorSlotFn = computed(() => masonryItemDefinition.value?.error)

const hasHeaderSlot = computed(() => Boolean(itemHeaderSlotFn.value))
const hasFooterSlot = computed(() => Boolean(itemFooterSlotFn.value))
const hasOverlaySlot = computed(() => Boolean(itemOverlaySlotFn.value))

const headerStyle = computed(() => {
  if (headerHeight.value > 0) return { height: `${headerHeight.value}px` }
  return undefined
})

const footerStyle = computed(() => {
  if (footerHeight.value > 0) return { height: `${footerHeight.value}px` }
  return undefined
})

const SCROLL_BUFFER_PX = 200
const BUCKET_PX = 600
const LEAVE_MOTION_MS = 600

const layoutPositions = ref<MasonryPosition[]>([])
const layoutHeights = ref<number[]>([])
const layoutBuckets = ref<Map<number, number[]>>(new Map())
const layoutContentHeight = ref(0)
const layoutIndexById = ref<Map<string, number>>(new Map())

let runtime!: ReturnType<typeof useMasonryRuntime>
let motion!: ReturnType<typeof useMasonryMotion>

const columnCount = computed(() => getColumnCount(runtime?.containerWidth.value ?? 0, props.itemWidth))
const columnWidth = computed(() =>
  getColumnWidth(runtime?.containerWidth.value ?? 0, columnCount.value, props.itemWidth, gapX.value)
)

runtime = useMasonryRuntime({
  props,
  emitUpdateItems: (items) => emit('update:items', items),
  emitRemoved: (payload) => emit('removed', payload),
  scrollViewportRef,
  gapX,
  columnWidth,
  layoutIndexById,
  layoutPositions,
  layoutHeights,
  markEnterFromTop: (items) => motion.markEnterFromTop(items),
  snapshotVisiblePositions: () => motion.snapshotVisiblePositions(),
  playFlipMoveAnimation: (oldPosById, skipIds) => motion.playFlipMoveAnimation(oldPosById, skipIds),
  queueLeavingClones: (clones) => motion.queueLeavingClones(clones),
  resetMotionState: () => motion.resetMotionState(),
})

const containerHeight = computed(() => {
  const base = Math.max(layoutContentHeight.value, runtime.viewportHeight.value)
  return base + SCROLL_BUFFER_PX
})

const visibleIndices = computed<number[]>(() => {
  return getVisibleIndicesFromBuckets({
    itemCount: runtime.itemsState.value.length,
    viewportHeight: runtime.viewportHeight.value,
    scrollTop: runtime.scrollTop.value,
    overscanPx: props.overscanPx,
    bucketPx: BUCKET_PX,
    buckets: layoutBuckets.value,
  })
})

motion = useMasonryMotion({
  itemDefinition: masonryItemDefinition,
  itemsState: runtime.itemsState,
  visibleIndices,
  layoutPositions,
  layoutHeights,
  layoutIndexById,
  columnWidth,
  scrollTop: runtime.scrollTop,
  viewportHeight: runtime.viewportHeight,
  enterStaggerMs: computed(() => props.enterStaggerMs),
  isResumeMode: runtime.isResumeMode,
  emitPreloaded: (items) => emit('preloaded', items),
  emitFailures: (payloads) => emit('failures', payloads),
})

const itemsState = runtime.itemsState
const leavingClones = motion.leavingClones
const hoveredCardId = motion.hoveredCardId
const isLoadingInitial = runtime.isLoadingInitial
const isLoadingNext = runtime.isLoadingNext
const runtimeError = runtime.error
const nextPage = runtime.nextPage

defineExpose({
  remove: runtime.remove,
  restore: runtime.restore,
  undo: runtime.undo,
  forget: runtime.forget,
  loadNextPage: runtime.loadNextPage,
  cancel: runtime.cancel,
  get pagesLoaded() {
    return runtime.pagesLoaded.value
  },
  set pagesLoaded(value: PageToken[]) {
    runtime.pagesLoaded.value = value
  },
  get nextPage() {
    return runtime.nextPage.value
  },
  set nextPage(value: PageToken | null) {
    runtime.nextPage.value = value
  },
  get isLoading() {
    return runtime.isLoadingInitial.value || runtime.isLoadingNext.value
  },
  get hasReachedEnd() {
    if (props.mode !== 'backfill') return runtime.nextPage.value == null
    return runtime.nextPage.value == null && runtime.backfillBuffer.value.length === 0
  },
  get backfillStats() {
    return runtime.backfillStats.value
  },
})

function rebuildLayout() {
  const next = buildMasonryLayout<MasonryItemBase>({
    items: runtime.itemsState.value,
    columnCount: columnCount.value,
    columnWidth: columnWidth.value,
    gapX: gapX.value,
    gapY: gapY.value,
    headerHeight: headerHeight.value,
    footerHeight: footerHeight.value,
    bucketPx: BUCKET_PX,
  })

  layoutPositions.value = next.positions
  layoutHeights.value = next.heights
  layoutBuckets.value = next.buckets
  layoutContentHeight.value = next.contentHeight
  layoutIndexById.value = next.indexById
}

watch(
  [columnCount, columnWidth, gapX, gapY, headerHeight, footerHeight],
  () => {
    rebuildLayout()
  },
  { immediate: true }
)

watch(
  () => [runtime.itemsState.value, runtime.itemsState.value.length],
  () => rebuildLayout(),
  { immediate: true }
)

const sectionClass = computed(() => {
  const userClass = attrs.class
  return ['vibe-masonry', userClass]
})
</script>

<template>
  <section v-bind="passthroughAttrs" :class="sectionClass">
    <div class="vibe-masonry__definitions">
      <slot />
    </div>
    <div
      ref="scrollViewportRef"
      data-testid="items-scroll-container"
      class="vibe-masonry__viewport"
      :style="{ paddingRight: gapX + 'px' }"
      @scroll="runtime.maybeLoadMoreOnScroll"
    >
      <div v-if="isLoadingInitial" class="vibe-masonry__initial">
        <div class="vibe-masonry__status-row">
          <svg
            class="vibe-spinner vibe-spinner--lg"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
          <span>Loading…</span>
        </div>
      </div>
      <p v-else-if="runtimeError" class="vibe-masonry__error">Error: {{ runtimeError }}</p>

      <div v-else class="vibe-masonry__content" :style="{ height: containerHeight + 'px' }">
        <article
          v-for="idx in visibleIndices"
          :key="itemsState[idx].id"
          data-testid="item-card"
          class="vibe-masonry__card"
          :style="{
            width: columnWidth + 'px',
            transition: motion.getCardTransition(itemsState[idx].id),
            transitionDelay: motion.getCardTransitionDelay(itemsState[idx].id),
            transform: motion.getCardTransform(idx),
          }"
        >
          <MasonryCardContent
            :item="itemsState[idx]"
            :remove="() => runtime.removeItem(itemsState[idx])"
            :hovered="hoveredCardId === itemsState[idx].id"
            :has-header-slot="hasHeaderSlot"
            :has-footer-slot="hasFooterSlot"
            :has-overlay-slot="hasOverlaySlot"
            :header-style="headerStyle"
            :footer-style="footerStyle"
            :item-header-slot-fn="itemHeaderSlotFn"
            :item-loader-slot-fn="itemLoaderSlotFn"
            :item-overlay-slot-fn="itemOverlaySlotFn"
            :item-error-slot-fn="itemErrorSlotFn"
            :item-footer-slot-fn="itemFooterSlotFn"
            @hover-start="motion.handleCardMouseEnter"
            @hover-end="motion.handleCardMouseLeave"
            @success="motion.handleItemPreloaded"
            @error="motion.handleItemFailed"
          />
        </article>

        <article
          v-for="clone in leavingClones"
          :key="clone.id + ':leaving'"
          data-testid="item-card-leaving"
          class="vibe-masonry__leaving-card"
          :style="{
            width: clone.width + 'px',
            transition: 'transform ' + LEAVE_MOTION_MS + 'ms ease-out',
            transform: clone.leaving
              ? 'translate3d(' + clone.fromX + 'px,' + clone.fromY + 'px,0)'
              : 'translate3d(' + clone.fromX + 'px,' + clone.toY + 'px,0)',
          }"
        >
          <MasonryCardContent
            :item="clone.item"
            :remove="() => {}"
            :hovered="false"
            :hover-events-enabled="false"
            :has-header-slot="hasHeaderSlot"
            :has-footer-slot="hasFooterSlot"
            :has-overlay-slot="hasOverlaySlot"
            :header-style="headerStyle"
            :footer-style="footerStyle"
            :item-header-slot-fn="itemHeaderSlotFn"
            :item-loader-slot-fn="itemLoaderSlotFn"
            :item-overlay-slot-fn="itemOverlaySlotFn"
            :item-error-slot-fn="itemErrorSlotFn"
            :item-footer-slot-fn="itemFooterSlotFn"
          />
        </article>
      </div>

      <div class="vibe-masonry__footer-status">
        <span v-if="isLoadingNext" class="vibe-masonry__footer-status-row">
          <svg
            class="vibe-spinner vibe-spinner--sm"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
          <span>Loading more…</span>
        </span>
        <span v-else-if="nextPage == null">End of list</span>
        <span v-else>Scroll to load page {{ nextPage }}</span>
      </div>
    </div>
  </section>
</template>
