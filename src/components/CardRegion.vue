<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { useCardChromeSelection } from './cardChromeSelection'

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
  scrolling?: boolean
  style?: VibeCardChromeStyle
  total: number | null
}>()
const selectChrome = useCardChromeSelection(() => props.item.postId, () => props.layout)
const deferMount = computed(() => props.layout === 'masonry' && props.region.deferMountDuringScroll === true)
const mounted = shallowRef(!deferMount.value || !props.scrolling)
let cancelMount: (() => void) | undefined
watch([deferMount, () => props.scrolling], ([deferred, scrolling]) => {
  cancelMount?.()
  cancelMount = undefined
  if (mounted.value) return
  if (!deferred) { mounted.value = true; return }
  if (scrolling) return
  // Idle work avoids mounting every newly visible control in one settling frame.
  // Animation frames provide a cancellable fallback where idle callbacks are absent.
  const mount = () => { cancelMount = undefined; mounted.value = true }
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(mount)
    cancelMount = () => cancelIdleCallback(handle)
  } else {
    const handle = requestAnimationFrame(mount)
    cancelMount = () => cancelAnimationFrame(handle)
  }
}, { flush: 'sync' })
onBeforeUnmount(() => cancelMount?.())

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
    @click.capture="selectChrome"
    @click.stop
    @keydown.stop
  >
    <component
      v-if="mounted"
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
