<script setup lang="ts">
import type { Component } from 'vue'
import { computed, toRef, watch } from 'vue'

import type { VibeViewerItem } from './viewer'
import type { VibeAssetErrorReporter, VibeAssetLoadReporter } from './viewer-core/assetErrors'
import { getVibeOccurrenceKey } from './viewer-core/itemIdentity'
import { hasRenderableSlotContent } from './viewer-core/slotContent'
import { getVibeSurfaceStatus, resolveVibeSurfacePhase } from './viewer-core/surfaceStatus'
import type { VibeEmptyStateMode, VibeEmptyStateSlotProps, VibeGridStatusSlotProps } from './viewer-core/surfaceSlots'
import { useSurfaceEmptyState } from './viewer-core/useSurfaceEmptyState'
import { useVibeMasonryList } from './viewer-core/useMasonryList'
import type { VibeLoadPhase } from './viewer-core/useViewer'
import ListCard from './ListCard.vue'
import SurfaceEmptyState from './SurfaceEmptyState.vue'

const props = withDefaults(defineProps<{
  active?: boolean
  activeIndex?: number
  allowExhaustedNextPageRefresh?: boolean
  bottomLoadBufferPx?: number
  commitPendingAppend?: (() => void | Promise<void>) | null
  emptyStateMode?: VibeEmptyStateMode
  errorMessage?: string | null
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  items: VibeViewerItem[]
  loading?: boolean
  pendingAppendItems?: VibeViewerItem[]
  paginationDetail?: string | null
  phase?: VibeLoadPhase | null
  reportAssetError?: VibeAssetErrorReporter | null
  reportAssetLoad?: VibeAssetLoadReporter | null
  requestNextPage?: (() => void | Promise<void>) | null
  requestPreviousPage?: (() => void | Promise<void>) | null
  showStatusBadges?: boolean
}>(), {
  active: true,
  activeIndex: 0,
  allowExhaustedNextPageRefresh: false,
  bottomLoadBufferPx: 100,
  commitPendingAppend: null,
  emptyStateMode: 'inline',
  errorMessage: null,
  hasNextPage: false,
  hasPreviousPage: false,
  loading: false,
  pendingAppendItems: () => [],
  paginationDetail: null,
  phase: null,
  reportAssetError: null,
  reportAssetLoad: null,
  requestNextPage: null,
  requestPreviousPage: null,
  showStatusBadges: true,
})
const slots = defineSlots<{
  'empty-state'?: (props: VibeEmptyStateSlotProps) => unknown
  'grid-footer'?: () => unknown
  'grid-item-overlay'?: (props: {
    active: boolean
    focused: boolean
    hovered: boolean
    index: number
    item: VibeViewerItem
    openFullscreen: () => void
  }) => unknown
  'grid-status'?: (props: VibeGridStatusSlotProps) => unknown
  'item-icon'?: (props: { icon: Component; item: VibeViewerItem }) => unknown
}>()

const emit = defineEmits<{
  'boundary-load-progress': [value: {
    nextBoundaryLoadProgress: number
    previousBoundaryLoadProgress: number
  }]
  'open-fullscreen': [index: number]
  'update:activeIndex': [value: number]
}>()

const list = useVibeMasonryList({
  active: toRef(props, 'active'),
  allowExhaustedNextPageRefresh: toRef(props, 'allowExhaustedNextPageRefresh'),
  bottomLoadBufferPx: toRef(props, 'bottomLoadBufferPx'),
  items: toRef(props, 'items'),
  activeIndex: toRef(props, 'activeIndex'),
  loading: toRef(props, 'loading'),
  hasNextPage: toRef(props, 'hasNextPage'),
  hasPreviousPage: toRef(props, 'hasPreviousPage'),
  paginationDetail: toRef(props, 'paginationDetail'),
  pendingAppendItems: toRef(props, 'pendingAppendItems'),
  commitPendingAppend: toRef(props, 'commitPendingAppend'),
  requestNextPage: toRef(props, 'requestNextPage'),
  requestPreviousPage: toRef(props, 'requestPreviousPage'),
  setActiveIndex(index) {
    emit('update:activeIndex', index)
  },
})

