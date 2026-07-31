<script setup lang="ts">
import { computed } from 'vue'

import {
  clampMediaIndex,
  mediaAssetAt,
  mediaAssets,
} from '../core/mediaAsset'
import type {
  VibeCardRegion,
  VibeCardChromeStyle,
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
  style?: VibeCardChromeStyle
  total: number | null
}>()

const normalizedMediaIndex = computed(() => (
  clampMediaIndex(props.item, props.mediaIndex)
))
const mediaItems = computed(() => mediaAssets(props.item))
const mediaItem = computed(() => (
  mediaAssetAt(props.item, normalizedMediaIndex.value)
))
const chromeStyle = computed(() => ({
  height: `${props.region.height}px`,
  paddingBlock: props.style?.paddingY === undefined
    ? undefined
    : `${props.style.paddingY}px`,
  paddingInline: props.style?.paddingX === undefined
    ? undefined
    : `${props.style.paddingX}px`,
}))
const background = computed(() => (
  props.style?.background ?? props.region.background
))
</script>

<template>
  <div
    class="media-card-region"
    :class="[
      `media-card-${placement}`,
      {
        'media-card-region--transparent': background === 'transparent',
      },
    ]"
    :style="chromeStyle"
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
