<script setup lang="ts">
import { computed } from 'vue'
import { Pause, Play } from 'lucide-vue-next'

import type { VibeRootProps } from './vibe-root/useVibeRoot'
import { useVibeRoot } from './vibe-root/useVibeRoot'
import { getItemIcon, getItemLabel } from './vibe-root/media'
import { getSlideToneClass, getStageToneClass } from './vibe-root/theme'

const props = withDefaults(defineProps<VibeRootProps>(), {
  activeIndex: 0,
  loading: false,
  hasNextPage: false,
})

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
  formatDate,
  formatFileSize,
  formatPlaybackTime,
  getImageSource,
  isAtEnd,
  isAudio,
  isVisual,
  mediaStates,
  onAudioCoverClick,
  onMediaEvent,
  onMediaSeekInput,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onVideoClick,
  onWheel,
  registerAudioElement,
  registerVideoElement,
  resolvedActiveIndex,
  stageRef,
  statusMessage,
  toggleActiveMediaPlayback,
  trackStyle,
} = viewer

const activeStageToneClass = computed(() => getStageToneClass(activeItem.value?.type ?? 'image'))
const mediaStatusOffsetClass = computed(() =>
  activeMediaItem.value ? 'bottom-[5.8rem] max-[720px]:bottom-[7.4rem]' : 'bottom-[1.8rem] max-[720px]:bottom-[1.3rem]',
)
</script>

