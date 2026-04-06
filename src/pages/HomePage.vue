<script setup lang="ts">
import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeGetItemsParams, VibeGetItemsResult } from '@/components/vibe-root/useVibeRoot'
import { fetchFakeMediaPage } from '@/demo/fakeServer'

async function getItems({ cursor, pageSize }: VibeGetItemsParams): Promise<VibeGetItemsResult> {
  const response = await fetchFakeMediaPage({
    page: cursor ?? 1,
    pageSize,
  })

  return {
    items: response.items,
    nextPage: response.nextPage,
    previousPage: response.previousPage,
  }
}
</script>

<template>
  <section class="relative h-full min-h-0 bg-[#05060a]">
    <VibeRoot :get-items="getItems" />
  </section>
</template>
