<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Maximize2, Volume1, Volume2, VolumeX } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  currentTime: number
  currentTimeLabel: string
  duration: number
  durationLabel: string
  muted: boolean
  progress: number
  showFullscreenControl?: boolean
  volume: number
  volumeControlLayout: 'horizontal' | 'vertical'
}>(), {
  showFullscreenControl: false,
})

const emit = defineEmits<{
  'fullscreen-request': []
  'seek-input': [event: Event]
  'volume-input': [event: Event]
  'volume-toggle': []
}>()

const rootRef = ref<HTMLElement | null>(null)
const isMobileVolumeOpen = ref(false)
const isVerticalVolumeControl = computed(() => props.volumeControlLayout === 'vertical')
const normalizedVolume = computed(() => clamp(props.volume, 0, 1))
const volumePercent = computed(() => Math.round(normalizedVolume.value * 100))
const volumeIcon = computed(() => {
  if (props.muted || normalizedVolume.value <= 0) {
    return VolumeX
  }

  return normalizedVolume.value < 0.5 ? Volume1 : Volume2
})
const volumeToggleLabel = computed(() => (
  props.muted || normalizedVolume.value <= 0
    ? 'Unmute active media'
    : 'Mute active media'
))
const volumeButtonLabel = computed(() => (
  isVerticalVolumeControl.value && !isMobileVolumeOpen.value
    ? 'Show volume controls'
    : volumeToggleLabel.value
))
const volumeFillStyle = computed(() => (
  props.volumeControlLayout === 'vertical'
    ? { height: `${volumePercent.value}%` }
    : { width: `${volumePercent.value}%` }
))

watch(isVerticalVolumeControl, (isVertical) => {
  if (!isVertical) {
    isMobileVolumeOpen.value = false
  }
})

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})

function onDocumentPointerDown(event: PointerEvent) {
  if (!isVerticalVolumeControl.value || !isMobileVolumeOpen.value) {
    return
  }

  if (rootRef.value && event.target instanceof Node && !rootRef.value.contains(event.target)) {
    isMobileVolumeOpen.value = false
  }
}

function onVolumeButtonClick() {
  if (!isVerticalVolumeControl.value) {
    emit('volume-toggle')
    return
  }

  if (!isMobileVolumeOpen.value) {
    isMobileVolumeOpen.value = true
    return
  }

  emit('volume-toggle')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
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

      <div class="flex items-center justify-end gap-3">
        <span class="text-[0.76rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74">
          {{ props.durationLabel }}
        </span>

        <button
          v-if="props.showFullscreenControl"
          type="button"
          data-testid="vibe-media-fullscreen-button"
          class="inline-flex h-10 w-10 items-center justify-center border border-white/14 bg-black/50 text-[#f7f1ea]/82 backdrop-blur-[18px] transition hover:border-white/28 hover:bg-black/65"
          aria-label="Open active video fullscreen"
          @click="emit('fullscreen-request')"
        >
          <Maximize2 class="h-4 w-4 stroke-[1.9]" aria-hidden="true" />
        </button>

        <div
          ref="rootRef"
          data-testid="vibe-media-volume"
          :data-layout="props.volumeControlLayout"
          class="relative flex items-center justify-end"
        >
          <div
            v-if="isVerticalVolumeControl && isMobileVolumeOpen"
            data-testid="vibe-media-volume-popover"
            class="absolute bottom-[calc(100%+0.8rem)] right-0 grid justify-items-center gap-3 border border-white/12 bg-black/82 px-3 py-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)] backdrop-blur-[18px]"
          >
            <div class="relative flex h-28 w-4 items-center justify-center">
              <div class="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white/12" />
              <div
                class="absolute bottom-0 left-1/2 w-px -translate-x-1/2 bg-[#f7f1ea]"
                :style="volumeFillStyle"
              />
              <input
                data-testid="vibe-media-volume-slider"
                data-swipe-lock="true"
                type="range"
                aria-label="Adjust active media volume"
                min="0"
                max="1"
                step="0.05"
                :value="normalizedVolume"
                class="vibe-media-slider absolute left-1/2 top-1/2 h-4 w-28 -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-transparent"
                @input="emit('volume-input', $event)"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              data-testid="vibe-media-volume-button"
              :aria-label="volumeButtonLabel"
              class="inline-flex h-10 w-10 items-center justify-center border border-white/14 bg-black/50 text-[#f7f1ea]/82 backdrop-blur-[18px] transition hover:border-white/28 hover:bg-black/65"
              @click="onVolumeButtonClick"
            >
              <component :is="volumeIcon" class="h-4 w-4 stroke-[1.9]" aria-hidden="true" />
            </button>

            <div
              v-if="props.volumeControlLayout === 'horizontal'"
              class="relative h-4 w-24"
            >
              <div class="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/12" />
              <div
                class="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-[#f7f1ea]"
                :style="volumeFillStyle"
              />
              <input
                data-testid="vibe-media-volume-slider"
                data-swipe-lock="true"
                type="range"
                aria-label="Adjust active media volume"
                min="0"
                max="1"
                step="0.05"
                :value="normalizedVolume"
                class="vibe-media-slider absolute inset-0 z-10 h-4 w-full cursor-pointer bg-transparent"
                @input="emit('volume-input', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