defineExpose({
  autoScroll: list.autoScroll,
})
const resolvedPhase = computed(() => resolveVibeSurfacePhase({
  itemCount: props.items.length,
  loading: props.loading,
  phase: props.phase,
}))
const gridStatusState = computed(() => getVibeSurfaceStatus({
  errorMessage: props.errorMessage,
  hasItems: props.items.length > 0,
  hasNextPage: props.hasNextPage,
  phase: resolvedPhase.value,
  surface: 'grid',
}))
const gridStatusProps = computed<VibeGridStatusSlotProps | null>(() => {
  if (!props.showStatusBadges || !gridStatusState.value) {
    return null
  }

  return {
    activeIndex: list.resolvedActiveIndex.value,
    kind: gridStatusState.value.kind,
    loading: props.loading,
    message: gridStatusState.value.message,
    paginationDetail: props.paginationDetail,
    total: props.items.length,
  }
})
const gridStatusNodes = computed(() => {
  if (!gridStatusProps.value || !slots['grid-status']) {
    return []
  }

  return slots['grid-status'](gridStatusProps.value)
})
const showCustomGridStatus = computed(() => hasRenderableSlotContent(gridStatusNodes.value))
const visibleEmptyStateCount = computed(() => props.items.length + list.leavingItems.value.length)
const {
  emptyStateProps,
  showBadgeEmptyState,
  showCustomEmptyState,
  showInlineEmptyState,
} = useSurfaceEmptyState({
  emptyStateMode: toRef(props, 'emptyStateMode'),
  itemCount: visibleEmptyStateCount,
  loading: toRef(props, 'loading'),
  renderSlot: slots['empty-state'],
  surface: 'grid',
})

