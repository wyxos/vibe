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
  mediaVariantForSource,
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
  VibeMediaCardOptions,
  VibeReelAudioState,
} from '../types'
import CardRegion from './CardRegion.vue'
import MediaError from './MediaError.vue'
import MediaControls from './MediaControls.vue'
import { useMediaCardAudio } from './useMediaCardAudio'
import { useFeedReplacementPreload } from './useFeedReplacementPreload'
import { useReelVideoActivity } from './useReelVideoActivity'
import { useMediaLoading } from './useMediaLoading'
import { useMediaReadiness } from './useMediaReadiness'

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
  reelAudioState?: VibeReelAudioState
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
  reelAudioChange: [state: VibeReelAudioState]
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
const mediaVariant = computed(() => mediaVariantForSource(
  mediaItem.value,
  props.mediaSource ?? 'preview',
))
const mediaSrc = computed(() => mediaVariant.value.src)
const mediaType = computed(() => mediaVariant.value.type)
const mediaWidth = computed(() => mediaVariant.value.width)
const mediaHeight = computed(() => mediaVariant.value.height)
const { effectivePreviewState, failSourceAttempt, imageElement, markSourceReady,
  noteSourceActivity, retrySource, retrying, sourceGeneration, videoElement }
  = useMediaReadiness({
  identity: () => `${props.item.postId}:${normalizedMediaIndex.value}:${props.mediaSource ?? 'preview'}:${mediaSrc.value}:${mediaType.value ?? ''}`,
  mediaIndex: () => normalizedMediaIndex.value,
  onError: (mediaIndex) => emit('error', mediaIndex),
  onReady: (mediaIndex) => emit('ready', mediaIndex),
  previewState: () => props.previewState,
})
useFeedReplacementPreload({
  item: () => props.item,
  layout: () => props.layout,
  mediaCard: () => props.mediaCard,
  mediaIndex: () => normalizedMediaIndex.value,
  mediaReady: () => effectivePreviewState.value === 'ready',
  mediaSource: () => props.mediaSource ?? 'preview',
})
const videoCurrentTime = shallowRef(0)
const videoDuration = shallowRef(0)
const videoIsPlaying = shallowRef(false)
const {
  apply: applyReelAudioState,
  setVolume: setVideoVolume,
  sync: syncVideoAudioState,
  toggleMute: toggleVideoMute,
  videoIsMuted,
  videoVolume,
} = useMediaCardAudio({
  active: () => props.active,
  layout: () => props.layout,
  mediaCard: () => props.mediaCard,
  onChange: (state) => emit('reelAudioChange', state),
  reelAudioState: () => props.reelAudioState,
  videoElement,
})
const {
  effectiveMuted: effectiveVideoMuted,
  onPlaying: onVideoPlaying,
  playbackAllowed: videoPlaybackAllowed,
} = useReelVideoActivity({
  active: () => props.active,
  layout: () => props.layout,
  videoElement,
  videoIsMuted,
  videoIsPlaying,
})

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

const { imageLoading, mediaIsTimed, videoPreload } = useMediaLoading({ active: () => props.active, fetchPriority: () => props.fetchPriority, layout: () => props.layout, mediaSource: () => mediaSrc.value, mediaType: () => mediaType.value, videoElement })
const usesStationaryReelControls = computed(() => (
  props.layout === 'reel' && props.stationaryReelControls === true
))
const mediaControlsVisible = computed(() => (
  mediaIsTimed.value
  && effectivePreviewState.value === 'ready'
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
  if (!videoElement.value || !videoPlaybackAllowed.value) return

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
  syncVideoAudioState(video, videoPlaybackAllowed.value)
}
function onVideoLoadedMetadata(event: Event): void {
  applyReelAudioState()
  syncVideoState(event)
  markSourceReady(event)
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
      'media-card--error': effectivePreviewState === 'error',
      'media-card--transparent-chrome':
        mediaCard?.header?.background === 'transparent'
        || mediaCard?.footer?.background === 'transparent'
        || cardHeader?.background === 'transparent'
        || cardFooter?.background === 'transparent',
    }"
    :style="itemStyle"
    :aria-hidden="leaving || undefined"
    :aria-busy="effectivePreviewState === 'loading' || retrying"
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
        <Transition
          :css="!retrying"
          :name="`media-slide-${mediaDirection}`"
        >
          <div
            :key="`${item.postId}:${mediaItem.src}:${mediaSource ?? 'preview'}:${sourceGeneration}`"
            class="media-card-frame"
            :data-media-index="normalizedMediaIndex"
          >
            <div
              v-if="effectivePreviewState === 'loading'"
              data-test="media-loading"
              class="media-loading"
              aria-hidden="true"
            >
              <span class="media-loading-shimmer" />
            </div>

            <MediaError
              v-else-if="effectivePreviewState === 'error'"
              :component="mediaCard?.error?.component"
              :label="mediaErrorLabel(mediaSrc)"
              :retrying="retrying"
              :status="mediaErrorStatus(mediaSrc)"
              @retry="retrySource"
            />

            <video
              v-if="mediaIsTimed"
              ref="videoElement"
              :data-source-generation="sourceGeneration"
              class="media-preview"
              :class="{
                'media-preview--ready': effectivePreviewState === 'ready',
                'media-preview--reel-video': layout === 'reel',
              }"
              :src="mediaSrc"
              :width="mediaWidth ?? undefined"
              :height="mediaHeight ?? undefined"
              :autoplay="videoPlaybackAllowed"
              :loop="!advanceOnMediaEnd"
              :muted="effectiveVideoMuted"
              playsinline
              :preload="videoPreload"
              @loadedmetadata="onVideoLoadedMetadata"
              @progress="noteSourceActivity" @loadeddata="noteSourceActivity"
              @canplay="noteSourceActivity"
              @durationchange="syncVideoState"
              @timeupdate="syncVideoState"
              @volumechange="syncVideoState"
              @playing="onVideoPlaying"
              @pause="videoIsPlaying = false"
              @ended="onMediaEnded"
              @click="onVideoClick"
              @error="failSourceAttempt"
            />

            <img
              v-else
              ref="imageElement"
              :data-source-generation="sourceGeneration"
              class="media-preview"
              :class="{ 'media-preview--ready': effectivePreviewState === 'ready' }"
              :src="mediaSrc"
              :width="mediaWidth ?? undefined"
              :height="mediaHeight ?? undefined"
              :fetchpriority="fetchPriority"
              alt=""
              decoding="async"
              :loading="imageLoading"
              @load="markSourceReady"
              @error="failSourceAttempt"
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
