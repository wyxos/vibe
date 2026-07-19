<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'

import { getFakeMediaPage } from '@/demo/fakeServer'
import { isTimedMediaSource } from '@/core/mediaType'
import {
  createVibe,
  type VibeInstance,
  type VibeItem,
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

function prioritizeDemoItems(items: VibeItem[]): VibeItem[] {
  const remaining = [...items]
  const prioritized: VibeItem[] = []
  const takeFirst = (predicate: (item: VibeItem) => boolean): void => {
    const index = remaining.findIndex(predicate)
    if (index >= 0) prioritized.push(...remaining.splice(index, 1))
  }

  takeFirst((item) => item.items.length > 0)
  takeFirst((item) => isTimedMediaSource(item.src))
  return [...prioritized, ...remaining]
}

watch(() => props.infiniteScroll, (enabled) => {
  vibe?.setInfiniteScroll(enabled)
})

onMounted(async () => {
  const target = vibeTarget.value
  if (!target) return

  vibe = createVibe({
    target,
    layout: 'reel',
    infiniteScroll: props.infiniteScroll,
    reelAutoAdvance: { intervalMs: 3_000 },
    onStateChange: (state) => emit('vibeStateChange', state),
    loadPage: async ({ cursor }) => {
      const page = await getFakeMediaPage(cursor)

      return {
        items: cursor === null ? prioritizeDemoItems(page.items) : page.items,
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
  <section class="demo-stage" aria-label="Reel auto advance">
    <div
      ref="vibeTarget"
      class="vibe-host demo-vibe-host"
      aria-label="Reel auto advance demo"
    />
  </section>
</template>
