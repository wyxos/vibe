<script setup lang="ts">
import { Pause, Play, Settings, Volume2, VolumeX, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch, type CSSProperties } from 'vue'
import type { VibeLayout, VibeMediaControlAction, VibeMediaControlsOptions, VibeMediaType } from '../types'

const props = withDefaults(defineProps<{
  currentTime: number
  duration: number
  layout: VibeLayout
  mediaType: Extract<VibeMediaType, 'audio' | 'video'>
  muted: boolean
  playing: boolean
  volume: number
  playbackRate?: number
  options?: VibeMediaControlsOptions
  actions?: readonly VibeMediaControlAction[]
}>(), { playbackRate: 1 })
const emit = defineEmits<{
  seek: [time: number]
  toggleMute: []
  togglePlayback: []
  volumeChange: [volume: number]
  playbackRateChange: [rate: number]
  interactionChange: [active: boolean]
}>()
const root = ref<HTMLElement | null>(null)
const volumeButton = ref<HTMLButtonElement | null>(null)
const optionsButton = ref<HTMLButtonElement | null>(null)
const popover = ref<'volume' | 'options' | null>(null)
const phone = ref(false)
const optionsPanel = ref<HTMLElement | null>(null)
let phoneQuery: MediaQueryList | undefined
const id = useId()
const rates = computed(() => [...new Set(props.options?.playbackRates ?? [0.5, 0.75, 1, 1.5, 2])]
  .filter(rate => Number.isFinite(rate) && rate >= 0.25 && rate <= 4))
const hasOptions = computed(() => props.options?.showMute !== false || rates.value.length > 0 || !!props.actions?.length)

function syncPhone() {
  const next = phoneQuery?.matches ?? false
  if (next !== phone.value && popover.value === 'options') dismissOptions()
  phone.value = next
}
watch(optionsPanel, panel => {
  if (panel instanceof HTMLDialogElement && !panel.open) panel.showModal()
}, { flush: 'post' })
watch(hasOptions, available => {
  if (!available && popover.value === 'options') dismissOptions()
})

function dismissOptions() {
  popover.value = null
  if (optionsPanel.value instanceof HTMLDialogElement) optionsPanel.value.close()
  optionsButton.value?.focus({ preventScroll: true })
}

function selectAction(action: VibeMediaControlAction) {
  if (!action.keepOpen) dismissOptions()
  action.onSelect()
}

