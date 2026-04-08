<script setup lang="ts">
import type { Component } from 'vue'
import { createFakeFeedResolver } from '@/demo/fakeFeedResolver'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import { getFakeMediaItemIcon } from '@/demo/fakeMediaItemIcon'

const resolve = createFakeFeedResolver({
  initialCursor: 1,
})

function renderItemIcon(item: VibeViewerItem, icon: unknown) {
  return (getFakeMediaItemIcon(item) ?? icon) as Component
}
</script>

<template>
  <section class="relative h-full min-h-0 bg-[#05060a]">
    <Layout
      initial-cursor="1"
      mode="dynamic"
      :resolve="resolve"
    >
      <template #item-icon="{ item, icon }">
        <component :is="renderItemIcon(item, icon)" class="h-6 w-6 stroke-[1.9]" aria-hidden="true" />
      </template>
    </Layout>
  </section>
</template>
