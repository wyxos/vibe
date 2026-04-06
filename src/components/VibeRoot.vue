<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle, Pause, Play } from 'lucide-vue-next'

import type { VibeRootProps } from './vibe-root/useVibeRoot'
import { useVibeRoot } from './vibe-root/useVibeRoot'
import { getItemIcon, getItemLabel } from './vibe-root/media'
import { getSlideToneClass, getStageToneClass } from './vibe-root/theme'

const props = defineProps<VibeRootProps>()

const emit = defineEmits<{
  'update:activeIndex': [value: number]
}>()

const viewer = useVibeRoot(props, emit)
const {
  activeItem,
  activeMediaDuration,
  activeMediaItem,
  activeMediaProgress,
  activeMediaState,
  canRetryInitialLoad,
  errorMessage,
  formatPlaybackTime,
  getImageSource,
  getSlideStyle,
  hasNextPage,
  isAtEnd,
  isAudio,
  isImageReady,
  isMediaReady,
  isVisual,
  items,
  loading,
  mediaStates,
  onAudioCoverClick,
  onImageLoad,
  onMediaEvent,
  onMediaSeekInput,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onVideoClick,
  onWheel,
  paginationDetail,
  registerAudioElement,
  registerImageElement,
  registerVideoElement,
  renderedItems,
  resolvedActiveIndex,
  retryInitialLoad,
  stageRef,
  statusMessage,
} = viewer

const activeStageToneClass = computed(() => getStageToneClass(activeItem.value?.type ?? 'image'))
const mediaStatusOffsetClass = computed(() =>
  activeMediaItem.value ? 'bottom-[5.8rem] max-[720px]:bottom-[7.4rem]' : 'bottom-[1.8rem] max-[720px]:bottom-[1.3rem]',
)

function getMediaActionLabel(action: 'Play' | 'Pause', item: NonNullable<typeof activeItem.value>) {
  const label = item.title?.trim()

  if (label) {
    return `${action} ${label}`
  }

  return `${action} ${getItemLabel(item.type).toLowerCase()}`
}

function isAssetLoading(index: number, item: (typeof items.value)[number]) {
  if (index !== resolvedActiveIndex.value) {
    return false
  }

  if (item.type === 'image') {
    return !isImageReady(item.id)
  }

  if (item.type === 'video' || item.type === 'audio') {
    return !isMediaReady(item.id)
  }

  return false
}
</script>