<template>
  <section
    ref="stageRef"
    class="relative h-full min-h-[100svh] touch-none overflow-hidden bg-[#05060a] text-[#f7f1ea]"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @wheel="onWheel"
  >
    <div class="absolute inset-0 transition-[background] duration-200" :class="activeStageToneClass" />

    <div
      v-if="props.items.length > 0"
      class="relative z-[1] h-full will-change-transform"
      :style="trackStyle"
    >
      <article
        v-for="(item, index) in props.items"
        :key="item.id"
        class="relative flex min-h-[100svh] items-center justify-center"
      >
        <div class="absolute inset-0 opacity-85" :class="getSlideToneClass(item.type)" />

        <div
          v-if="isVisual(item)"
          class="relative z-[1] flex h-[100svh] w-full items-center justify-center overflow-hidden"
        >
          <img
            v-if="item.type === 'image'"
            :src="getImageSource(item)"
            :alt="item.title"
            draggable="false"
            class="block h-auto max-h-full w-auto max-w-full object-contain shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]"
          />

          <video
            v-else
            class="block h-auto max-h-full w-auto max-w-full cursor-pointer object-contain shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]"
            playsinline
            muted
            loop
            preload="metadata"
            :ref="(element) => registerVideoElement(item.id, element)"
            @click.stop="onVideoClick($event, item.id)"
            @durationchange="onMediaEvent(item.id, $event)"
            @loadedmetadata="onMediaEvent(item.id, $event)"
            @pause="onMediaEvent(item.id, $event)"
            @play="onMediaEvent(item.id, $event)"
            @timeupdate="onMediaEvent(item.id, $event)"
          >
            <source :src="item.original.url" :type="item.original.mimeType || item.mimeType" />
          </video>
        </div>

        <div
          v-else-if="isAudio(item)"
          class="relative z-[1] grid w-full max-w-[1100px] justify-items-center gap-6 px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)] text-center"
        >
          <button
            type="button"
            class="relative grid aspect-square w-[clamp(320px,46vw,560px)] max-w-[calc(100vw-2.5rem)] place-items-center border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02)),radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_58%)] text-[#f7f1ea] transition-[border-color,background] duration-200 hover:border-white/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03)),radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_58%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
            :aria-label="(mediaStates[item.id]?.paused ?? true) ? `Play ${item.title}` : `Pause ${item.title}`"
            @click="onAudioCoverClick($event, item.id)"
          >
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
            preload="metadata"
            class="pointer-events-none absolute h-px w-px opacity-0"
            :ref="(element) => registerAudioElement(item.id, element)"
            @durationchange="onMediaEvent(item.id, $event)"
            @loadedmetadata="onMediaEvent(item.id, $event)"
            @pause="onMediaEvent(item.id, $event)"
            @play="onMediaEvent(item.id, $event)"
            @timeupdate="onMediaEvent(item.id, $event)"
          >
            <source :src="item.original.url" :type="item.original.mimeType || item.mimeType" />
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
        {{ props.loading ? 'Syncing' : 'Viewer ready' }}
      </p>
      <h2 class="m-0 text-[clamp(2rem,4.4vw,3.6rem)] leading-[0.95] tracking-[-0.05em]">
        {{ props.loading ? 'Loading the viewer' : 'No items available' }}
      </h2>
      <p class="m-0 text-[clamp(0.98rem,1.3vw,1.12rem)] leading-[1.8] text-[#f7f1ea]/70">
        {{
          props.loading
            ? 'Pulling the first page from the fake server.'
            : 'Attach items to VibeRoot to turn this screen into the workspace.'
        }}
      </p>
    </div>

    <div
      v-if="activeItem"
      class="pointer-events-none absolute inset-0 z-[3] flex flex-col justify-between p-[clamp(1.25rem,2.6vw,2.25rem)]"
    >
      <div class="flex items-start justify-between gap-4 max-[720px]:flex-col">
        <span class="inline-flex items-center gap-2 border border-white/14 bg-black/40 px-4 py-3 text-[0.74rem] font-bold uppercase tracking-[0.2em] text-[#f7f1ea]/72 backdrop-blur-[18px]">
          <component :is="getItemIcon(activeItem.type)" class="h-3.5 w-3.5 stroke-2" aria-hidden="true" />
          {{ getItemLabel(activeItem.type) }}
        </span>
        <span class="inline-flex items-center border border-white/14 bg-black/40 px-4 py-3 text-[0.74rem] font-bold uppercase tracking-[0.2em] text-[#f7f1ea]/72 backdrop-blur-[18px]">
          {{ resolvedActiveIndex + 1 }} / {{ props.items.length }}
        </span>
      </div>

      <div class="flex items-end justify-between gap-4 max-[720px]:flex-col max-[720px]:items-start">
        <div class="max-w-[34rem]">
          <h2 class="m-0 text-[clamp(1.2rem,2.4vw,1.9rem)] leading-none tracking-[-0.05em]">
            {{ activeItem.title }}
          </h2>
          <p class="mt-3 m-0 text-[0.95rem] leading-[1.7] text-[#f7f1ea]/70">
            {{ formatDate(activeItem.createdAt) }} ·
            {{ activeItem.extension.toUpperCase() }} ·
            {{ formatFileSize(activeItem.sizeBytes) }}
          </p>
        </div>

        <div v-if="isAtEnd && !props.hasNextPage && !props.loading" class="grid gap-2 max-[720px]:justify-items-start">
          <span class="inline-flex items-center border border-amber-300/35 bg-black/40 px-4 py-3 text-[0.74rem] font-bold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-[18px]">
            End reached
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="activeMediaItem"
      class="absolute inset-x-0 bottom-0 z-[5] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.42)_24%,rgba(0,0,0,0.78))] px-[clamp(1rem,2.6vw,2.25rem)] pt-4 pb-[1.15rem]"
    >
      <div class="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/12 bg-black/70 backdrop-blur-[18px]">
        <button
          type="button"
          data-swipe-lock="true"
          class="inline-flex h-11 w-11 items-center justify-center border border-white/16 bg-white/6 text-[#f7f1ea] transition-[background,border-color] duration-200 hover:border-white/30 hover:bg-white/12"
          :aria-label="activeMediaState.paused ? 'Play active media' : 'Pause active media'"
          @click="toggleActiveMediaPlayback"
        >
          <component :is="activeMediaState.paused ? Play : Pause" class="h-4 w-4 stroke-2" aria-hidden="true" />
        </button>

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
        isAtEnd && !props.hasNextPage && !props.loading ? 'border-amber-300/35 text-amber-200' : '',
      ]"
    >
      {{ statusMessage }}
    </div>
  </section>
</template>
