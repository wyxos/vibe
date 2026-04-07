<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeGetItemsParams, VibeGetItemsResult } from '@/components/vibe-root/useVibeRoot'
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
</script>

<template>
  <section class="relative h-full min-h-0 bg-[#05060a]">
    <VibeRoot :get-items="getItems" />
  </section>
</template>
