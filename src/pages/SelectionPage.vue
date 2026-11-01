<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import '@/demo/selection.css'
import { getFakeMediaPage } from '@/demo/fakeServer'
import SelectionFooter from '@/demo/SelectionFooter.vue'
import { refreshSelections, retrySelection, selectionBusy, selectionError, selectionReady, selectionRows } from '@/demo/selection'
import { createVibe, type VibeInstance, type VibeState } from '@/index'

const props = defineProps<{ infiniteScroll: boolean }>()
const emit = defineEmits<{ vibeStateChange: [state: VibeState] }>()
const target = shallowRef<HTMLElement | null>(null)
const postCount = computed(() => new Set(selectionRows.value.map((row) => row.postId)).size)
let vibe: VibeInstance | null = null
watch(() => props.infiniteScroll, (enabled) => vibe?.setInfiniteScroll(enabled))
onMounted(async () => {
  await refreshSelections()
  if (!target.value) return
  vibe = createVibe({
    target: target.value,
    layout: 'responsive',
    infiniteScroll: props.infiniteScroll,
    cardFooter: { component: SelectionFooter, height: 48 },
    onStateChange: (state) => emit('vibeStateChange', state),
    loadPage: async ({ cursor }) => {
      const page = await getFakeMediaPage(cursor)
      return { items: page.items, next: page.meta.next, total: page.meta.total }
    },
  })
  await vibe.mount()
})
onBeforeUnmount(() => vibe?.destroy())
</script>

<template>
  <main class="selection-page">
    <div class="selection-toolbar">
      <div>
        <h1>Select examples</h1>
        <p>Choose a post to save every image in that post from the demo fixtures. Click again to undo.</p>
        <p role="status">
          <template v-if="selectionBusy">{{ selectionReady ? 'Saving…' : 'Loading selections…' }}</template>
          <template v-else-if="selectionReady">
            {{ postCount }} {{ postCount === 1 ? 'post' : 'posts' }} · {{ selectionRows.length }} images saved to CSV
          </template>
        </p>
      </div>
      <a class="selection-button" href="/__selection/csv" download="selected-civitai.csv">Download CSV</a>
    </div>
    <div v-if="selectionError" class="selection-error" role="alert">
      {{ selectionError }}
      <button class="selection-button" :disabled="selectionBusy" @click="retrySelection">Retry</button>
    </div>
    <div ref="target" class="vibe-host" aria-label="Select CivitAI examples" />
  </main>
</template>
