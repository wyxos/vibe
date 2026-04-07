<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeGetItemsParams, VibeGetItemsResult } from '@/components/viewer-core/useViewer'
import { getFakeMediaItemIcon } from '@/demo/fakeMediaItemIcon'
import { fetchFakeMediaPage } from '@/demo/fakeServer'

const route = useRoute()
const remainingFailures = ref(0)
const failureConfig = computed(() => {
  const failCount = Number.parseInt(String(route.query.failCount ?? '1'), 10)
  const failPage = Number.parseInt(String(route.query.failPage ?? ''), 10)

  return {
    failCount: Number.isFinite(failCount) && failCount > 0 ? failCount : 0,
    failPage: Number.isFinite(failPage) && failPage > 0 ? failPage : null,
  }
})

watch(
  failureConfig,
  (config) => {
    remainingFailures.value = config.failPage ? config.failCount : 0
  },
  {
    immediate: true,
  },
)

async function getItems({ cursor, pageSize }: VibeGetItemsParams): Promise<VibeGetItemsResult> {
  const page = normalizeRequestedPage(cursor)

  maybeFailPage(page)

  const response = await fetchFakeMediaPage({
    page,
    pageSize,
  })

  return {
    items: response.items,
    nextPage: response.nextPage,
    previousPage: response.previousPage,
  }
}

function maybeFailPage(page: number) {
  if (!failureConfig.value.failPage || remainingFailures.value < 1) {
    return
  }

  if (page !== failureConfig.value.failPage) {
    return
  }

  remainingFailures.value -= 1
  throw new Error(`Simulated page ${page} failure.`)
}

function normalizeRequestedPage(cursor: string | null) {
  if (!cursor) {
    return 1
  }

  const parsed = Number.parseInt(cursor, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function renderItemIcon(item: VibeViewerItem, icon: unknown) {
  return (getFakeMediaItemIcon(item) ?? icon) as Component
}
</script>

<template>
  <section class="relative h-full min-h-0 bg-[#05060a]">
    <Layout :get-items="getItems">
      <template #item-icon="{ item, icon }">
        <component :is="renderItemIcon(item, icon)" class="h-6 w-6 stroke-[1.9]" aria-hidden="true" />
      </template>
    </Layout>
  </section>
</template>
