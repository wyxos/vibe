<script setup lang="ts">
import { useReelPlaybackOptions } from './useReelPlaybackOptions'

const emit = defineEmits<{ fullscreen: [] }>()
const playback = useReelPlaybackOptions()
function updateDuration(event: Event) {
  const input = event.target as HTMLInputElement
  const milliseconds = input.valueAsNumber * 1000
  if (Number.isFinite(milliseconds) && milliseconds > 0) playback?.setAutoAdvance({ intervalMs: milliseconds })
  else if (playback) input.value = String(playback.autoAdvance.value.intervalMs / 1000)
}
</script>

<template>
  <template v-if="playback">
    <button v-if="playback.canFullscreen.value" type="button" class="media-control-option media-control-custom-action" @click="emit('fullscreen')">
      {{ playback.fullscreen.value ? 'Exit fullscreen' : 'Enter fullscreen' }}
    </button>
    <button
      type="button" class="media-control-option media-control-custom-action"
      :aria-pressed="playback.autoAdvance.value.enabled"
      @click="playback.setAutoAdvance({ enabled: !playback.autoAdvance.value.enabled })"
    >Auto advance</button>
    <label class="media-control-advance-duration">
      <span>Image duration (seconds)</span>
      <input type="number" min="0.001" step="any" :value="playback.autoAdvance.value.intervalMs / 1000" @change="updateDuration">
    </label>
  </template>
</template>
