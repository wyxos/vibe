<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'
import { useReelPlaybackOptions } from './useReelPlaybackOptions'

const emit = defineEmits<{ fullscreen: [] }>()
const playback = useReelPlaybackOptions()
function stepDuration(direction: -1 | 1) {
  if (!playback) return
  const current = playback.autoAdvance.value.intervalMs
  playback.setAutoAdvance({ intervalMs: Math.max(1000, current + direction * 1000) })
}
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
    <div class="media-control-advance-duration">
      <span>Image duration (seconds)</span>
      <div class="media-control-duration-stepper">
        <button type="button" aria-label="Decrease image duration" :disabled="playback.autoAdvance.value.intervalMs <= 1000" @click="stepDuration(-1)">
          <Minus :size="16" aria-hidden="true" />
        </button>
        <input aria-label="Image duration (seconds)" type="number" inputmode="decimal" min="0.001" step="any" :value="playback.autoAdvance.value.intervalMs / 1000" @change="updateDuration">
        <button type="button" aria-label="Increase image duration" @click="stepDuration(1)">
          <Plus :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>
  </template>
</template>
