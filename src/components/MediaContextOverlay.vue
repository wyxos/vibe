<script setup lang="ts">
import type { VibeItem, VibeMediaAsset, VibeMediaCardOptions, VibeMediaSource } from '../types'

defineProps<{
  item: VibeItem
  mediaCard?: VibeMediaCardOptions
  mediaIndex: number
  mediaItem: VibeMediaAsset
  mediaSource: VibeMediaSource
}>()
</script>

<template>
  <div
    v-if="mediaCard?.overlay?.component"
    class="media-card-overlay-host"
    data-test="media-card-overlay"
  >
    <component
      :is="mediaCard.overlay.component"
      :item="item"
      :media-index="mediaIndex"
      :media-item="mediaItem"
      :media-source="mediaSource"
    />
  </div>
</template>
