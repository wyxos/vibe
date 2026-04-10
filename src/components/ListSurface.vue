<script setup lang="ts">
import type { Component } from 'vue'
import { computed, toRef } from 'vue'

import type { VibeViewerItem } from './viewer'
import type { VibeAssetErrorReporter, VibeAssetLoadReporter } from './viewer-core/assetErrors'
import { getVibeOccurrenceKey } from './viewer-core/itemIdentity'
import { hasRenderableSlotContent } from './viewer-core/slotContent'
import type { VibeGridStatusSlotProps } from './viewer-core/surfaceSlots'
import type { VibeAssetLoadQueue } from './viewer-core/useAssetLoadQueue'
import { useVibeMasonryList } from './viewer-core/useMasonryList'
import ListCard from './ListCard.vue'

const props = withDefaults(defineProps<{
  active?: boolean
  activeIndex?: number
  assetLoadQueue?: VibeAssetLoadQueue | null
  commitPendingAppend?: (() => void | Promise<void>) | null
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  items: VibeViewerItem[]
  loading?: boolean
  pendingAppendItems?: VibeViewerItem[]
  paginationDetail?: string | null
  reportAssetError?: VibeAssetErrorReporter | null
  reportAssetLoad?: VibeAssetLoadReporter | null
  requestNextPage?: (() => void | Promise<void>) | null
  requestPreviousPage?: (() => void | Promise<void>) | null
  restoreToken: number
  showStatusBadges?: boolean
}>(), {
  active: true,
  activeIndex: 0,
  assetLoadQueue: null,
  commitPendingAppend: null,
  hasNextPage: false,
  hasPreviousPage: false,
  loading: false,
  pendingAppendItems: () => [],
  paginationDetail: null,
  reportAssetError: null,
  reportAssetLoad: null,
  requestNextPage: null,
  requestPreviousPage: null,
  showStatusBadges: true,
})
const slots = defineSlots<{
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
  'open-fullscreen': [index: number]
  'update:activeIndex': [value: number]
}>()

const list = useVibeMasonryList({
  active: toRef(props, 'active'),
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
  restoreToken: toRef(props, 'restoreToken'),
  setActiveIndex(index) {
    emit('update:activeIndex', index)
  },
})
const gridStatusMessage = computed(() => {
  if (props.loading) {
    return props.items.length > 0 ? 'Loading more items' : 'Loading the first page'
  }

  if (!props.hasNextPage && props.items.length > 0) {
    return 'End of list'
  }

  return null
})
const gridStatusProps = computed<VibeGridStatusSlotProps | null>(() => {
  if (!props.showStatusBadges || !gridStatusMessage.value) {
    return null
  }

  return {
    activeIndex: list.resolvedActiveIndex.value,
    kind: props.loading ? 'loading-more' : 'end',
    loading: props.loading,
    message: gridStatusMessage.value,
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
            :asset-load-queue="props.assetLoadQueue"
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
      <div class="mx-auto flex w-full max-w-[1600px] justify-center">
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
        class="inline-flex items-center border border-white/14 bg-black/55 px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/72 backdrop-blur-[18px]"
      >
        {{ gridStatusProps.message }}
      </span>
    </div>
  </div>
</template>