function bounded(value: number, maximum = 1): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(maximum, Math.max(0, value))
}
function formatTime(value: number): string {
  const seconds = Math.floor(bounded(value, Number.MAX_SAFE_INTEGER))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`
}
function inputValue(event: Event): number {
  return Number((event.target as HTMLInputElement).value)
}
function togglePopover(value: 'volume' | 'options'): void {
  popover.value = popover.value === value ? null : value
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && popover.value) {
    event.preventDefault()
    event.stopPropagation()
    if (popover.value === 'options') dismissOptions()
    else {
      popover.value = null
      volumeButton.value?.focus({ preventScroll: true })
    }
  } else if (event.key !== 'Escape') event.stopPropagation()
}
function outsidePointer(event: PointerEvent): void {
  if (event.target instanceof Node && !root.value?.contains(event.target)) popover.value = null
}
function onFocusout(event: FocusEvent): void {
  if (event.relatedTarget instanceof Node && !root.value?.contains(event.relatedTarget)) {
    popover.value = null
  }
}
watch(popover, value => emit('interactionChange', value !== null), { flush: 'sync' })
onMounted(() => {
  phoneQuery = window.matchMedia?.('(max-width: 700px)')
  syncPhone()
  phoneQuery?.addEventListener?.('change', syncPhone)
  document.addEventListener('pointerdown', outsidePointer)
})
onBeforeUnmount(() => {
  if (optionsPanel.value instanceof HTMLDialogElement) optionsPanel.value.close()
  phoneQuery?.removeEventListener?.('change', syncPhone)
  document.removeEventListener('pointerdown', outsidePointer)
  if (popover.value) emit('interactionChange', false)
})
const safeDuration = computed(() => bounded(props.duration, Number.MAX_SAFE_INTEGER))
const mediaLabel = computed(() => props.mediaType)
const mediaLabelTitle = computed(() => props.mediaType === 'audio' ? 'Audio' : 'Video')
const safeCurrentTime = computed(() => bounded(props.currentTime, safeDuration.value))
const seekStyle = computed<CSSProperties>(() => ({
  '--media-range-progress': `${safeDuration.value > 0 ? safeCurrentTime.value / safeDuration.value * 100 : 0}%`,
}))
const volumeStyle = computed<CSSProperties>(() => ({
  '--media-range-progress': `${bounded(props.volume) * 100}%`,
}))
</script>

<template>
  <div
    ref="root"
    class="media-controls"
    :class="`media-controls--${layout}`"
    role="group"
    :aria-label="`${mediaLabelTitle} controls`"
    @click.stop
    @dblclick.stop
    @keydown="onKeydown"
    @focusout="onFocusout"
    @wheel.stop
  >
    <input
      class="media-control-range media-control-seek"
      type="range" min="0" :max="safeDuration || 0" step="0.1"
      :value="safeCurrentTime" :style="seekStyle"
      :aria-label="`Seek ${mediaLabel}`"
      :aria-valuetext="`${formatTime(safeCurrentTime)} of ${formatTime(safeDuration)}`"
      :disabled="safeDuration <= 0"
      @input="emit('seek', inputValue($event))"
    >
    <div v-if="layout === 'reel'" class="media-controls-row">
      <button
        type="button" class="media-control-button media-control-playback"
        :aria-label="playing ? `Pause ${mediaLabel}` : `Play ${mediaLabel}`"
        :title="playing ? 'Pause' : 'Play'" @click="emit('togglePlayback')"
      >
        <Pause v-if="playing" :size="18" fill="currentColor" />
        <Play v-else :size="18" fill="currentColor" />
      </button>
      <div class="media-controls-audio">
        <button
          type="button" class="media-control-button media-control-mute"
          :aria-label="muted ? `Unmute ${mediaLabel}` : `Mute ${mediaLabel}`"
          :title="muted ? 'Unmute' : 'Mute'" @click="emit('toggleMute')"
        >
          <VolumeX v-if="muted || volume === 0" :size="18" />
          <Volume2 v-else :size="18" />
        </button>
        <button
          ref="volumeButton" type="button" class="media-control-button media-control-volume-toggle"
          :aria-label="`${mediaLabelTitle} volume control`" title="Volume"
          :aria-expanded="popover === 'volume'" :aria-controls="`${id}-volume`"
          @click="togglePopover('volume')"
        >
          <VolumeX v-if="muted || volume === 0" :size="18" />
          <Volume2 v-else :size="18" />
        </button>
        <div
          :id="`${id}-volume`" class="media-control-volume-panel"
          :class="{ 'media-control-volume-panel--open': popover === 'volume' }"
        >
          <input
            class="media-control-range media-control-volume"
            type="range" min="0" max="1" step="0.05" :value="volume" :style="volumeStyle"
            :aria-label="`${mediaLabelTitle} volume`"
            :aria-valuetext="`${Math.round(volume * 100)} percent`"
            @input="emit('volumeChange', inputValue($event))"
          >
        </div>
      </div>
      <output class="media-control-time" aria-live="off">
        {{ formatTime(safeCurrentTime) }} / {{ formatTime(safeDuration) }}
      </output>
      <div v-if="hasOptions" class="media-control-options">
        <button
          ref="optionsButton" type="button" class="media-control-button media-control-options-toggle"
          :aria-label="`${mediaLabelTitle} options`" title="Options"
          :aria-expanded="popover === 'options'" :aria-controls="`${id}-options`"
          :aria-haspopup="phone ? 'dialog' : undefined"
          @click="togglePopover('options')"
        >
          <Settings :size="18" />
        </button>
        <Transition name="media-control-popover">
          <component
            :is="phone ? 'dialog' : 'div'" v-if="popover === 'options'" ref="optionsPanel"
            :id="`${id}-options`" :class="phone ? 'media-control-drawer' : 'media-control-options-panel'"
            :role="phone ? undefined : 'group'" :aria-label="`${mediaLabelTitle} options`"
            @cancel.prevent="dismissOptions"
            @click.self="phone && dismissOptions()"
          >
            <header v-if="phone" class="media-control-drawer-header">
              <strong>Playback options</strong>
              <button type="button" class="media-control-option" aria-label="Close playback options" autofocus @click="dismissOptions">
                <X :size="22" />
              </button>
            </header>
            <div class="media-control-options-body">
              <button v-if="options?.showMute !== false" type="button" class="media-control-option" @click="emit('toggleMute')">
                {{ muted ? 'Unmute' : 'Mute' }}
              </button>
              <div v-if="rates.length" class="media-control-rate" role="group" aria-label="Playback speed">
                <span>Speed</span>
                <div class="media-control-rates">
                  <button
                    v-for="rate in rates" :key="rate" type="button" class="media-control-option"
                    :aria-pressed="playbackRate === rate" :aria-label="`${rate}× speed`"
                    @click="emit('playbackRateChange', rate)"
                  >{{ rate }}×</button>
                </div>
              </div>
              <button
                v-for="action in actions" :key="action.id" type="button"
                class="media-control-option media-control-custom-action"
                :disabled="action.disabled" :aria-pressed="action.selected"
                @click="selectAction(action)"
              >{{ action.label }}</button>
            </div>
          </component>
        </Transition>
      </div>
    </div>
  </div>
</template>
