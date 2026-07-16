<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'
import { RouterView, useRouter } from 'vue-router'

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
  vibeStateChange: [state: VibeState]
}>()

const router = useRouter()
const vibeTarget = shallowRef<HTMLElement | null>(null)
let vibe: VibeInstance | null = null

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
    onStateChange: (state) => emit('vibeStateChange', state),
    routing: {
      router,
      feed: { name: 'demo-reel-url' },
      reel: ({ item }) => ({
        name: 'demo-reel-url-file',
        params: { fileId: String(item.postId) },
      }),
    },
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
    aria-label="Reel URL"
  >
    <div
      ref="vibeTarget"
      class="vibe-host demo-vibe-host"
      aria-label="Reel URL demo"
    />
    <RouterView />
  </section>
</template>
