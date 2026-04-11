<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import { createTrackedFakeFeedResolver } from '@/demo/fakeFeedResolver'
import { createDemoFeedStatusEntries, type DemoFeedStatus } from '@/demo/feedStatus'
import { getFakeMediaItemIcon } from '@/demo/fakeMediaItemIcon'

const INITIAL_CURSOR = 1
const PAGE_SIZE = 25
const route = useRoute()
const vibeRef = ref<VibeHandle | null>(null)
const failureConfig = computed(() => {
  const failCount = Number.parseInt(String(route.query.failCount ?? '1'), 10)
  const failPage = Number.parseInt(String(route.query.failPage ?? ''), 10)

  return {
    failCount: Number.isFinite(failCount) && failCount > 0 ? failCount : 0,
    failPage: Number.isFinite(failPage) && failPage > 0 ? failPage : null,
  }
})
const feed = computed(() => createTrackedFakeFeedResolver({
  failCount: failureConfig.value.failCount,
  failPage: failureConfig.value.failPage,
  initialCursor: INITIAL_CURSOR,
  mode: 'dynamic',
}))
const resolve = computed(() => feed.value.resolve)
const demoFeedStatus = computed<DemoFeedStatus>(() => ({
  ...feed.value.status,
  ...vibeRef.value?.status,
} as DemoFeedStatus))
const demoStatusEntries = computed(() => createDemoFeedStatusEntries(demoFeedStatus.value, {
  baseCursor: INITIAL_CURSOR,
  labels: {
    current: 'Viewing',
    delay: 'Delay',
    fill: 'Fill',
    next: 'Next',
    previous: 'Previous',
    status: 'Status',
    total: 'Total',
  },
  mode: 'dynamic',
  pageSize: PAGE_SIZE,
  testIdPrefix: 'dynamic-demo-status',
}))

function renderItemIcon(item: VibeViewerItem, icon: unknown) {
  return (getFakeMediaItemIcon(item) ?? icon) as Component
}
</script>

<template>
  <section class="relative h-full min-h-0 bg-[#05060a]">
    <Layout
      ref="vibeRef"
      :initial-cursor="String(INITIAL_CURSOR)"
      mode="dynamic"
      :resolve="resolve"
      :show-end-badge="false"
      :show-status-badges="false"
    >
      <template #item-icon="{ item, icon }">
        <component :is="renderItemIcon(item, icon)" class="h-6 w-6 stroke-[1.9]" aria-hidden="true" />
      </template>
      <template #grid-footer>
        <div
          data-testid="dynamic-demo-status-bar"
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
