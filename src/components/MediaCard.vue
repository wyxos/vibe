<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
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
import { isTimedMediaSource } from '../core/mediaType'
import type {
  VibeCardRegion,
  VibeItem,
  VibeLayout,
  VibeMediaSource,
  VibeMediaCardOptions,
} from '../types'
import CardRegion from './CardRegion.vue'
import MediaControls from './MediaControls.vue'

const props = defineProps<{
  active?: boolean
  advanceOnMediaEnd?: boolean
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
  entering: boolean
  fetchPriority: 'high' | 'low'
  index: number
  item: VibeItem
  itemStyle?: CSSProperties
  interactive?: boolean
  leaving?: boolean
  layout: VibeLayout
  loadedCount: number
  mediaIndex: number
  mediaCard?: VibeMediaCardOptions
  mediaSource?: VibeMediaSource
  previewState: MediaPreviewState
  reelControlsTarget?: HTMLElement | null
  stationaryReelControls?: boolean
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
  ended: [mediaIndex: number]
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
const videoCurrentTime = shallowRef(0)
const videoDuration = shallowRef(0)
const videoIsMuted = shallowRef(props.mediaCard?.videoMuted ?? false)
const videoIsPlaying = shallowRef(false)
const videoVolume = shallowRef(1)
let lastAudibleVolume = 1

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

const mediaIsTimed = computed(() => isTimedMediaSource(mediaSrc.value))
const usesStationaryReelControls = computed(() => (
  props.layout === 'reel' && props.stationaryReelControls === true
))
const mediaControlsVisible = computed(() => (
  mediaIsTimed.value
  && props.previewState === 'ready'
  && (
    !usesStationaryReelControls.value
    || Boolean(props.active && props.reelControlsTarget)
  )
))
const mediaControlsKey = computed(() => (
  `${props.item.postId}:${normalizedMediaIndex.value}:${mediaSrc.value}`
))

function onVideoClick(event: MouseEvent): void {
  if (props.layout !== 'reel') return

  event.stopPropagation()
  void toggleVideoPlayback()
}

async function toggleVideoPlayback(): Promise<void> {
  if (!videoElement.value) return

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

function finiteMediaValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function syncVideoState(event?: Event): void {
  const video = (event?.currentTarget as HTMLVideoElement | null) ?? videoElement.value
  if (!video) return

  videoCurrentTime.value = finiteMediaValue(video.currentTime)
  videoDuration.value = finiteMediaValue(video.duration)
  videoIsMuted.value = video.muted
  videoVolume.value = video.volume
  if (video.volume > 0) lastAudibleVolume = video.volume
}

function onVideoLoadedMetadata(event: Event): void {
  syncVideoState(event)
  emit('ready', normalizedMediaIndex.value)
}

function onMediaEnded(): void {
  videoIsPlaying.value = false
  emit('ended', normalizedMediaIndex.value)
}

function seekVideo(time: number): void {
  const video = videoElement.value
  if (!video || !Number.isFinite(time)) return

  video.currentTime = Math.min(finiteMediaValue(video.duration), Math.max(0, time))
  videoCurrentTime.value = video.currentTime
}

function setVideoVolume(volume: number): void {
  const video = videoElement.value
  if (!video || !Number.isFinite(volume)) return

  const nextVolume = Math.min(1, Math.max(0, volume))
  video.volume = nextVolume
  video.muted = nextVolume === 0
  if (nextVolume > 0) lastAudibleVolume = nextVolume
  syncVideoState()
}

function toggleVideoMute(): void {
  const video = videoElement.value
  if (!video) return

  if (video.muted && video.volume === 0) video.volume = lastAudibleVolume
  video.muted = !video.muted
  syncVideoState()
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
      'media-card--leaving': leaving,
      'media-card--error': previewState === 'error',
      'media-card--transparent-chrome':
        mediaCard?.header?.background === 'transparent'
        || mediaCard?.footer?.background === 'transparent'
        || cardHeader?.background === 'transparent'
        || cardFooter?.background === 'transparent',
    }"
    :style="itemStyle"
    :aria-hidden="leaving || undefined"
    :aria-busy="previewState === 'loading'"
    :inert="leaving || undefined"
    :role="interactive && !leaving && !usesSeparateActivator ? 'button' : undefined"
    :tabindex="interactive && !leaving && !usesSeparateActivator ? 0 : undefined"
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
        :style="mediaCard?.header"
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
            :key="`${item.postId}:${mediaItem.src}:${mediaSource ?? 'preview'}`"
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
              v-if="mediaIsTimed"
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
              :loop="!advanceOnMediaEnd"
              :muted="videoIsMuted"
              playsinline
              :preload="fetchPriority === 'high' ? 'auto' : 'metadata'"
              @loadedmetadata="onVideoLoadedMetadata"
              @durationchange="syncVideoState"
              @timeupdate="syncVideoState"
              @volumechange="syncVideoState"
              @playing="videoIsPlaying = true"
              @pause="videoIsPlaying = false"
              @ended="onMediaEnded"
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

        <Teleport
          :disabled="!usesStationaryReelControls || !reelControlsTarget"
          :to="reelControlsTarget ?? 'body'"
        >
          <Transition
            name="vibe-reel-media-controls"
            :css="usesStationaryReelControls"
          >
            <MediaControls
              v-if="mediaControlsVisible"
              :key="mediaControlsKey"
              :current-time="videoCurrentTime"
              :data-control-post-id="usesStationaryReelControls ? item.postId : undefined"
              :duration="videoDuration"
              :layout="layout"
              :muted="videoIsMuted"
              :playing="videoIsPlaying"
              :volume="videoVolume"
              @seek="seekVideo"
              @toggle-mute="toggleVideoMute"
              @toggle-playback="toggleVideoPlayback"
              @volume-change="setVideoVolume"
            />
          </Transition>
        </Teleport>

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
        :style="mediaCard?.footer"
        :total="total"
      />
    </div>
  </article>
</template>
