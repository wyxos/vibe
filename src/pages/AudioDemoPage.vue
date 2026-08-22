<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeState,
} from '@/index'

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

const props = defineProps<{ infiniteScroll: boolean }>()
const route = useRoute()
const emit = defineEmits<{
  vibeInstanceChange: [instance: VibeInstance | null]
  vibeStateChange: [state: VibeState]
}>()
const target = shallowRef<HTMLElement | null>(null)
let vibe: VibeInstance | null = null

const items: VibeItem[] = [
  {
    postId: 'covered-audio',
    src: SILENT_WAV,
    preview: { height: 256, src: '/favicon-256x256.png', type: 'image', width: 256 },
    type: 'audio',
    width: null,
    height: null,
    items: [],
  },
  {
    postId: 'uncovered-audio',
    src: SILENT_WAV,
    type: 'audio',
    width: null,
    height: null,
    items: [],
  },
]

watch(() => props.infiniteScroll, (enabled) => vibe?.setInfiniteScroll(enabled))

onMounted(async () => {
  if (!target.value) return
  vibe = createVibe({
    infiniteScroll: props.infiniteScroll,
    initialPage: { items, next: null, total: items.length },
    layout: route.query.layout === 'reel' ? 'reel' : 'responsive',
    onStateChange: (state) => emit('vibeStateChange', state),
    target: target.value,
  })
  emit('vibeInstanceChange', vibe)
  await vibe.mount()
})

onBeforeUnmount(() => {
  vibe?.destroy()
  vibe = null
  emit('vibeInstanceChange', null)
})
</script>

<template>
  <section class="demo-stage" aria-label="Audio media demo">
    <div ref="target" class="vibe-host demo-vibe-host" />
  </section>
</template>
