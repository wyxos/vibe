<script setup lang="ts">
import type { Component } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Laugh, Heart, ThumbsDown, ThumbsUp } from 'lucide-vue-next'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import { createTrackedFakeFeedResolver } from '@/demo/fakeFeedResolver'
import { createDemoFeedStatusEntries, type DemoFeedStatus } from '@/demo/feedStatus'
import { getFakeMediaItemIcon } from '@/demo/fakeMediaItemIcon'

const INITIAL_PAGE = 10
const PAGE_SIZE = 25
const REACTION_ACTIONS = [
  { icon: Heart, label: 'Favorite' },
  { icon: ThumbsUp, label: 'Like' },
  { icon: Laugh, label: 'Funny' },
  { icon: ThumbsDown, label: 'Dislike' },
] as const
const vibeRef = ref<VibeHandle | null>(null)
const feed = createTrackedFakeFeedResolver({
  initialCursor: INITIAL_PAGE,
  mode: 'static',
})
const resolve = feed.resolve
const demoFeedStatus = computed<DemoFeedStatus>(() => ({
  ...feed.status,
  ...vibeRef.value?.status,
} as DemoFeedStatus))
const demoStatusEntries = computed(() => createDemoFeedStatusEntries(demoFeedStatus.value, {
  baseCursor: INITIAL_PAGE,
  labels: {
    current: 'Viewing',
    fill: 'Fill',
    next: 'Next',
    previous: 'Previous',
    status: 'Status',
    total: 'Total',
  },
  mode: 'static',
  pageSize: PAGE_SIZE,
  testIdPrefix: 'advanced-static-status',
}))

function renderItemIcon(item: VibeViewerItem, icon: unknown) {
  return (getFakeMediaItemIcon(item) ?? icon) as Component
}

function removeItemById(id: string) {
  const result = vibeRef.value?.remove(id)
  if (result?.ids.length) {
    feed.remove(result.ids)
  }
}

function undoRemoval() {
  const result = vibeRef.value?.undo()
  if (result?.ids.length) {
    feed.undo()
  }
}

function onWindowKeydown(event: KeyboardEvent) {
  if (
    event.defaultPrevented
    || !(event.metaKey || event.ctrlKey)
    || event.shiftKey
    || event.altKey
    || event.key.toLowerCase() !== 'z'
  ) {
    return
  }

  event.preventDefault()
  undoRemoval()
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>

<template>
  <section class="relative h-full min-h-0 bg-[#05060a]">
    <Layout
      ref="vibeRef"
      :initial-cursor="String(INITIAL_PAGE)"
      mode="static"
      :resolve="resolve"
      :show-end-badge="false"
      :show-status-badges="false"
    >
      <template #grid-item-overlay="{ focused, hovered, item }">
        <div
          v-if="hovered || focused"
          class="absolute inset-x-0 bottom-0 p-3"
        >
          <div
            data-testid="demo-reaction-bar"
            class="pointer-events-auto flex items-center justify-center gap-2 border border-white/12 bg-black/45 px-3 py-2 backdrop-blur-[18px]"
          >
            <button
              v-for="action in REACTION_ACTIONS"
              :key="action.label"
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center border border-white/12 bg-white/[0.03] text-[#f7f1ea]/76 transition hover:border-white/24 hover:bg-white/[0.08] hover:text-[#f7f1ea]"
              :aria-label="`${action.label} ${item.title ?? item.id}`"
              data-testid="demo-reaction-button"
              @click.stop.prevent="removeItemById(item.id)"
            >
              <component :is="action.icon" class="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </template>
      <template #item-icon="{ item, icon }">
        <component :is="renderItemIcon(item, icon)" class="h-6 w-6 stroke-[1.9]" aria-hidden="true" />
      </template>
      <template #grid-footer>
        <div
          data-testid="advanced-static-status-bar"
          class="pointer-events-auto flex w-full max-w-[1120px] flex-wrap items-center justify-center gap-x-5 gap-y-2 border border-white/12 bg-black/55 px-4 py-3 backdrop-blur-[18px] sm:px-5"
        >
          <div
            v-for="entry in demoStatusEntries"
            :key="entry.key"
            :data-testid="entry.testId"
            class="flex items-baseline gap-2"
          >
            <span class="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/46">
              {{ entry.label }}
            </span>
            <span class="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#f7f1ea]/82">
              {{ entry.value }}
            </span>
          </div>
        </div>
      </template>
    </Layout>
  </section>
</template>
