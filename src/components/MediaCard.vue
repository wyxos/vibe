<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-vue-next'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  type CSSProperties,
} from 'vue'

import {
  clampMediaIndex,
  mediaAssetAt,
  mediaAssets,
} from '../core/mediaAsset'
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
import CardRegion from './CardRegion.vue'

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
  mediaIndex: number
  mediaSource?: VibeMediaSource
  previewState: MediaPreviewState
  total: number | null
}>()

const MEDIA_SWIPE_THRESHOLD = 40
const MEDIA_WHEEL_RESET_MS = 160
const MEDIA_WHEEL_THRESHOLD = 24
let wheelResetTimer: ReturnType<typeof setTimeout> | null = null
let wheelDeltaX = 0
let wheelGestureConsumed = false
let touchStartX: number | null = null
let touchStartY: number | null = null
const mediaDirection = shallowRef<'next' | 'previous'>('next')

const emit = defineEmits<{
  activate: [input: 'keyboard' | 'pointer']
  error: [mediaIndex: number]
  mediaChange: [mediaIndex: number]
  ready: [mediaIndex: number]
}>()

function activate(
  interactive = false,
  input: 'keyboard' | 'pointer' = 'pointer',
): void {
  if (interactive) emit('activate', input)
}

const mediaItems = computed(() => mediaAssets(props.item))
const normalizedMediaIndex = computed(() => (
  clampMediaIndex(props.item, props.mediaIndex)
))
const mediaItem = computed(() => (
  mediaAssetAt(props.item, normalizedMediaIndex.value)
))
const mediaSrc = computed(() => (
  props.mediaSource === 'original' ? mediaItem.value.src : mediaItem.value.preview.src
))

const mediaWidth = computed(() => (
  props.mediaSource === 'original' ? mediaItem.value.width : mediaItem.value.preview.width
))

const mediaHeight = computed(() => (
  props.mediaSource === 'original' ? mediaItem.value.height : mediaItem.value.preview.height
))
const videoElement = shallowRef<HTMLVideoElement | null>(null)
const videoIsPlaying = shallowRef(false)

const usesSeparateActivator = computed(() => (
  props.interactive && Boolean(props.cardHeader || props.cardFooter)
))

function activationInput(event: MouseEvent): 'keyboard' | 'pointer' {
  return event.detail === 0 ? 'keyboard' : 'pointer'
}

function changeMedia(index: number, event?: MouseEvent): void {
  const mediaCount = mediaItems.value.length
  const nextIndex = (index + mediaCount) % mediaCount
  if (nextIndex === normalizedMediaIndex.value) return

  mediaDirection.value = index < normalizedMediaIndex.value ? 'previous' : 'next'
  emit('mediaChange', nextIndex)
  if (event && event.detail > 0) {
    (event.currentTarget as HTMLElement | null)?.blur()
  }
}

function normalizeWheelDelta(delta: number, deltaMode: number, pageSize: number): number {
  if (deltaMode === 1) return delta * 16
  if (deltaMode === 2) return delta * pageSize
  return delta
}

function resetWheelGesture(): void {
  wheelDeltaX = 0
  wheelGestureConsumed = false
  if (wheelResetTimer !== null) clearTimeout(wheelResetTimer)
  wheelResetTimer = null
}

function scheduleWheelReset(): void {
  if (wheelResetTimer !== null) clearTimeout(wheelResetTimer)
  wheelResetTimer = setTimeout(resetWheelGesture, MEDIA_WHEEL_RESET_MS)
}

function onMediaWheel(event: WheelEvent): void {
  const mediaCount = mediaItems.value.length
  if (mediaCount <= 1) return

  const target = event.currentTarget as HTMLElement | null
  const pageSize = target?.clientWidth || 1
  const deltaX = normalizeWheelDelta(event.deltaX, event.deltaMode, pageSize)
  if (deltaX === 0) return

  event.preventDefault()
  scheduleWheelReset()
  if (wheelGestureConsumed) return

  wheelDeltaX += deltaX
  if (Math.abs(wheelDeltaX) < MEDIA_WHEEL_THRESHOLD) return

  const direction = Math.sign(wheelDeltaX)
  wheelDeltaX = 0
  wheelGestureConsumed = true
  changeMedia(normalizedMediaIndex.value + direction)
}

