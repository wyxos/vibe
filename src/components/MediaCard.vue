<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Disc3,
} from 'lucide-vue-next'
import {
  computed,
  nextTick,
  shallowRef,
  watch,
  type CSSProperties,
} from 'vue'

import {
  audioCoverVariant,
  clampMediaIndex,
  mediaAssetAt,
  mediaAssets,
  mediaPlaybackVariantForSource,
  mediaVariantForSource,
} from '../core/mediaAsset'
import { resolveMediaType } from '../core/mediaType'
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
import MediaContextOverlay from './MediaContextOverlay.vue'
import { useMediaCarouselNavigation } from './useMediaCarouselNavigation'
import { useVisiblePostPreload } from './useVisiblePostPreload'
import { useMediaLoading } from './useMediaLoading'
import { useMediaReadiness } from './useMediaReadiness'
import { useTimedMediaCard } from './useTimedMediaCard'

const props = defineProps<{
  active?: boolean
  advanceOnMediaEnd?: boolean
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
  entering: boolean
  fetchPriority: 'high' | 'low'
  inViewport?: boolean
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
const assetType = computed(() => resolveMediaType(mediaItem.value.type, mediaItem.value.src))
const isAudio = computed(() => assetType.value === 'audio')
const playbackVariant = computed(() => mediaPlaybackVariantForSource(
  mediaItem.value,
  props.mediaSource ?? 'preview',
))
const renderedVariant = computed(() => isAudio.value ? playbackVariant.value : mediaVariant.value)
const mediaSrc = computed(() => renderedVariant.value.src)
const mediaType = computed(() => resolveMediaType(
  renderedVariant.value.type,
  renderedVariant.value.src,
))
const mediaWidth = computed(() => mediaVariant.value.width)
const mediaHeight = computed(() => mediaVariant.value.height)
const audioCover = computed(() => audioCoverVariant(mediaItem.value))
const audioCoverFailed = shallowRef(false)
const visibleAudioCover = computed(() => audioCoverFailed.value ? null : audioCover.value)
const { effectivePreviewState, failSourceAttempt, imageElement, markSourceReady,
  noteSourceActivity, retrySource, retrying, sourceGeneration, mediaElement }
  = useMediaReadiness({
  identity: () => `${props.item.postId}:${normalizedMediaIndex.value}:${props.mediaSource ?? 'preview'}:${mediaSrc.value}:${mediaType.value ?? ''}`,
  mediaIndex: () => normalizedMediaIndex.value,
  onError: (mediaIndex) => emit('error', mediaIndex),
  onReady: (mediaIndex) => emit('ready', mediaIndex),
  previewState: () => props.previewState,
})
useVisiblePostPreload({
  inViewport: () => props.inViewport === true,
  item: () => props.item,
  layout: () => props.layout,
  mediaCard: () => props.mediaCard,
  mediaIndex: () => normalizedMediaIndex.value,
  mediaReady: () => effectivePreviewState.value === 'ready',
  mediaSource: () => props.mediaSource ?? 'preview',
})
const {
  currentTime: timedMediaCurrentTime,
  duration: timedMediaDuration,
  effectiveMuted: effectiveTimedMediaMuted,
  isMuted: timedMediaIsMuted,
  isPlaying: timedMediaIsPlaying,
  onEnded: onTimedMediaEnded,
  onLoadedMetadata: onTimedMediaLoadedMetadata,
  onPlaying: onTimedMediaPlaying,
  playbackAllowed: timedMediaPlaybackAllowed,
  seek: seekTimedMedia,
  setVolume: setTimedMediaVolume,
  sync: syncTimedMediaState,
  toggleMute: toggleTimedMediaMute,
  togglePlayback: toggleTimedMediaPlayback,
  volume: timedMediaVolume,
} = useTimedMediaCard({
  active: () => props.active,
  layout: () => props.layout,
  mediaCard: () => props.mediaCard,
  mediaElement,
  onAudioChange: (state) => emit('reelAudioChange', state),
  onEnded: () => emit('ended', normalizedMediaIndex.value),
  onReady: markSourceReady,
  reelAudioState: () => props.reelAudioState,
})

const usesSeparateActivator = computed(() => (
  props.interactive && Boolean(props.cardHeader || props.cardFooter)
))

function activationInput(event: MouseEvent): 'keyboard' | 'pointer' {
  return event.detail === 0 ? 'keyboard' : 'pointer'
}
const {
  change: changeMedia,
  direction: mediaDirection,
  onTouchEnd: onMediaTouchEnd,
  onTouchStart: onMediaTouchStart,
  onWheel: onMediaWheel,
} = useMediaCarouselNavigation({
  item: () => props.item,
  layout: () => props.layout,
  mediaIndex: () => normalizedMediaIndex.value,
  onChange: (mediaIndex) => emit('mediaChange', mediaIndex),
})

const { imageLoading, mediaIsTimed, timedMediaPreload } = useMediaLoading({ active: () => props.active, fetchPriority: () => props.fetchPriority, layout: () => props.layout, mediaSource: () => mediaSrc.value, mediaType: () => mediaType.value, mediaElement })
const usesStationaryReelControls = computed(() => props.layout === 'reel'
  && props.stationaryReelControls === true)
const mediaControlsVisible = computed(() => (
  mediaIsTimed.value
  && (!isAudio.value || props.layout === 'reel')
  && effectivePreviewState.value === 'ready'
  && (
    !usesStationaryReelControls.value
    || Boolean(props.active && props.reelControlsTarget)
  )
))
const mediaControlsKey = computed(() => (
  `${props.item.postId}:${normalizedMediaIndex.value}:${mediaSrc.value}`
))

function onTimedMediaClick(event: MouseEvent): void {
  if (props.layout !== 'reel') return

  event.stopPropagation()
  void toggleTimedMediaPlayback()
}
function onAudioCoverError(): void {
  audioCoverFailed.value = true
  if (props.layout === 'masonry') markSourceReady()
}

watch(() => audioCover.value?.src, () => {
  audioCoverFailed.value = false
})
watch(
  [isAudio, () => props.layout, visibleAudioCover],
  ([audio, layout, cover]) => {
    if (audio && layout === 'masonry' && !cover) void nextTick(() => markSourceReady())
  },
  { immediate: true },
)

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

            <audio
              v-if="isAudio && layout === 'reel'"
              ref="mediaElement"
              :data-source-generation="sourceGeneration"
              class="media-audio-element"
              :src="mediaSrc"
              :autoplay="timedMediaPlaybackAllowed"
              :loop="!advanceOnMediaEnd"
              :muted="effectiveTimedMediaMuted"
              :preload="timedMediaPreload"
              @loadedmetadata="onTimedMediaLoadedMetadata"
              @progress="noteSourceActivity" @loadeddata="noteSourceActivity"
              @canplay="noteSourceActivity"
              @durationchange="syncTimedMediaState"
              @timeupdate="syncTimedMediaState"
              @volumechange="syncTimedMediaState"
              @playing="onTimedMediaPlaying"
              @pause="timedMediaIsPlaying = false"
              @ended="onTimedMediaEnded"
              @error="failSourceAttempt"
            />

            <button
              v-if="isAudio"
              type="button"
              class="media-audio-artwork media-preview"
              :class="{ 'media-preview--ready': effectivePreviewState === 'ready' }"
              :aria-label="layout === 'reel'
                ? (timedMediaIsPlaying ? 'Pause audio' : 'Play audio')
                : 'Audio'"
              :disabled="layout !== 'reel'"
              @click="onTimedMediaClick"
            >
              <img
                v-if="visibleAudioCover"
                class="media-audio-cover"
                :src="visibleAudioCover.src"
                :width="visibleAudioCover.width ?? undefined"
                :height="visibleAudioCover.height ?? undefined"
                :fetchpriority="fetchPriority"
                alt=""
                decoding="async"
                :loading="imageLoading"
                @load="layout === 'masonry' && markSourceReady($event)"
                @error="onAudioCoverError"
              >
              <span v-else class="media-audio-fallback" aria-hidden="true">
                <Disc3 :size="64" :stroke-width="1.5" />
              </span>
            </button>

            <video
              v-else-if="mediaIsTimed"
              ref="mediaElement"
              :data-source-generation="sourceGeneration"
              class="media-preview"
              :class="{
                'media-preview--ready': effectivePreviewState === 'ready',
                'media-preview--reel-video': layout === 'reel',
              }"
              :src="mediaSrc"
              :width="mediaWidth ?? undefined"
              :height="mediaHeight ?? undefined"
              :autoplay="timedMediaPlaybackAllowed"
              :loop="!advanceOnMediaEnd"
              :muted="effectiveTimedMediaMuted"
              playsinline
              :preload="timedMediaPreload"
              @loadedmetadata="onTimedMediaLoadedMetadata"
              @progress="noteSourceActivity" @loadeddata="noteSourceActivity"
              @canplay="noteSourceActivity"
              @durationchange="syncTimedMediaState"
              @timeupdate="syncTimedMediaState"
              @volumechange="syncTimedMediaState"
              @playing="onTimedMediaPlaying"
              @pause="timedMediaIsPlaying = false"
              @ended="onTimedMediaEnded"
              @click="onTimedMediaClick"
              @error="failSourceAttempt"
            />

            <img
              v-else-if="!isAudio"
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

        <MediaContextOverlay :item="item" :media-card="mediaCard" :media-index="normalizedMediaIndex" :media-item="mediaItem" :media-source="mediaSource ?? 'preview'" />

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
              :current-time="timedMediaCurrentTime"
              :data-control-post-id="usesStationaryReelControls ? item.postId : undefined"
              :duration="timedMediaDuration"
              :layout="layout"
              :media-type="isAudio ? 'audio' : 'video'"
              :muted="timedMediaIsMuted"
              :playing="timedMediaIsPlaying"
              :volume="timedMediaVolume"
              @seek="seekTimedMedia"
              @toggle-mute="toggleTimedMediaMute"
              @toggle-playback="toggleTimedMediaPlayback"
              @volume-change="setTimedMediaVolume"
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
