<script setup lang="ts">
import type { CSSProperties } from 'vue'

import type { FakeMediaItem } from '@/demo/fakeServer'
import {
  mediaErrorLabel,
  mediaErrorStatus,
  type MediaPreviewState,
} from '@/demo/mediaPreview'

defineProps<{
  contentStyle: CSSProperties
  entering: boolean
  fetchPriority: 'high' | 'low'
  item: FakeMediaItem
  itemStyle: CSSProperties
  previewState: MediaPreviewState
}>()

defineEmits<{
  error: []
  ready: []
}>()

function isVideo(src: string): boolean {
  try {
    return /\.(mp4|webm|mov)$/i.test(new URL(src).pathname)
  } catch {
    return /\.(mp4|webm|mov)(?:$|\?)/i.test(src)
  }
}
</script>

<template>
  <article
    :data-post-id="item.postId"
    class="masonry-item"
    :class="{
      'masonry-item--entering': entering,
      'masonry-item--error': previewState === 'error',
    }"
    :style="itemStyle"
    :aria-busy="previewState === 'loading'"
  >
    <div
      class="masonry-item-content"
      :style="contentStyle"
    >
      <div
        v-if="previewState === 'loading'"
        data-test="media-loading"
        class="media-loading"
        aria-hidden="true"
      >
        <span class="media-loading-shimmer" />
      </div>

      <div
        v-else-if="previewState === 'error'"
        data-test="media-error"
        class="media-error"
        role="img"
        :aria-label="`${mediaErrorStatus(item.preview.src)} ${mediaErrorLabel(item.preview.src)}`"
      >
        <strong class="media-error-code">
          {{ mediaErrorStatus(item.preview.src) }}
        </strong>
        <span>{{ mediaErrorLabel(item.preview.src) }}</span>
      </div>

      <video
        v-if="isVideo(item.preview.src)"
        class="media-preview"
        :class="{ 'media-preview--ready': previewState === 'ready' }"
        :src="item.preview.src"
        :width="item.preview.width ?? undefined"
        :height="item.preview.height ?? undefined"
        autoplay
        loop
        muted
        playsinline
        :preload="fetchPriority === 'high' ? 'auto' : 'metadata'"
        @loadedmetadata="$emit('ready')"
        @error="$emit('error')"
      />

      <img
        v-else
        class="media-preview"
        :class="{ 'media-preview--ready': previewState === 'ready' }"
        :src="item.preview.src"
        :width="item.preview.width ?? undefined"
        :height="item.preview.height ?? undefined"
        :fetchpriority="fetchPriority"
        alt=""
        decoding="async"
        loading="eager"
        @load="$emit('ready')"
        @error="$emit('error')"
      >
    </div>
  </article>
</template>
