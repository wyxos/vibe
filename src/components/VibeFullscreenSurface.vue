<script setup lang="ts">
import { computed, toRef } from 'vue'
import { ArrowLeft, LoaderCircle, Pause, Play } from 'lucide-vue-next'

import type { VibeRootControlledProps } from './vibe-root/useVibeRoot'
import { useVibeRoot } from './vibe-root/useVibeRoot'
import { getItemIcon, getItemLabel } from './vibe-root/media'
import { getSlideToneClass, getStageToneClass } from './vibe-root/theme'

const props = withDefaults(defineProps<VibeRootControlledProps & {
  active?: boolean
  showBackToList?: boolean
}>(), {
  active: true,
  activeIndex: 0,
  hasNextPage: false,
  loading: false,
  paginationDetail: null,
  showBackToList: false,
})

const emit = defineEmits<{
  'back-to-list': []
  'update:activeIndex': [value: number]
}>()

const viewer = useVibeRoot(
  props,
  (_event, value) => {
    emit('update:activeIndex', value)
  },
  {
    enabled: toRef(props, 'active'),
  },
)

const activeStageToneClass = computed(() => getStageToneClass(viewer.activeItem.value?.type ?? 'image'))
const mediaStatusOffsetClass = computed(() =>
  viewer.activeMediaItem.value ? 'bottom-[5.8rem] max-[720px]:bottom-[7.4rem]' : 'bottom-[1.8rem] max-[720px]:bottom-[1.3rem]',
)

function getMediaActionLabel(action: 'Play' | 'Pause', item: NonNullable<typeof viewer.activeItem.value>) {
  const label = item.title?.trim()

  if (label) {
    return `${action} ${label}`
  }

  return `${action} ${getItemLabel(item.type).toLowerCase()}`
}

function isAssetLoading(index: number, item: (typeof props.items)[number]) {
  if (!shouldLoadSlideAsset(index)) {
    return false
  }

  if (index !== viewer.resolvedActiveIndex.value) {
    return false
  }

  if (item.type === 'image') {
    return !viewer.isImageReady(item.id)
  }

  if (item.type === 'video' || item.type === 'audio') {
    return !viewer.isMediaReady(item.id)
  }

  return false
}

function shouldLoadSlideAsset(index: number) {
  return props.active && index === viewer.resolvedActiveIndex.value
}

function getFullscreenImageSource(index: number, item: (typeof props.items)[number]) {
  if (!shouldLoadSlideAsset(index)) {
    return undefined
  }

  return viewer.getImageSource(item)
}

function getFullscreenMediaSource(index: number, item: (typeof props.items)[number]) {
  if (!shouldLoadSlideAsset(index)) {
    return undefined
  }

  return item.url
}
</script>

