<script setup lang="ts">
const props = defineProps<{
  currentTime: number
  currentTimeLabel: string
  duration: number
  durationLabel: string
  progress: number
}>()

const emit = defineEmits<{
  'seek-input': [event: Event]
}>()
</script>

<template>
  <div
    data-testid="vibe-media-bar"
    class="absolute inset-x-0 bottom-0 z-[5] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.42)_24%,rgba(0,0,0,0.78))] px-[clamp(1rem,2.6vw,2.25rem)] pt-4 pb-[1.15rem]"
  >
    <div class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/12 bg-black/70 px-4 py-3 backdrop-blur-[18px]">
      <span class="text-[0.76rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74">
        {{ props.currentTimeLabel }}
      </span>

      <div class="relative h-4 w-full">
        <div class="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/12" />
        <div
          class="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-[#f7f1ea]"
          :style="{ width: `${props.progress}%` }"
        />
        <input
          data-swipe-lock="true"
          type="range"
          aria-label="Seek active media"
          min="0"
          step="0.1"
          :max="props.duration || 1"
          :value="props.currentTime"
          :disabled="props.duration <= 0"
          class="vibe-media-slider absolute inset-0 z-10 h-4 w-full cursor-pointer bg-transparent disabled:cursor-default disabled:opacity-50"
          @input="emit('seek-input', $event)"
        />
      </div>

      <span class="text-[0.76rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74">
        {{ props.durationLabel }}
      </span>
    </div>
  </div>
</template>
