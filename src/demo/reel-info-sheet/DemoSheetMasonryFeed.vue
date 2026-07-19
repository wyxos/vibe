<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  shallowRef,
} from 'vue'

import { getFakeMediaPage } from '@/demo/fakeServer'
import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeMediaAsset,
} from '@/index'

const props = defineProps<{
  item: VibeItem
  mode: 'post' | 'user'
}>()

const vibeTarget = shallowRef<HTMLElement | null>(null)
let vibe: VibeInstance | null = null

function primaryMedia(item: VibeItem): VibeMediaAsset {
  return {
    height: item.height,
    preview: item.preview,
    src: item.src,
    width: item.width,
  }
}

function postMediaItems(item: VibeItem): VibeItem[] {
  return [primaryMedia(item), ...item.items].map((media, index) => ({
    ...media,
    items: [],
    postId: `${item.postId}-media-${index + 1}`,
  }))
}

function rotateFromActive(items: VibeItem[]): VibeItem[] {
  if (items.length === 0) return []

  const numericId = Number(props.item.postId)
  const offset = Number.isFinite(numericId)
    ? Math.abs(numericId) % items.length
    : String(props.item.postId).length % items.length

  return [...items.slice(offset), ...items.slice(0, offset)].slice(0, 12)
}

onMounted(async () => {
  const target = vibeTarget.value
  if (!target) return

  if (props.mode === 'post') {
    const items = postMediaItems(props.item)
    vibe = createVibe({
      target,
      layout: 'masonry',
      infiniteScroll: false,
      initialPage: { items, next: null, total: items.length },
    })
  } else {
    vibe = createVibe({
      target,
      layout: 'masonry',
      infiniteScroll: false,
      loadPage: async () => {
        const page = await getFakeMediaPage(null)
        const items = rotateFromActive(page.items)

        return { items, next: null, total: items.length }
      },
    })
  }

  await vibe.mount()
})

onBeforeUnmount(() => {
  vibe?.destroy()
  vibe = null
})
</script>

<template>
  <div
    ref="vibeTarget"
    class="demo-info-sheet-feed"
    :aria-label="`${mode === 'user' ? 'User' : 'Post'} masonry feed`"
  />
</template>
