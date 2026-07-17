<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'

import { getFakeMediaPage } from '@/demo/fakeServer'
import {
  createVibe,
  type VibeInstance,
  type VibeState,
} from '@/index'

const props = defineProps<{
  infiniteScroll: boolean
}>()

const emit = defineEmits<{
  vibeInstanceChange: [instance: VibeInstance | null]
  vibeStateChange: [state: VibeState]
}>()

const vibeTarget = shallowRef<HTMLElement | null>(null)
let vibe: VibeInstance | null = null

watch(() => props.infiniteScroll, (enabled) => {
  vibe?.setInfiniteScroll(enabled)
})

onMounted(async () => {
  const target = vibeTarget.value
  if (!target) return

  vibe = createVibe({
    autoScroll: {},
    target,
    layout: 'masonry',
    infiniteScroll: props.infiniteScroll,
    onStateChange: (state) => emit('vibeStateChange', state),
    loadPage: async ({ cursor }) => {
      const page = await getFakeMediaPage(cursor)

      return {
        items: page.items,
        next: page.meta.next,
        total: page.meta.total,
      }
    },
  })
  emit('vibeInstanceChange', vibe)
  await vibe.mount()
})

onBeforeUnmount(() => {
  emit('vibeInstanceChange', null)
  vibe?.destroy()
  vibe = null
})
</script>

<template>
  <section class="demo-stage" aria-label="Auto scroll">
    <div
      ref="vibeTarget"
      class="vibe-host demo-vibe-host"
      aria-label="Auto scroll demo"
    />
  </section>
</template>
