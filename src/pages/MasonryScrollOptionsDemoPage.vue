<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { createVibe, type VibeInstance, type VibeMasonryOptions } from '@/index'

const props = withDefaults(defineProps<{ infiniteScroll?: boolean }>(), { infiniteScroll: true })
const root = ref<HTMLElement | null>(null)
const instances: VibeInstance[] = []
const requests = reactive<Record<string, number>>({ baseline: 0, padded: 0, early: 0, exact: 0 })
const examples: Array<{ id: string; title: string; options: VibeMasonryOptions }> = [
  { id: 'baseline', title: 'Default spacing', options: {} },
  { id: 'padded', title: '200px bottom space', options: { bottomSpacePx: 200 } },
  { id: 'early', title: '200px space · 100px threshold', options: { bottomSpacePx: 200, loadMoreThresholdPx: 100 } },
  { id: 'exact', title: '200px space · 0px threshold', options: { bottomSpacePx: 200, loadMoreThresholdPx: 0 } },
]
let disposed = false
onMounted(async () => {
  const items = Array.from({ length: 8 }, (_, index) => ({ postId: index, mediaId: index,
    src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250"><rect width="300" height="250" fill="%23262626"/></svg>',
    width: 300, height: 250, items: [] }))
  for (const example of examples) {
    if (disposed) return
    const target = root.value?.querySelector<HTMLElement>(`#${example.id}`)
    if (!target) continue
    const vibe = createVibe({ target, layout: 'masonry', infiniteScroll: props.infiniteScroll,
      masonry: { minColumnWidth: 500, ...example.options }, initialPage: { items, next: 'next' },
      loadPage: async () => {
        requests[example.id] = (requests[example.id] ?? 0) + 1
        return { items: [], next: null }
      } })
    instances.push(vibe)
    await vibe.mount()
  }
})
watch(() => props.infiniteScroll, value => instances.forEach(instance => instance.setInfiniteScroll(value)))
onBeforeUnmount(() => { disposed = true; instances.forEach(instance => instance.destroy()) })
</script>

<template>
  <section ref="root" class="demo-stage masonry-scroll-demo" aria-label="Masonry scroll options">
    <section v-for="example in examples" :key="example.id" class="masonry-scroll-demo-example">
      <h2>{{ example.title }}</h2>
      <div :id="example.id" class="masonry-scroll-demo-feed" :data-requests="requests[example.id]" />
      <p>Pages requested: {{ requests[example.id] }}</p>
    </section>
  </section>
</template>
