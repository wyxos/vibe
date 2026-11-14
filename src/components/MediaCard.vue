<script setup lang="ts">
import { ChevronLeft, ChevronRight, Disc3 } from 'lucide-vue-next'
import { computed, nextTick, shallowRef, watch, type CSSProperties } from 'vue'
import SelectionCardControls from './SelectionCardControls.vue'
import { useSelectionContext } from './useSelectionContext'
import {
  audioCoverVariant,
  clampMediaIndex,
  mediaAssetAt,
  mediaAssets,
  mediaPlaybackVariantForSource,
  mediaVariantForSource,
} from '../core/mediaAsset'
import type { MediaFailure } from '../core/mediaFailure'
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
import MediaControlsLayer from './MediaControlsLayer.vue'
import MediaContextOverlay from './MediaContextOverlay.vue'
import { useMediaCarouselNavigation } from './useMediaCarouselNavigation'
import { useVisiblePostPreload } from './useVisiblePostPreload'
import { useMediaLoading } from './useMediaLoading'
import { useMediaReadiness } from './useMediaReadiness'
import { useTimedMediaCard } from './useTimedMediaCard'
import { useCardVideoMotion } from './useCardVideoMotion'
import { useReelControlsVisibility } from './useReelControlsVisibility'
import { useReelFullscreenGesture } from './useReelPlaybackOptions'
import { useReelZoom } from './useReelZoom'
const props = defineProps<{
  active?: boolean
  advanceOnMediaEnd?: boolean
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
  deferMedia?: boolean
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
  preparing?: boolean
  previewState: MediaPreviewState
  reelControlsTarget?: HTMLElement | null
  reelAudioState?: VibeReelAudioState
  scrolling?: boolean
  autoScrolling?: boolean
  stationaryReelControls?: boolean
  total: number | null
}>()
const emit = defineEmits<{
  activate: [input: 'keyboard' | 'pointer']
  ended: [mediaIndex: number]
  error: [mediaIndex: number]
  mediaError: [failure: MediaFailure]
  mediaChange: [mediaIndex: number]
  ready: [mediaIndex: number]
  reelAudioChange: [state: VibeReelAudioState]
}>()
const selection = useSelectionContext()
function activate(
  interactive = false,
  input: 'keyboard' | 'pointer' = 'pointer',
): void {
  if (interactive && props.layout === 'masonry' && selection?.controller.enabled && selection.controller.state.mode !== 'browse') {
    if (!selection.controller.state.busy) selection.controller.toggle(props.item.postId)
    return
  }
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
const audioCoverIdentity = computed(() => `${props.item.postId}:${normalizedMediaIndex.value}:${audioCover.value?.src ?? ''}`)
const sourceIdentity = computed<string | null>((previous) => {
  const identity = JSON.stringify([audioCoverIdentity.value, props.mediaSource ?? 'preview', mediaSrc.value, mediaType.value])
  return !props.deferMedia || previous === identity ? identity : null
})
const audioCoverFailed = shallowRef(false)
const visibleAudioCover = computed(() => audioCoverFailed.value ? null : audioCover.value)
const { effectivePreviewState, failSourceAttempt, imageElement, markSourceReady,
  noteSourceActivity, retrySource, retrying, sourceGeneration, mediaElement }
  = useMediaReadiness({
  identity: () => sourceIdentity.value,
  mediaIndex: () => normalizedMediaIndex.value,
  onError: (mediaIndex, confirmedFailure) => {
    emit('error', mediaIndex)
    if (!confirmedFailure) return
    const requested = props.mediaSource ?? 'preview'
    const source = requested === 'preview' && !isAudio.value && mediaItem.value.preview
      ? 'preview' : requested === 'mobile' && mediaSrc.value === mediaItem.value.mobile?.src
        ? 'mobile' : 'original'
    emit('mediaError', { mediaIndex, source, src: mediaSrc.value })
  },
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
const { blocked: videoMotionBlocked, element: cardElement } = useCardVideoMotion({
  enabled: () => props.mediaCard?.pauseVideoDuringTransitions === true && props.layout === 'masonry' && mediaType.value === 'video',
  entering: () => props.entering, preparing: () => props.preparing === true, leaving: () => props.leaving === true,
  identity: () => `${props.item.postId}:${normalizedMediaIndex.value}:${mediaSrc.value}`,
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
  playbackRate: timedMediaPlaybackRate,
  setPlaybackRate,
} = useTimedMediaCard({
  active: () => props.active,
  inViewport: () => props.inViewport === true && !videoMotionBlocked.value,
  layout: () => props.layout,
  mediaCard: () => props.mediaCard,
  mediaElement,
  onAudioChange: (state) => emit('reelAudioChange', state),
  onEnded: () => emit('ended', normalizedMediaIndex.value),
  onReady: markSourceReady,
  reelAudioState: () => props.reelAudioState,
})
const usesSeparateActivator = computed(() => (
  props.interactive && Boolean(props.cardHeader || props.cardFooter || selection)
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
const { imageLoading, mediaIsTimed, timedMediaPreload } = useMediaLoading({ active: () => props.active, fetchPriority: () => props.fetchPriority, layout: () => props.layout, mediaSource: () => mediaSrc.value, mediaType: () => mediaType.value, mediaElement, playbackAllowed: () => timedMediaPlaybackAllowed.value, preparing: () => props.preparing === true, scrolling: () => props.scrolling === true })
const usesStationaryReelControls = computed(() => props.layout === 'reel'
  && props.stationaryReelControls === true)
const mediaControlsVisible = computed(() => (
  !props.preparing && (mediaIsTimed.value || (usesStationaryReelControls.value && mediaType.value === 'image'))
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
const controlsActivity = useReelControlsVisibility()
const controlsContext = computed(() => ({
  item: props.item, mediaIndex: normalizedMediaIndex.value, mediaItem: mediaItem.value,
  mediaSource: props.mediaSource ?? 'preview',
}))
const controlsHidden = computed(() => props.layout === 'reel' && controlsActivity.hidden.value
  && (!mediaIsTimed.value || timedMediaIsPlaying.value))
function revealTimedControls(event?: PointerEvent) {
  if (event && !controlsActivity.pointerMoved(event)) return
  if (props.layout === 'reel' && props.active) controlsActivity.reveal()
}
const activeReel = () => props.layout === 'reel' && props.active === true
const zoom = useReelZoom(() => activeReel() && effectivePreviewState.value === 'ready', () => mediaControlsKey.value, {
  onWheel: onMediaWheel, onTouchStart: onMediaTouchStart, onTouchEnd: onMediaTouchEnd,
})
const reelClick = useReelFullscreenGesture(() => {
  const wasHidden = controlsHidden.value
  revealTimedControls()
  if (!wasHidden && mediaIsTimed.value) void toggleTimedMediaPlayback()
}, () => mediaControlsKey.value, activeReel)
function onReelMediaClick(event: MouseEvent) {
  if (activeReel()) reelClick(event, mediaIsTimed.value)
}
function onAudioCoverError(event: Event): void {
  const target = event.currentTarget as HTMLImageElement
  if (target.dataset.coverIdentity !== audioCoverIdentity.value || audioCoverFailed.value) return
  emit('mediaError', { mediaIndex: normalizedMediaIndex.value, source: 'preview', src: audioCover.value?.src ?? '' })
  audioCoverFailed.value = true
  if (props.layout === 'masonry') markSourceReady()
}
watch(audioCoverIdentity, () => {
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
  <article ref="cardElement"
    :data-post-id="item.postId"
    :data-media-index="normalizedMediaIndex"
    class="media-card"
    :class="{
      'media-card--preparing': preparing,
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
    :aria-hidden="leaving || preparing || undefined"
    :aria-busy="effectivePreviewState === 'loading' || retrying"
    :inert="leaving || preparing || undefined"
    :role="interactive && !leaving && !usesSeparateActivator ? 'button' : undefined"
    :tabindex="interactive && !leaving && !usesSeparateActivator ? 0 : undefined"
    @click="activate(interactive && !usesSeparateActivator, activationInput($event))"
    @keydown.enter="activate(interactive && !usesSeparateActivator, 'keyboard')"
    @keydown.space.prevent="activate(interactive && !usesSeparateActivator, 'keyboard')"
  >
    <SelectionCardControls v-if="selection && layout === 'masonry' && !preparing" :post-id="item.postId" :header-height="cardHeader?.height" />
    <div class="media-card-content">
      <CardRegion
        v-if="cardHeader"
        :index="index" :item="item"
        :layout="layout"
        :loaded-count="loadedCount"
        :media-index="normalizedMediaIndex"
        :media-source="mediaSource"
        placement="header" :scrolling="scrolling" :auto-scrolling="autoScrolling"
        :region="cardHeader"
        :style="mediaCard?.header"
        :total="total"
      />
      <div
        class="media-card-media"
        :class="{ 'media-card-media--carousel': layout === 'reel' && mediaItems.length > 1 }"
        :data-media-direction="mediaDirection" :data-zoomed="zoom.zoomed.value || undefined" :style="zoom.style.value"
        @pointermove="revealTimedControls"
        v-on="activeReel() ? zoom.listeners : { wheel: onMediaWheel }" @click.capture="zoom.guardClick" :tabindex="zoom.zoomed.value ? -1 : undefined"
      >
        <Transition
          :css="!retrying"
          :name="`media-slide-${mediaDirection}`"
        >
          <div
            :key="normalizedMediaIndex"
            class="media-card-frame"
            :data-media-index="normalizedMediaIndex"
          >
            <div
              v-if="sourceIdentity && effectivePreviewState === 'loading'"
              data-test="media-loading"
              class="media-loading"
              aria-hidden="true"
            >
              <span class="media-loading-shimmer" />
            </div>

            <MediaError
              v-else-if="sourceIdentity && effectivePreviewState === 'error'"
              :component="mediaCard?.error?.component"
              :label="mediaErrorLabel(mediaSrc)"
              :retrying="retrying"
              :status="mediaErrorStatus(mediaSrc)"
              @retry="retrySource"
            />

            <audio
              v-if="isAudio && layout === 'reel'"
              :key="`audio:${sourceGeneration}`" ref="mediaElement"
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
              @click="onReelMediaClick"
            >
              <img
                v-if="visibleAudioCover && sourceIdentity"
                :key="`${audioCoverIdentity}:${sourceGeneration}`"
                :data-cover-identity="audioCoverIdentity"
                :data-source-generation="sourceGeneration"
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
              v-else-if="mediaIsTimed && sourceIdentity"
              :key="`video:${sourceGeneration}`" ref="mediaElement"
              :data-source-generation="sourceGeneration"
              class="media-preview"
              :class="{
                'media-preview--ready': !preparing && effectivePreviewState === 'ready',
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
              @click="onReelMediaClick"
              @error="failSourceAttempt"
            />

            <img
              v-else-if="!isAudio && sourceIdentity"
              :key="`image:${sourceGeneration}`" ref="imageElement"
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
              @click="onReelMediaClick"
              @load="markSourceReady"
              @error="failSourceAttempt"
            >
          </div>
        </Transition>
        <MediaContextOverlay :item="item" :media-card="mediaCard" :media-index="normalizedMediaIndex" :media-item="mediaItem" :media-source="mediaSource ?? 'preview'" />
        <button v-if="zoom.zoomed.value" type="button" class="vibe-media-fit" aria-label="Fit media" @click.stop="zoom.fit">Fit</button>

        <MediaControlsLayer
          :visible="mediaControlsVisible" :identity="mediaControlsKey" :options="mediaCard?.controls"
          :context="controlsContext"
          :stationary="usesStationaryReelControls" :target="reelControlsTarget" :post-id="item.postId"
          :current-time="timedMediaCurrentTime" :duration="timedMediaDuration" :layout="layout"
          :media-type="isAudio ? 'audio' : mediaIsTimed ? 'video' : 'image'" :muted="timedMediaIsMuted"
          :playing="timedMediaIsPlaying" :playback-rate="timedMediaPlaybackRate" :volume="timedMediaVolume"
          @playback-rate-change="setPlaybackRate" @seek="seekTimedMedia"
          @toggle-mute="toggleTimedMediaMute" @toggle-playback="toggleTimedMediaPlayback"
          @volume-change="setTimedMediaVolume"
        />

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
          :aria-label="selection?.controller.enabled && selection.controller.state.mode !== 'browse' ? `Toggle selection for post ${item.postId}` : `Open post ${item.postId}`"
          @click.stop="activate(true, activationInput($event))"
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
        placement="footer" :scrolling="scrolling" :auto-scrolling="autoScrolling"
        :region="cardFooter"
        :style="mediaCard?.footer"
        :total="total"
      />
    </div>
  </article>
</template>
