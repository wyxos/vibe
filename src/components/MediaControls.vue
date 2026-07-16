<script setup lang="ts">
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-vue-next'
import { computed, type CSSProperties } from 'vue'

import type { VibeLayout } from '../types'

const props = defineProps<{
  currentTime: number
  duration: number
  layout: VibeLayout
  muted: boolean
  playing: boolean
  volume: number
}>()

const emit = defineEmits<{
  seek: [time: number]
  toggleMute: []
  togglePlayback: []
  volumeChange: [volume: number]
}>()

function bounded(value: number, maximum = 1): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(maximum, Math.max(0, value))
}

function formatTime(value: number): string {
  const seconds = Math.floor(bounded(value, Number.MAX_SAFE_INTEGER))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function inputValue(event: Event): number {
  return Number((event.target as HTMLInputElement).value)
}

const safeDuration = computed(() => Math.max(0, props.duration))
const safeCurrentTime = computed(() => bounded(props.currentTime, safeDuration.value))
const seekStyle = computed<CSSProperties>(() => ({
  '--media-range-progress': `${safeDuration.value > 0
    ? (safeCurrentTime.value / safeDuration.value) * 100
    : 0}%`,
}))
const volumeStyle = computed<CSSProperties>(() => ({
  '--media-range-progress': `${bounded(props.volume) * 100}%`,
}))
</script>

<template>
  <div
    class="media-controls"
    :class="`media-controls--${layout}`"
    aria-label="Video controls"
    @click.stop
    @dblclick.stop
    @keydown.stop
    @wheel.stop
  >
    <input
      class="media-control-range media-control-seek"
      type="range"
      min="0"
      :max="safeDuration || 0"
      step="0.1"
      :value="safeCurrentTime"
      :style="seekStyle"
      aria-label="Seek video"
      :aria-valuetext="`${formatTime(safeCurrentTime)} of ${formatTime(safeDuration)}`"
      :disabled="safeDuration <= 0"
      @input="emit('seek', inputValue($event))"
    >

    <div v-if="layout === 'reel'" class="media-controls-row">
      <button
        type="button"
        class="media-control-button media-control-playback"
        :aria-label="playing ? 'Pause video' : 'Play video'"
        :title="playing ? 'Pause' : 'Play'"
        @click="emit('togglePlayback')"
      >
        <Pause v-if="playing" :size="18" fill="currentColor" />
        <Play v-else :size="18" fill="currentColor" />
      </button>

      <output class="media-control-time" aria-live="off">
        {{ formatTime(safeCurrentTime) }} / {{ formatTime(safeDuration) }}
      </output>

      <div class="media-controls-audio">
        <button
          type="button"
          class="media-control-button"
          :aria-label="muted ? 'Unmute video' : 'Mute video'"
          :title="muted ? 'Unmute' : 'Mute'"
          @click="emit('toggleMute')"
        >
          <VolumeX v-if="muted || volume === 0" :size="18" />
          <Volume2 v-else :size="18" />
        </button>

        <input
          class="media-control-range media-control-volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="volume"
          :style="volumeStyle"
          aria-label="Video volume"
          :aria-valuetext="`${Math.round(volume * 100)} percent`"
          @input="emit('volumeChange', inputValue($event))"
        >
      </div>
    </div>
  </div>
</template>
