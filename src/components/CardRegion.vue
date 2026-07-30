<script setup lang="ts">
import { computed } from 'vue'

import {
  clampMediaIndex,
  mediaAssetAt,
  mediaAssets,
} from '../core/mediaAsset'
import type {
  VibeCardRegion,
  VibeItem,
  VibeLayout,
  VibeMediaSource,
} from '../types'

const props = defineProps<{
  index: number
  item: VibeItem
  layout: VibeLayout
  loadedCount: number
  mediaIndex: number
  mediaSource?: VibeMediaSource
  placement: 'footer' | 'header'
  region: VibeCardRegion
  total: number | null
}>()

const normalizedMediaIndex = computed(() => (
  clampMediaIndex(props.item, props.mediaIndex)
))
const mediaItems = computed(() => mediaAssets(props.item))
const mediaItem = computed(() => (
  mediaAssetAt(props.item, normalizedMediaIndex.value)
))
</script>

<template>
  <div
    class="media-card-region"
    :class="[
      `media-card-${placement}`,
      {
        'media-card-region--transparent': region.background === 'transparent',
      },
    ]"
    :style="{ height: `${region.height}px` }"
    @click.stop
    @keydown.stop
  >
    <component
      :is="region.component"
      :index="index"
      :item="item"
      :layout="layout"
      :loaded-count="loadedCount"
      :media-count="mediaItems.length"
      :media-index="normalizedMediaIndex"
      :media-item="mediaItem"
      :media-source="mediaSource ?? 'preview'"
      :total="total"
    />
  </div>
</template>
