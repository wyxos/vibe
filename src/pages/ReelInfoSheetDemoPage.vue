<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'

import DemoReelInfoSheet from '@/demo/reel-info-sheet/DemoReelInfoSheet.vue'
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

declare global {
  interface Window {
    __vibeReelInfoSheetDemo?: VibeInstance
  }
}

watch(() => props.infiniteScroll, (enabled) => {
  vibe?.setInfiniteScroll(enabled)
})

onMounted(async () => {
  const target = vibeTarget.value
  if (!target) return

  vibe = createVibe({
    target,
    layout: 'responsive',
    infiniteScroll: props.infiniteScroll,
    reelInfoSheet: {
      component: DemoReelInfoSheet,
      enabled: false,
    },
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
  window.__vibeReelInfoSheetDemo = vibe
  await vibe.mount()
})

onBeforeUnmount(() => {
  emit('vibeInstanceChange', null)
  delete window.__vibeReelInfoSheetDemo
  vibe?.destroy()
  vibe = null
})
</script>

<template>
  <section class="demo-stage" aria-label="Reel information sheet">
    <div
      ref="vibeTarget"
      class="vibe-host demo-vibe-host"
      aria-label="Reel information sheet demo"
    />
  </section>
</template>