<template>
  <div
    ref="viewer.stageRef"
    class="relative h-full min-h-0 touch-none overflow-hidden bg-[#05060a] text-[#f7f1ea]"
    @pointerdown="viewer.onPointerDown"
    @pointermove="viewer.onPointerMove"
    @pointerup="viewer.onPointerUp"
    @pointercancel="viewer.onPointerCancel"
    @wheel="viewer.onWheel"
  >
    <div class="absolute inset-0 transition-[background] duration-200" :class="activeStageToneClass" />

    <div v-if="viewer.items.value.length > 0" class="relative z-[1] h-full min-h-0">
      <article
        v-for="{ item, index } in viewer.renderedItems.value"
        :key="item.id"
        data-testid="vibe-root-slide"
        :data-item-id="item.id"
        :data-index="index"
        :data-active="index === viewer.resolvedActiveIndex.value"
        :aria-hidden="index === viewer.resolvedActiveIndex.value ? 'false' : 'true'"
        class="absolute inset-0 flex h-full min-h-full items-center justify-center will-change-transform"
        :class="index === viewer.resolvedActiveIndex.value ? 'pointer-events-auto' : 'pointer-events-none'"
        :style="viewer.getSlideStyle(index)"
      >
        <div class="absolute inset-0 opacity-85" :class="getSlideToneClass(item.type)" />

        <div v-if="viewer.isVisual(item)" class="relative z-[1] flex h-full w-full items-center justify-center overflow-hidden">
          <div
            v-if="isAssetLoading(index, item)"
            data-testid="vibe-root-asset-spinner"
            class="pointer-events-none absolute inset-0 z-[2] grid place-items-center"
          >
            <span class="inline-flex h-12 w-12 items-center justify-center border border-white/14 bg-black/55 backdrop-blur-[18px]">
              <LoaderCircle class="h-5 w-5 animate-spin stroke-[1.9] text-[#f7f1ea]/78" aria-hidden="true" />
            </span>
          </div>

          <img
            v-if="item.type === 'image'"
            :src="getFullscreenImageSource(index, item)"
            :alt="item.title ?? ''"
            draggable="false"
            class="block h-auto max-h-full w-auto max-w-full object-contain shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] transition-opacity duration-300"
            :class="viewer.isImageReady(item.id) ? 'opacity-100' : 'opacity-0'"
            :ref="(element) => viewer.registerImageElement(item.id, element)"
            @load="viewer.onImageLoad(item.id)"
            @error="viewer.onImageLoad(item.id)"
          />

          <video
            v-else
            class="block h-auto max-h-full w-auto max-w-full cursor-pointer object-contain shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] transition-opacity duration-300"
            :class="viewer.isMediaReady(item.id) ? 'opacity-100' : 'opacity-0'"
            playsinline
            muted
            :src="getFullscreenMediaSource(index, item)"
            :preload="shouldLoadSlideAsset(index) ? 'metadata' : 'none'"
            :ref="(element) => viewer.registerVideoElement(item.id, element)"
            @click.stop="viewer.onVideoClick($event, item.id)"
            @canplay="viewer.onMediaEvent(item.id, $event)"
            @durationchange="viewer.onMediaEvent(item.id, $event)"
            @error="viewer.onMediaEvent(item.id, $event)"
            @loadstart="viewer.onMediaEvent(item.id, $event)"
            @loadedmetadata="viewer.onMediaEvent(item.id, $event)"
            @pause="viewer.onMediaEvent(item.id, $event)"
            @play="viewer.onMediaEvent(item.id, $event)"
            @playing="viewer.onMediaEvent(item.id, $event)"
            @seeking="viewer.onMediaEvent(item.id, $event)"
            @seeked="viewer.onMediaEvent(item.id, $event)"
            @stalled="viewer.onMediaEvent(item.id, $event)"
            @timeupdate="viewer.onMediaEvent(item.id, $event)"
            @waiting="viewer.onMediaEvent(item.id, $event)"
          />
        </div>

        <div
          v-else-if="viewer.isAudio(item)"
          class="relative z-[1] grid w-full max-w-[1100px] justify-items-center gap-6 px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)] text-center"
        >
          <button
            type="button"
            class="relative grid aspect-square w-[clamp(320px,46vw,560px)] max-w-[calc(100vw-2.5rem)] place-items-center border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02)),radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_58%)] text-[#f7f1ea] transition-[border-color,background] duration-200 hover:border-white/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03)),radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_58%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
            :aria-label="(viewer.mediaStates.value[item.id]?.paused ?? true) ? getMediaActionLabel('Play', item) : getMediaActionLabel('Pause', item)"
            @click="viewer.onAudioCoverClick($event, item.id)"
          >
            <div
              v-if="isAssetLoading(index, item)"
              data-testid="vibe-root-asset-spinner"
              class="pointer-events-none absolute inset-0 z-[3] grid place-items-center"
            >
              <span class="inline-flex h-12 w-12 items-center justify-center border border-white/14 bg-black/55 backdrop-blur-[18px]">
                <LoaderCircle class="h-5 w-5 animate-spin stroke-[1.9] text-[#f7f1ea]/78" aria-hidden="true" />
              </span>
            </div>

            <div class="pointer-events-none absolute inset-0 border border-white/8 bg-[radial-gradient(circle,rgba(16,185,129,0.16),transparent_66%)]" />
            <div class="pointer-events-none absolute h-[clamp(220px,30vw,360px)] w-[clamp(220px,30vw,360px)] border border-white/8 bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_62%)]" />

            <div class="relative z-[1] inline-flex min-h-[4.25rem] min-w-[4.25rem] items-center justify-center border border-white/18 bg-emerald-500/12 p-4 backdrop-blur-[20px]">
              <component :is="getItemIcon(item.type)" class="h-6 w-6 stroke-[1.9]" aria-hidden="true" />
            </div>

            <div class="pointer-events-none absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center border border-white/14 bg-black/50 backdrop-blur-[18px]">
              <component
                :is="(viewer.mediaStates.value[item.id]?.paused ?? true) ? Play : Pause"
                class="h-4 w-4 stroke-2"
                aria-hidden="true"
              />
            </div>
          </button>

          <audio
            :src="getFullscreenMediaSource(index, item)"
            :preload="shouldLoadSlideAsset(index) ? 'metadata' : 'none'"
            class="pointer-events-none absolute h-px w-px opacity-0"
            :ref="(element) => viewer.registerAudioElement(item.id, element)"
            @canplay="viewer.onMediaEvent(item.id, $event)"
            @durationchange="viewer.onMediaEvent(item.id, $event)"
            @error="viewer.onMediaEvent(item.id, $event)"
            @loadstart="viewer.onMediaEvent(item.id, $event)"
            @loadedmetadata="viewer.onMediaEvent(item.id, $event)"
            @pause="viewer.onMediaEvent(item.id, $event)"
            @play="viewer.onMediaEvent(item.id, $event)"
            @playing="viewer.onMediaEvent(item.id, $event)"
            @seeking="viewer.onMediaEvent(item.id, $event)"
            @seeked="viewer.onMediaEvent(item.id, $event)"
            @stalled="viewer.onMediaEvent(item.id, $event)"
            @timeupdate="viewer.onMediaEvent(item.id, $event)"
            @waiting="viewer.onMediaEvent(item.id, $event)"
          />
        </div>

        <div
          v-else
          class="relative z-[1] grid w-full max-w-[1100px] justify-items-center gap-6 px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)] text-center"
        >
          <div class="inline-flex min-h-[4.25rem] min-w-[4.25rem] items-center justify-center border border-white/18 bg-white/8 p-4 backdrop-blur-[20px]">
            <component :is="getItemIcon(item.type)" class="h-6 w-6 stroke-[1.9]" aria-hidden="true" />
          </div>
        </div>
      </article>
    </div>

    <div v-if="viewer.activeItem.value" class="pointer-events-none absolute inset-0 z-[3] flex flex-col justify-between p-[clamp(1.25rem,2.6vw,2.25rem)]">
      <div class="grid gap-4">
        <div class="flex min-h-11 items-center justify-between gap-4">
          <div class="min-w-0 flex flex-1 items-center gap-3">
            <button
              v-if="props.showBackToList"
              type="button"
              data-testid="vibe-root-back-to-list"
              class="pointer-events-auto inline-flex h-11 w-11 shrink-0 items-center justify-center border border-white/14 bg-black/40 text-[#f7f1ea]/78 backdrop-blur-[18px] transition hover:border-white/28 hover:bg-black/55"
              aria-label="Back to list"
              @click="emit('back-to-list')"
            >
              <ArrowLeft class="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
            </button>

            <h2
              v-if="viewer.activeItem.value.title"
              data-testid="vibe-root-title"
              class="m-0 truncate text-left text-[0.82rem] leading-none tracking-[-0.04em] min-[721px]:text-[1.2rem]"
            >
              {{ viewer.activeItem.value.title }}
            </h2>
          </div>

          <span
            data-testid="vibe-root-pagination"
            class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-white/14 bg-black/40 px-3 py-2 text-[0.63rem] font-bold uppercase tracking-[0.12em] text-[#f7f1ea]/72 backdrop-blur-[18px] min-[721px]:gap-3 min-[721px]:px-4 min-[721px]:py-3 min-[721px]:text-[0.74rem] min-[721px]:tracking-[0.2em]"
          >
            <span class="whitespace-nowrap">{{ viewer.resolvedActiveIndex.value + 1 }} / {{ viewer.items.value.length }}</span>
            <span
              v-if="viewer.paginationDetail.value"
              class="whitespace-nowrap border-l border-white/12 pl-2 text-[#f7f1ea]/56 min-[721px]:pl-3"
            >
              {{ viewer.paginationDetail.value }}
            </span>
          </span>
        </div>
      </div>

      <div v-if="viewer.isAtEnd.value && !viewer.hasNextPage.value && !viewer.loading.value" class="grid gap-2 max-[720px]:justify-items-start">
        <span class="inline-flex items-center border border-amber-300/35 bg-black/40 px-4 py-3 text-[0.74rem] font-bold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-[18px]">
          End reached
        </span>
      </div>
    </div>

    <div
      v-if="viewer.activeMediaItem.value"
      data-testid="vibe-root-media-bar"
      class="absolute inset-x-0 bottom-0 z-[5] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.42)_24%,rgba(0,0,0,0.78))] px-[clamp(1rem,2.6vw,2.25rem)] pt-4 pb-[1.15rem]"
    >
      <div class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/12 bg-black/70 backdrop-blur-[18px]">
        <span class="text-[0.76rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74">
          {{ viewer.formatPlaybackTime(viewer.activeMediaState.value.currentTime) }}
        </span>

        <div class="relative h-4 w-full">
          <div class="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/12" />
          <div
            class="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-[#f7f1ea]"
            :style="{ width: `${viewer.activeMediaProgress.value}%` }"
          />
          <input
            data-swipe-lock="true"
            type="range"
            aria-label="Seek active media"
            min="0"
            step="0.1"
            :max="viewer.activeMediaDuration.value || 1"
            :value="viewer.activeMediaState.value.currentTime"
            :disabled="viewer.activeMediaDuration.value <= 0"
            class="absolute inset-0 z-10 h-4 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-default disabled:opacity-50 [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[1px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/20 [&::-webkit-slider-thumb]:bg-[#f7f1ea] [&::-moz-range-track]:h-4 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/20 [&::-moz-range-thumb]:bg-[#f7f1ea]"
            @input="viewer.onMediaSeekInput"
          />
        </div>

        <span class="text-[0.76rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74">
          {{ viewer.formatPlaybackTime(viewer.activeMediaDuration.value) }}
        </span>
      </div>
    </div>

    <div
      v-if="viewer.statusMessage.value"
      class="absolute left-1/2 z-[4] inline-flex w-auto -translate-x-1/2 items-center border border-white/14 bg-black/40 px-5 py-3 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74 backdrop-blur-[18px] max-[720px]:w-[calc(100%-2.5rem)] max-[720px]:justify-center"
      :class="[
        mediaStatusOffsetClass,
        viewer.isAtEnd.value && !viewer.hasNextPage.value && !viewer.loading.value ? 'border-amber-300/35 text-amber-200' : '',
      ]"
    >
      {{ viewer.statusMessage.value }}
    </div>
  </div>
</template>
