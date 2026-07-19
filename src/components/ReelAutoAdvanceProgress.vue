<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

const props = defineProps<{
  durationMs: number
  label: string
}>()

const emit = defineEmits<{
  complete: []
}>()

const progressStyle = computed<CSSProperties>(() => ({
  '--vibe-reel-auto-advance-duration': `${props.durationMs}ms`,
}))
</script>

<template>
  <div
    class="reel-auto-advance"
    data-test="reel-auto-advance"
    role="timer"
    :aria-label="label"
  >
    <span
      class="reel-auto-advance-progress"
      :style="progressStyle"
      @animationend="emit('complete')"
    />
  </div>
</template>
