<script setup lang="ts">
import { Pause, Play } from 'lucide-vue-next'
import {
  computed,
  shallowRef,
  type CSSProperties,
} from 'vue'

import {
  mediaErrorLabel,
  mediaErrorStatus,
  type MediaPreviewState,
} from '../core/mediaPreview'
import type {
  VibeCardRegion,
  VibeItem,
  VibeLayout,
  VibeMediaSource,
} from '../types'

const props = defineProps<{
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
  entering: boolean
  fetchPriority: 'high' | 'low'
  index: number
  item: VibeItem
  itemStyle?: CSSProperties
  interactive?: boolean
  layout: VibeLayout
  loadedCount: number
  mediaSource?: VibeMediaSource
  previewState: MediaPreviewState
  total: number | null
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
const videoElement = shallowRef<HTMLVideoElement | null>(null)
const videoIsPlaying = shallowRef(false)

const usesSeparateActivator = computed(() => (
  props.interactive && Boolean(props.cardHeader || props.cardFooter)
))

function regionStyle(region: VibeCardRegion): CSSProperties {
  return { height: `${region.height}px` }
}

function isVideo(src: string): boolean {
  try {
    return /\.(mp4|webm|mov)$/i.test(new URL(src).pathname)
  } catch {
    return /\.(mp4|webm|mov)(?:$|\?)/i.test(src)
  }
}

const mediaIsVideo = computed(() => isVideo(mediaSrc.value))

function onVideoClick(event: MouseEvent): void {
  if (props.layout !== 'reel') return

  event.stopPropagation()
  void toggleVideoPlayback()
}

async function toggleVideoPlayback(): Promise<void> {
  if (props.layout !== 'reel' || !videoElement.value) return

  if (videoIsPlaying.value) {
    videoElement.value.pause()
    return
  }

  try {
    await videoElement.value.play()
  } catch {
    videoIsPlaying.value = false
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
    :role="interactive && !usesSeparateActivator ? 'button' : undefined"
    :tabindex="interactive && !usesSeparateActivator ? 0 : undefined"
    @click="activate(interactive && !usesSeparateActivator)"
    @keydown.enter="activate(interactive && !usesSeparateActivator)"
    @keydown.space.prevent="activate(interactive && !usesSeparateActivator)"
  >
    <div class="media-card-content">
      <div
        v-if="cardHeader"
        class="media-card-header"
        :style="regionStyle(cardHeader)"
        @click.stop
        @keydown.stop
      >
        <component
          :is="cardHeader.component"
          :index="index"
          :item="item"
          :layout="layout"
          :loaded-count="loadedCount"
          :media-source="mediaSource ?? 'preview'"
          :total="total"
        />
      </div>

      <div class="media-card-media">
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
          v-if="mediaIsVideo"
          ref="videoElement"
          class="media-preview"
          :class="{
            'media-preview--ready': previewState === 'ready',
            'media-preview--reel-video': layout === 'reel',
          }"
          :src="mediaSrc"
          :width="mediaWidth ?? undefined"
          :height="mediaHeight ?? undefined"
          autoplay
          loop
          muted
          playsinline
          :preload="fetchPriority === 'high' ? 'auto' : 'metadata'"
          @loadedmetadata="$emit('ready')"
          @playing="videoIsPlaying = true"
          @pause="videoIsPlaying = false"
          @click="onVideoClick"
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

        <button
          v-if="mediaIsVideo && layout === 'reel' && previewState === 'ready'"
          type="button"
          class="media-video-control"
          :aria-label="videoIsPlaying ? 'Pause video' : 'Play video'"
          :title="videoIsPlaying ? 'Pause video' : 'Play video'"
          @click.stop="toggleVideoPlayback"
          @keydown.stop
        >
          <Pause v-if="videoIsPlaying" :size="18" />
          <Play v-else :size="18" />
        </button>

        <button
          v-if="usesSeparateActivator"
          class="media-card-activator"
          type="button"
          :aria-label="`Open post ${item.postId}`"
          @click.stop="$emit('activate')"
          @keydown.stop
        />
      </div>

      <div
        v-if="cardFooter"
        class="media-card-footer"
        :style="regionStyle(cardFooter)"
        @click.stop
        @keydown.stop
      >
        <component
          :is="cardFooter.component"
          :index="index"
          :item="item"
          :layout="layout"
          :loaded-count="loadedCount"
          :media-source="mediaSource ?? 'preview'"
          :total="total"
        />
      </div>
    </div>
  </article>
</template>
