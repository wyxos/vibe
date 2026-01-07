<script setup lang="ts">
import { computed, ref } from 'vue'

type Props = {
  currentTime: number
  duration: number
  ariaLabel?: string
  step?: number
  keyboardStep?: number
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Seek',
  step: 0.1,
  keyboardStep: 5,
})

const emit = defineEmits<{
  (e: 'seek', time: number): void
}>()

const rootEl = ref<HTMLElement | null>(null)
const trackEl = ref<HTMLElement | null>(null)
const thumbEl = ref<HTMLElement | null>(null)
const isDragging = ref(false)

const stepValue = computed(() =>
  Number.isFinite(props.step) ? Math.max(0, props.step) : 0
)
const maxValue = computed(() =>
  Number.isFinite(props.duration) ? Math.max(0, props.duration) : 0
)
const currentValue = computed(() => {
  const next = Number.isFinite(props.currentTime) ? props.currentTime : 0
  return clamp(next, 0, maxValue.value)
})
const percent = computed(() =>
  maxValue.value > 0 ? currentValue.value / maxValue.value : 0
)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function quantize(value: number) {
  if (stepValue.value <= 0) return value
  return Math.round(value / stepValue.value) * stepValue.value
}

function seekTo(next: number) {
  const clamped = clamp(next, 0, maxValue.value)
  emit('seek', quantize(clamped))
}

function seekFromClientX(clientX: number) {
  const track = trackEl.value
  if (!track) return
  const rect = track.getBoundingClientRect()
  if (!rect.width) return
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
  seekTo(ratio * maxValue.value)
}

function handlePointerDown(e: PointerEvent) {
  const track = trackEl.value
  if (!track) return
  isDragging.value = true
  if (track.setPointerCapture) track.setPointerCapture(e.pointerId)
  seekFromClientX(e.clientX)
}

function handlePointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  seekFromClientX(e.clientX)
}

function handlePointerUp(e: PointerEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  const track = trackEl.value
  if (track?.releasePointerCapture) track.releasePointerCapture(e.pointerId)
}

function handleKeydown(e: KeyboardEvent) {
  if (maxValue.value <= 0) return
  const step = Number.isFinite(props.keyboardStep) ? props.keyboardStep : 1
  let next = currentValue.value

  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      next -= step
      break
    case 'ArrowRight':
    case 'ArrowUp':
      next += step
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = maxValue.value
      break
    default:
      return
  }

  e.preventDefault()
  seekTo(next)
}

function focus() {
  rootEl.value?.focus()
}

defineExpose({
  focus,
  seekTo,
  percent,
  currentValue,
  maxValue,
  isDragging,
  rootEl,
  trackEl,
  thumbEl,
})
</script>

<template>
  <div
    ref="rootEl"
    class="w-full select-none"
    role="slider"
    tabindex="0"
    :aria-label="props.ariaLabel"
    :aria-valuemin="0"
    :aria-valuemax="maxValue"
    :aria-valuenow="currentValue"
    @keydown="handleKeydown"
  >
    <div
      ref="trackEl"
      class="relative h-2 w-full cursor-pointer rounded-full bg-slate-200"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerleave="handlePointerUp"
    >
      <div
        class="absolute inset-y-0 left-0 rounded-full bg-slate-500"
        :style="{ width: `${percent * 100}%` }"
      ></div>
      <div
        ref="thumbEl"
        class="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-700 shadow"
        :style="{ left: `${percent * 100}%` }"
        aria-hidden="true"
      ></div>
    </div>
  </div>
</template>
