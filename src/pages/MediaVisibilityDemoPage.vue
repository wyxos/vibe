<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeMediaLifecycleContext,
  type VibeState,
} from '@/index'

const props = defineProps<{ infiniteScroll: boolean }>()

const emit = defineEmits<{
  vibeInstanceChange: [instance: VibeInstance | null]
  vibeStateChange: [state: VibeState]
}>()

const target = shallowRef<HTMLElement | null>(null)
const readyIds = shallowRef<string[]>([])
const visibleIds = shallowRef<string[]>([])
let vibe: VibeInstance | null = null

const items: VibeItem[] = Array.from({ length: 18 }, (_, index) => {
  const id = index + 1
  const src = `https://picsum.photos/seed/vibe-visible-${id}/900/1200`
  return {
    postId: id,
    src,
    preview: { height: 600, src, width: 450 },
    width: 900,
    height: 1200,
    items: [],
  }
})

function identity(context: VibeMediaLifecycleContext): string {
  return `${context.postId}:${context.mediaIndex}`
}

function recordReady(context: VibeMediaLifecycleContext): void {
  readyIds.value = [...readyIds.value, identity(context)]
}

function recordVisible(context: VibeMediaLifecycleContext): void {
  visibleIds.value = [...visibleIds.value, identity(context)]
}

watch(() => props.infiniteScroll, (enabled) => vibe?.setInfiniteScroll(enabled))

onMounted(async () => {
  if (!target.value) return
  vibe = createVibe({
    infiniteScroll: props.infiniteScroll,
    initialPage: { items, next: null, total: items.length },
    layout: 'masonry',
    onMediaReady: recordReady,
    onMediaVisible: recordVisible,
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
  <section class="visibility-demo-stage">
    <aside class="visibility-demo-diagnostics" aria-label="Media lifecycle diagnostics">
      <strong>Ready {{ readyIds.length }}</strong>
      <span>Assets may load in the virtual overscan.</span>
      <strong>Visible {{ visibleIds.length }}</strong>
      <span>Visibility records only cards entering the real viewport.</span>
      <output data-test="visible-media-log">{{ visibleIds.join(', ') || 'Scroll the feed' }}</output>
    </aside>
    <div ref="target" class="vibe-host visibility-demo-vibe" />
  </section>
</template>
