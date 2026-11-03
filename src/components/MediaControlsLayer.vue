<script setup lang="ts">
import { computed, watch } from 'vue'
import type { VibeItemId, VibeLayout } from '../types'
import MediaControls from './MediaControls.vue'
import { useReelControlsVisibility } from './useReelControlsVisibility'

const props = defineProps<{
  visible: boolean
  identity: string
  stationary: boolean
  target?: HTMLElement | null
  postId: VibeItemId
  currentTime: number
  duration: number
  layout: VibeLayout
  mediaType: 'audio' | 'video'
  muted: boolean
  playing: boolean
  playbackRate: number
  volume: number
}>()
const emit = defineEmits<{
  seek: [time: number]
  toggleMute: []
  togglePlayback: []
  playbackRateChange: [rate: number]
  volumeChange: [volume: number]
}>()
const activity = useReelControlsVisibility()
const hidden = computed(() => props.layout === 'reel' && activity.hidden.value)
watch([() => props.visible, () => props.identity], ([visible]) => {
  activity.resetInteraction()
  if (visible && props.layout === 'reel') activity.ready()
}, { immediate: true })
function reveal(event: PointerEvent) {
  if (props.layout === 'reel' && activity.pointerMoved(event)) activity.reveal()
}
</script>

<template>
  <Teleport :disabled="!stationary || !target" :to="target ?? 'body'">
    <Transition name="vibe-reel-media-controls" :css="stationary">
      <MediaControls
        v-if="visible" :key="identity"
        :class="{ 'media-controls--idle-hidden': hidden }"
        :inert="hidden || undefined" :aria-hidden="hidden || undefined"
        :data-control-post-id="stationary ? postId : undefined"
        :current-time="currentTime" :duration="duration" :layout="layout"
        :media-type="mediaType" :muted="muted" :playing="playing"
        :playback-rate="playbackRate" :volume="volume"
        @pointermove="reveal" @pointerdown="activity.onPointerDown"
        @focusin="activity.onFocusIn" @focusout="activity.onFocusOut"
        @interaction-change="activity.onInteractionChange"
        @playback-rate-change="emit('playbackRateChange', $event)"
        @seek="emit('seek', $event)" @toggle-mute="emit('toggleMute')"
        @toggle-playback="emit('togglePlayback')" @volume-change="emit('volumeChange', $event)"
      />
    </Transition>
  </Teleport>
</template>
