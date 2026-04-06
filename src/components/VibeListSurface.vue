<script setup lang="ts">
import { toRef } from 'vue'

import type { VibeViewerItem } from './vibeViewer'
import { useVibeMasonryList } from './vibe-root/useVibeMasonryList'
import VibeListCard from './VibeListCard.vue'

const props = withDefaults(defineProps<{
  activeIndex?: number
  commitPendingAppend?: (() => void | Promise<void>) | null
  hasNextPage?: boolean
  items: VibeViewerItem[]
  loading?: boolean
  pendingAppendItems?: VibeViewerItem[]
  paginationDetail?: string | null
  requestNextPage?: (() => void | Promise<void>) | null
  restoreToken: number
}>(), {
  activeIndex: 0,
  commitPendingAppend: null,
  hasNextPage: false,
  loading: false,
  pendingAppendItems: () => [],
  paginationDetail: null,
  requestNextPage: null,
})

const emit = defineEmits<{
  'open-fullscreen': [index: number]
  'update:activeIndex': [value: number]
}>()

const list = useVibeMasonryList({
  items: toRef(props, 'items'),
  activeIndex: toRef(props, 'activeIndex'),
  loading: toRef(props, 'loading'),
  hasNextPage: toRef(props, 'hasNextPage'),
  paginationDetail: toRef(props, 'paginationDetail'),
  pendingAppendItems: toRef(props, 'pendingAppendItems'),
  commitPendingAppend: toRef(props, 'commitPendingAppend'),
  requestNextPage: toRef(props, 'requestNextPage'),
  restoreToken: toRef(props, 'restoreToken'),
  setActiveIndex(index) {
    emit('update:activeIndex', index)
  },
})
</script>

<template>
  <div class="relative h-full min-h-0 bg-[radial-gradient(circle_at_top_center,rgba(255,255,255,0.04),transparent_28%),linear-gradient(180deg,#06070b,#05060a)]">
    <div class="pointer-events-none absolute inset-x-0 top-0 z-[2] flex justify-end p-6">
      <span
        data-testid="vibe-root-pagination"
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
    >
      <div
        data-testid="vibe-list-content"
        class="relative"
        :style="{ height: `${list.containerHeight.value}px` }"
      >
        <article
          v-for="{ item, index } in list.renderedItems.value"
          :key="item.id"
          data-testid="vibe-list-card"
          :data-active="index === list.resolvedActiveIndex.value ? 'true' : 'false'"
          :data-index="index"
          class="absolute will-change-transform"
          :style="list.getCardStyle(index)"
        >
          <button
            type="button"
            class="block h-full w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
            :aria-label="item.title || `Open item ${index + 1}`"
            @click="emit('open-fullscreen', index)"
          >
            <VibeListCard :active="index === list.resolvedActiveIndex.value" :item="item" />
          </button>
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

    <div v-if="list.footerStatusMessage.value" class="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center px-6 pb-6">
      <span class="inline-flex items-center border border-white/14 bg-black/55 px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/72 backdrop-blur-[18px]">
        {{ list.footerStatusMessage.value }}
      </span>
    </div>
  </div>
</template>
