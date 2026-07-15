<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'

import DemoCardFooter from '@/demo/card-chrome/DemoCardFooter.vue'
import DemoCardHeader from '@/demo/card-chrome/DemoCardHeader.vue'
import { getFakeMediaPage } from '@/demo/fakeServer'
import { createVibe, type VibeInstance } from '@/index'

const props = defineProps<{
  infiniteScroll: boolean
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
    cardFooter: {
      component: DemoCardFooter,
      height: 48,
    },
    cardHeader: {
      component: DemoCardHeader,
      height: 48,
    },
    target,
    layout: 'responsive',
    infiniteScroll: props.infiniteScroll,
    loadPage: async ({ cursor }) => {
      const page = await getFakeMediaPage(cursor)

      return {
        items: page.items,
        next: page.meta.next,
        total: page.meta.total,
      }
    },
  })

  await vibe.mount()
})

onBeforeUnmount(() => {
  vibe?.destroy()
  vibe = null
})
</script>

<template>
  <section
    class="demo-stage"
    aria-label="Card header and footer"
  >
    <div
      ref="vibeTarget"
      class="vibe-host demo-vibe-host"
      aria-label="Card header and footer demo"
    />
  </section>
</template>
