<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'

import { mediaVariantForSource } from '../core/mediaAsset'
import { isTimedMedia } from '../core/mediaType'
import type {
  VibeGroupedMediaNavigation,
  VibeItemId,
  VibeMediaAsset,
} from '../types'

const props = defineProps<{
  media: readonly VibeMediaAsset[]
  mediaIndex: number
  mode: VibeGroupedMediaNavigation
  persistent?: boolean
  postId: VibeItemId
}>()

const emit = defineEmits<{
  change: [index: number, event: MouseEvent]
}>()

const mediaCount = computed(() => props.media.length)

function thumbnail(asset: VibeMediaAsset) {
  return mediaVariantForSource(asset, 'preview')
}

function thumbnailIsVideo(asset: VibeMediaAsset) {
  const variant = thumbnail(asset)
  return isTimedMedia(variant.type, variant.src)
}

function change(index: number, event: MouseEvent) {
  emit('change', index, event)
}
</script>

<template>
  <div
    v-if="mode === 'thumbnails'"
    class="media-thumbnail-strip"
    aria-label="Media navigation"
  >
    <button
      v-for="(asset, index) in media"
      :key="`${postId}:${index}:${thumbnail(asset).src}`"
      type="button"
      class="media-thumbnail-button"
      :class="{ 'media-thumbnail-button--active': index === mediaIndex }"
      :aria-label="`Show media ${index + 1} of ${mediaCount} for post ${postId}`"
      :aria-pressed="index === mediaIndex"
      @click.stop="change(index, $event)"
      @keydown.stop
    >
      <video
        v-if="thumbnailIsVideo(asset)"
        class="media-thumbnail-preview"
        :src="thumbnail(asset).src"
        muted
        playsinline
        preload="metadata"
      />
      <img
        v-else
        class="media-thumbnail-preview"
        :src="thumbnail(asset).src"
        alt=""
        decoding="async"
        loading="lazy"
      >
    </button>
  </div>

  <div
    v-else
    class="media-carousel-controls"
    :class="{ 'media-carousel-controls--persistent': persistent }"
    aria-label="Media navigation"
  >
    <button
      type="button"
      class="media-carousel-control media-carousel-control--previous"
      :aria-label="`Previous media for post ${postId}`"
      @click.stop="change(mediaIndex - 1, $event)"
      @keydown.stop
    >
      <ChevronLeft :size="20" />
    </button>
    <button
      type="button"
      class="media-carousel-control media-carousel-control--next"
      :aria-label="`Next media for post ${postId}`"
      @click.stop="change(mediaIndex + 1, $event)"
      @keydown.stop
    >
      <ChevronRight :size="20" />
    </button>
  </div>
</template>