watch(
  [list.nextBoundaryLoadProgress, list.previousBoundaryLoadProgress],
  ([nextBoundaryLoadProgress, previousBoundaryLoadProgress]) => {
    emit('boundary-load-progress', {
      nextBoundaryLoadProgress,
      previousBoundaryLoadProgress,
    })
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div class="relative h-full min-h-0 bg-[radial-gradient(circle_at_top_center,rgba(255,255,255,0.04),transparent_28%),linear-gradient(180deg,#06070b,#05060a)]">
    <div class="pointer-events-none absolute inset-x-0 top-0 z-[2] flex justify-end p-6">
      <span
        data-testid="vibe-pagination"
        class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-white/14 bg-black/40 px-3 py-2 text-[0.63rem] font-bold uppercase tracking-[0.12em] text-[#f7f1ea]/72 backdrop-blur-[18px] min-[721px]:gap-3 min-[721px]:px-4 min-[721px]:py-3 min-[721px]:text-[0.74rem] min-[721px]:tracking-[0.2em]"
      >
        <span class="whitespace-nowrap">{{ list.paginationLabel.value }}</span>
        <span
          v-if="props.paginationDetail"
          class="whitespace-nowrap border-l border-white/12 pl-2 text-[#f7f1ea]/56 min-[721px]:pl-3"
        >
          {{ props.paginationDetail }}
        </span>
      </span>
    </div>

    <div
      :ref="list.scrollViewportRef"
      data-testid="vibe-list-scroll"
      class="h-full min-h-0 overflow-y-auto overflow-x-hidden [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      @scroll="list.onScroll"
      @wheel="list.onWheel"
    >
      <div
        data-testid="vibe-list-content"
        class="relative"
        :style="{ height: `${list.containerHeight.value}px` }"
      >
        <article
          v-for="{ item, index } in list.renderedItems.value"
          :key="getVibeOccurrenceKey(item)"
          data-testid="vibe-list-card"
          :data-active="index === list.resolvedActiveIndex.value ? 'true' : 'false'"
          :data-index="index"
          :data-item-id="item.id"
          :data-occurrence-key="getVibeOccurrenceKey(item)"
          class="absolute will-change-transform"
          :style="list.getCardStyle(index)"
        >
          <ListCard
            :active="index === list.resolvedActiveIndex.value"
            :index="index"
            :item="item"
            :report-asset-error="props.reportAssetError"
            :report-asset-load="props.reportAssetLoad"
            :surface-active="props.active"
            @open="emit('open-fullscreen', index)"
          >
            <template v-if="slots['grid-item-overlay']" #grid-item-overlay="slotProps">
              <slot name="grid-item-overlay" v-bind="slotProps" />
            </template>
            <template v-if="slots['item-icon']" #item-icon="slotProps">
              <slot name="item-icon" v-bind="slotProps" />
            </template>
          </ListCard>
        </article>

        <article
          v-for="leavingItem in list.leavingItems.value"
          :key="`leaving-${getVibeOccurrenceKey(leavingItem.item)}`"
          data-testid="vibe-list-card-leaving"
          :data-item-id="leavingItem.item.id"
          class="pointer-events-none absolute z-[2] will-change-[opacity,transform]"
          :style="list.getLeavingCardStyle(leavingItem.item)"
        >
          <ListCard
            :active="false"
            :index="-1"
            :item="leavingItem.item"
            :report-asset-error="props.reportAssetError"
            :report-asset-load="props.reportAssetLoad"
            :surface-active="false"
          >
            <template v-if="slots['item-icon']" #item-icon="slotProps">
              <slot name="item-icon" v-bind="slotProps" />
            </template>
          </ListCard>
        </article>

        <SurfaceEmptyState
          v-if="showInlineEmptyState && emptyStateProps"
          :message="emptyStateProps.message"
          :mode="emptyStateProps.mode"
          :surface="emptyStateProps.surface"
        >
          <slot
            v-if="showCustomEmptyState"
            name="empty-state"
            v-bind="emptyStateProps"
          />
        </SurfaceEmptyState>
      </div>
    </div>

    <div v-if="list.showScrollbar.value" class="pointer-events-none absolute inset-y-0 right-0 z-[3] hidden w-8 min-[1024px]:block">
      <div class="absolute bottom-6 right-3 top-6 w-px bg-white/8" />
      <div
        data-testid="vibe-list-scrollbar-thumb"
        class="absolute right-[0.625rem] w-1 bg-white/34 transition-[height,transform,background-color,opacity] duration-300 ease-out"
        :class="props.loading ? 'bg-white/52' : 'bg-white/34'"
        :style="list.getScrollbarThumbStyle()"
      />
    </div>

    <div
      v-if="slots['grid-footer']"
      class="pointer-events-none absolute inset-x-0 bottom-0 z-[2] px-5 pb-5 sm:px-6"
    >
      <div class="mx-auto flex w-full justify-center">
        <slot name="grid-footer" />
      </div>
    </div>

    <div
      v-if="gridStatusProps"
      class="pointer-events-none absolute inset-x-0 bottom-0 z-[3] flex justify-center px-6"
      :class="slots['grid-footer'] ? 'pb-24' : 'pb-6'"
    >
      <slot
        v-if="showCustomGridStatus"
        name="grid-status"
        v-bind="gridStatusProps"
      />
      <span
        v-else
        data-testid="vibe-grid-status-badge"
        class="inline-flex items-center border border-white/14 bg-black/55 px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/72 backdrop-blur-[18px]"
        :class="gridStatusProps.kind === 'end' ? 'border-amber-300/35 text-amber-200' : (gridStatusProps.kind === 'failed' ? 'border-rose-400/45 text-rose-100' : '')"
      >
        {{ gridStatusProps.message }}
      </span>
    </div>

    <SurfaceEmptyState
      v-if="showBadgeEmptyState && emptyStateProps"
      class="z-[3]"
      :class="slots['grid-footer'] ? 'pb-24' : 'pb-6'"
      :message="emptyStateProps.message"
      :mode="emptyStateProps.mode"
      :surface="emptyStateProps.surface"
    >
      <slot
        v-if="showCustomEmptyState"
        name="empty-state"
        v-bind="emptyStateProps"
      />
    </SurfaceEmptyState>
  </div>
</template>
