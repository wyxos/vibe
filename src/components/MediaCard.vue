<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

import type { MediaSource } from '../core/feed'
import {
  mediaErrorLabel,
  mediaErrorStatus,
  type MediaPreviewState,
} from '../core/mediaPreview'
import type { VibeItem } from '../types'

const props = defineProps<{
  entering: boolean
  fetchPriority: 'high' | 'low'
  item: VibeItem
  itemStyle?: CSSProperties
  interactive?: boolean
  mediaSource?: MediaSource
  previewState: MediaPreviewState
}>()

const emit = defineEmits<{
  activate: []
  error: []
  ready: []
}>()

function activate(interactive = false): void {
  if (interactive) emit('activate')
}

const mediaSrc = computed(() => (
  props.mediaSource === 'original' ? props.item.src : props.item.preview.src
))

const mediaWidth = computed(() => (
  props.mediaSource === 'original' ? props.item.width : props.item.preview.width
))

const mediaHeight = computed(() => (
  props.mediaSource === 'original' ? props.item.height : props.item.preview.height
))

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
    class="media-card"
    :class="{
      'media-card--entering': entering,
      'media-card--error': previewState === 'error',
    }"
    :style="itemStyle"
    :aria-busy="previewState === 'loading'"
    :role="interactive ? 'button' : undefined"
    :tabindex="interactive ? 0 : undefined"
    @click="activate(interactive)"
    @keydown.enter="activate(interactive)"
    @keydown.space.prevent="activate(interactive)"
  >
    <div class="media-card-content">
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
        :aria-label="`${mediaErrorStatus(mediaSrc)} ${mediaErrorLabel(mediaSrc)}`"
      >
        <strong class="media-error-code">
          {{ mediaErrorStatus(mediaSrc) }}
        </strong>
        <span>{{ mediaErrorLabel(mediaSrc) }}</span>
      </div>

      <video
        v-if="isVideo(mediaSrc)"
        class="media-preview"
        :class="{ 'media-preview--ready': previewState === 'ready' }"
        :src="mediaSrc"
        :width="mediaWidth ?? undefined"
        :height="mediaHeight ?? undefined"
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
        :src="mediaSrc"
        :width="mediaWidth ?? undefined"
        :height="mediaHeight ?? undefined"
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