function onMediaTouchStart(event: TouchEvent): void {
  const touch = event.touches[0]
  if (props.layout !== 'reel' || !touch) return

  touchStartX = touch.clientX
  touchStartY = touch.clientY
}

function onMediaTouchEnd(event: TouchEvent): void {
  const touch = event.changedTouches[0]
  if (touchStartX === null || touchStartY === null || !touch) return

  const deltaX = touchStartX - touch.clientX
  const deltaY = touchStartY - touch.clientY
  touchStartX = null
  touchStartY = null
  if (Math.abs(deltaX) <= Math.abs(deltaY)) return
  if (Math.abs(deltaX) < MEDIA_SWIPE_THRESHOLD) return

  changeMedia(normalizedMediaIndex.value + Math.sign(deltaX))
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

onBeforeUnmount(() => {
  resetWheelGesture()
})
</script>

<template>
  <article
    :data-post-id="item.postId"
    :data-media-index="normalizedMediaIndex"
    class="media-card"
    :class="{
      'media-card--entering': entering,
      'media-card--error': previewState === 'error',
    }"
    :style="itemStyle"
    :aria-busy="previewState === 'loading'"
    :role="interactive && !usesSeparateActivator ? 'button' : undefined"
    :tabindex="interactive && !usesSeparateActivator ? 0 : undefined"
    @click="activate(interactive && !usesSeparateActivator, activationInput($event))"
    @keydown.enter="activate(interactive && !usesSeparateActivator, 'keyboard')"
    @keydown.space.prevent="activate(interactive && !usesSeparateActivator, 'keyboard')"
  >
    <div class="media-card-content">
      <CardRegion
        v-if="cardHeader"
        :index="index"
        :item="item"
        :layout="layout"
        :loaded-count="loadedCount"
        :media-index="normalizedMediaIndex"
        :media-source="mediaSource"
        placement="header"
        :region="cardHeader"
        :total="total"
      />

      <div
        class="media-card-media"
        :class="{ 'media-card-media--carousel': layout === 'reel' && mediaItems.length > 1 }"
        :data-media-direction="mediaDirection"
        @wheel="onMediaWheel"
        @touchstart.passive="onMediaTouchStart"
        @touchend.passive="onMediaTouchEnd"
      >
        <Transition :name="`media-slide-${mediaDirection}`">
          <div
            :key="`${item.postId}:${normalizedMediaIndex}:${mediaSource ?? 'preview'}`"
            class="media-card-frame"
            :data-media-index="normalizedMediaIndex"
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
              @loadedmetadata="$emit('ready', normalizedMediaIndex)"
              @playing="videoIsPlaying = true"
              @pause="videoIsPlaying = false"
              @click="onVideoClick"
              @error="$emit('error', normalizedMediaIndex)"
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
              @load="$emit('ready', normalizedMediaIndex)"
              @error="$emit('error', normalizedMediaIndex)"
            >
          </div>
        </Transition>

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

        <div
          v-if="mediaItems.length > 1"
          class="media-carousel-controls"
          :class="{ 'media-carousel-controls--persistent': layout === 'reel' }"
          aria-label="Media navigation"
        >
          <button
            type="button"
            class="media-carousel-control media-carousel-control--previous"
            :aria-label="`Previous media for post ${item.postId}`"
            @click.stop="changeMedia(normalizedMediaIndex - 1, $event)"
            @keydown.stop
          >
            <ChevronLeft :size="20" />
          </button>
          <button
            type="button"
            class="media-carousel-control media-carousel-control--next"
            :aria-label="`Next media for post ${item.postId}`"
            @click.stop="changeMedia(normalizedMediaIndex + 1, $event)"
            @keydown.stop
          >
            <ChevronRight :size="20" />
          </button>
        </div>

        <button
          v-if="usesSeparateActivator"
          class="media-card-activator"
          type="button"
          :aria-label="`Open post ${item.postId}`"
          @click.stop="$emit('activate', activationInput($event))"
          @keydown.stop
        />
      </div>

      <CardRegion
        v-if="cardFooter"
        :index="index"
        :item="item"
        :layout="layout"
        :loaded-count="loadedCount"
        :media-index="normalizedMediaIndex"
        :media-source="mediaSource"
        placement="footer"
        :region="cardFooter"
        :total="total"
      />
    </div>
  </article>
</template>