<template>
  <section
    ref="stageRef"
    data-testid="vibe-root"
    :data-rendered-count="renderedItems.length"
    class="relative h-full min-h-full touch-none overflow-hidden bg-[#05060a] text-[#f7f1ea]"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @wheel="onWheel"
  >
    <div class="absolute inset-0 transition-[background] duration-200" :class="activeStageToneClass" />

    <button
      v-if="canRetryInitialLoad"
      type="button"
      class="absolute left-5 top-5 z-30 inline-flex items-center border border-rose-400/55 bg-rose-500/18 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white backdrop-blur transition hover:bg-rose-500/28"
      @click="retryInitialLoad"
    >
      Retry
    </button>

    <div
      v-else-if="errorMessage && items.length > 0"
      class="absolute left-5 top-5 z-30 border border-amber-400/45 bg-black/35 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-amber-100 backdrop-blur"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="items.length > 0"
      class="relative z-[1] h-full"
    >
      <article
        v-for="{ item, index } in renderedItems"
        :key="item.id"
        data-testid="vibe-root-slide"
        :data-item-id="item.id"
        :data-index="index"
        :data-active="index === resolvedActiveIndex"
        :aria-hidden="index === resolvedActiveIndex ? 'false' : 'true'"
        class="absolute inset-0 flex h-full min-h-full items-center justify-center will-change-transform"
        :class="index === resolvedActiveIndex ? 'pointer-events-auto' : 'pointer-events-none'"
        :style="getSlideStyle(index)"
      >
        <div class="absolute inset-0 opacity-85" :class="getSlideToneClass(item.type)" />

        <div
          v-if="isVisual(item)"
          class="relative z-[1] flex h-full w-full items-center justify-center overflow-hidden"
        >
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
            :src="getImageSource(item)"
            :alt="item.title ?? ''"
            draggable="false"
            class="block h-auto max-h-full w-auto max-w-full object-contain shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] transition-opacity duration-300"
            :class="isImageReady(item.id) ? 'opacity-100' : 'opacity-0'"
            :ref="(element) => registerImageElement(item.id, element)"
            @load="onImageLoad(item.id)"
            @error="onImageLoad(item.id)"
          />

          <video
            v-else
            class="block h-auto max-h-full w-auto max-w-full cursor-pointer object-contain shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] transition-opacity duration-300"
            :class="isMediaReady(item.id) ? 'opacity-100' : 'opacity-0'"
            playsinline
            muted
            loop
            :preload="index === resolvedActiveIndex ? 'metadata' : 'none'"
            :ref="(element) => registerVideoElement(item.id, element)"
            @click.stop="onVideoClick($event, item.id)"
            @canplay="onMediaEvent(item.id, $event)"
            @durationchange="onMediaEvent(item.id, $event)"
            @error="onMediaEvent(item.id, $event)"
            @loadstart="onMediaEvent(item.id, $event)"
            @loadedmetadata="onMediaEvent(item.id, $event)"
            @pause="onMediaEvent(item.id, $event)"
            @play="onMediaEvent(item.id, $event)"
            @playing="onMediaEvent(item.id, $event)"
            @seeking="onMediaEvent(item.id, $event)"
            @seeked="onMediaEvent(item.id, $event)"
            @stalled="onMediaEvent(item.id, $event)"
            @timeupdate="onMediaEvent(item.id, $event)"
            @waiting="onMediaEvent(item.id, $event)"
          >
            <source :src="item.url" />
          </video>
        </div>

        <div
          v-else-if="isAudio(item)"
          class="relative z-[1] grid w-full max-w-[1100px] justify-items-center gap-6 px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)] text-center"
        >
          <button
            type="button"
            class="relative grid aspect-square w-[clamp(320px,46vw,560px)] max-w-[calc(100vw-2.5rem)] place-items-center border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02)),radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_58%)] text-[#f7f1ea] transition-[border-color,background] duration-200 hover:border-white/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03)),radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_58%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
            :aria-label="(mediaStates[item.id]?.paused ?? true) ? getMediaActionLabel('Play', item) : getMediaActionLabel('Pause', item)"
            @click="onAudioCoverClick($event, item.id)"
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
                :is="(mediaStates[item.id]?.paused ?? true) ? Play : Pause"
                class="h-4 w-4 stroke-2"
                aria-hidden="true"
              />
            </div>
          </button>

          <audio
            :preload="index === resolvedActiveIndex ? 'metadata' : 'none'"
            class="pointer-events-none absolute h-px w-px opacity-0"
            :ref="(element) => registerAudioElement(item.id, element)"
            @canplay="onMediaEvent(item.id, $event)"
            @durationchange="onMediaEvent(item.id, $event)"
            @error="onMediaEvent(item.id, $event)"
            @loadstart="onMediaEvent(item.id, $event)"
            @loadedmetadata="onMediaEvent(item.id, $event)"
            @pause="onMediaEvent(item.id, $event)"
            @play="onMediaEvent(item.id, $event)"
            @playing="onMediaEvent(item.id, $event)"
            @seeking="onMediaEvent(item.id, $event)"
            @seeked="onMediaEvent(item.id, $event)"
            @stalled="onMediaEvent(item.id, $event)"
            @timeupdate="onMediaEvent(item.id, $event)"
            @waiting="onMediaEvent(item.id, $event)"
          >
            <source :src="item.url" />
          </audio>
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

    <div
      v-else
      class="relative z-[1] grid w-full max-w-[1100px] justify-items-center gap-6 px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)] text-center"
    >
      <p class="m-0 text-[0.78rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/68">
        {{ loading ? 'Syncing' : 'Viewer ready' }}
      </p>
      <h2 class="m-0 text-[clamp(2rem,4.4vw,3.6rem)] leading-[0.95] tracking-[-0.05em]">
        {{ loading ? 'Loading the viewer' : 'No items available' }}
      </h2>
      <p class="m-0 text-[clamp(0.98rem,1.3vw,1.12rem)] leading-[1.8] text-[#f7f1ea]/70">
        {{
          loading
            ? 'Pulling the first page from the fake server.'
            : 'Attach items to VibeRoot to turn this screen into the workspace.'
        }}
      </p>
    </div>

    <div
      v-if="activeItem"
      class="pointer-events-none absolute inset-0 z-[3] flex flex-col justify-between p-[clamp(1.25rem,2.6vw,2.25rem)]"
    >
      <div class="grid gap-4">
        <div class="flex min-h-11 items-center justify-between gap-4">
          <div class="min-w-0 flex-1">
            <h2
              v-if="activeItem.title"
              data-testid="vibe-root-title"
              class="m-0 truncate text-left text-[0.82rem] leading-none tracking-[-0.04em] min-[721px]:text-[1.2rem]"
            >
              {{ activeItem.title }}
            </h2>
          </div>
          <span
            data-testid="vibe-root-pagination"
            class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-white/14 bg-black/40 px-3 py-2 text-[0.63rem] font-bold uppercase tracking-[0.12em] text-[#f7f1ea]/72 backdrop-blur-[18px] min-[721px]:gap-3 min-[721px]:px-4 min-[721px]:py-3 min-[721px]:text-[0.74rem] min-[721px]:tracking-[0.2em]"
          >
            <span class="whitespace-nowrap">{{ resolvedActiveIndex + 1 }} / {{ items.length }}</span>
            <span
              v-if="paginationDetail"
              class="whitespace-nowrap border-l border-white/12 pl-2 text-[#f7f1ea]/56 min-[721px]:pl-3"
            >
              {{ paginationDetail }}
            </span>
          </span>
        </div>
      </div>

      <div v-if="isAtEnd && !hasNextPage && !loading" class="grid gap-2 max-[720px]:justify-items-start">
        <span class="inline-flex items-center border border-amber-300/35 bg-black/40 px-4 py-3 text-[0.74rem] font-bold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-[18px]">
          End reached
        </span>
      </div>
    </div>

    <div
      v-if="activeMediaItem"
      data-testid="vibe-root-media-bar"
      class="absolute inset-x-0 bottom-0 z-[5] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.42)_24%,rgba(0,0,0,0.78))] px-[clamp(1rem,2.6vw,2.25rem)] pt-4 pb-[1.15rem]"
    >
      <div class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/12 bg-black/70 backdrop-blur-[18px]">
        <span class="text-[0.76rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74">
          {{ formatPlaybackTime(activeMediaState.currentTime) }}
        </span>

        <div class="relative h-4 w-full">
          <div class="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/12" />
          <div
            class="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-[#f7f1ea]"
            :style="{ width: `${activeMediaProgress}%` }"
          />
          <input
            data-swipe-lock="true"
            type="range"
            aria-label="Seek active media"
            min="0"
            step="0.1"
            :max="activeMediaDuration || 1"
            :value="activeMediaState.currentTime"
            :disabled="activeMediaDuration <= 0"
            class="absolute inset-0 z-10 h-4 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-default disabled:opacity-50 [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[1px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/20 [&::-webkit-slider-thumb]:bg-[#f7f1ea] [&::-moz-range-track]:h-4 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/20 [&::-moz-range-thumb]:bg-[#f7f1ea]"
            @input="onMediaSeekInput"
          />
        </div>

        <span class="text-[0.76rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74">
          {{ formatPlaybackTime(activeMediaDuration) }}
        </span>
      </div>
    </div>

    <div
      v-if="statusMessage"
      class="absolute left-1/2 z-[4] inline-flex w-auto -translate-x-1/2 items-center border border-white/14 bg-black/40 px-5 py-3 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74 backdrop-blur-[18px] max-[720px]:w-[calc(100%-2.5rem)] max-[720px]:justify-center"
      :class="[
        mediaStatusOffsetClass,
        isAtEnd && !hasNextPage && !loading ? 'border-amber-300/35 text-amber-200' : '',
      ]"
    >
      {{ statusMessage }}
    </div>
  </section>
</template>
