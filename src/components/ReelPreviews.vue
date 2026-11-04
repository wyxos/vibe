<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Film, ImageOff, Music } from 'lucide-vue-next'
import { resolveMediaType } from '../core/mediaType'
import type { VibeItem, VibeState } from '../types'

const props = defineProps<{
  items: readonly VibeItem[]
  state: VibeState
}>()
const emit = defineEmits<{ loadMore: [] }>()
const counts = [4, 6, 8] as const
const count = ref<(typeof counts)[number]>(4)
const failed = ref(new Set<string>())
const previews = computed(() => props.items.slice(0, count.value).map((item) => {
  const type = resolveMediaType(item.type, item.src)
  const preview = item.preview
  const src = preview && resolveMediaType(preview.type, preview.src) === 'image'
    ? preview.src : type === 'image' ? item.src : null
  return { id: item.postId, src, type }
}))
watch(previews, (visible) => {
  const sources = new Set(visible.map((item) => item.src))
  for (const src of failed.value) if (!sources.has(src)) failed.value.delete(src)
})
const boundary = computed(() => {
  if (props.state.isLoadingMore) return 'loading'
  if (props.state.next === null) return 'end'
  if (props.state.loadMoreLocked) return 'paused'
  if (props.state.nextPageError) return 'retry'
  return props.state.infiniteScroll ? null : 'manual'
})
const status = computed(() => {
  if (props.items.length >= count.value) return null
  return {
    loading: 'Loading previews…',
    end: 'End of feed',
    paused: 'Loading paused',
    retry: 'Could not load more',
    manual: null,
  }[boundary.value ?? 'manual']
})
const canLoad = computed(() => props.items.length < count.value
  && (boundary.value === 'manual' || boundary.value === 'retry'))

function isolate(event: KeyboardEvent) {
  if (event.key !== 'Escape') event.stopPropagation()
}
</script>

<template>
  <aside
    v-if="previews.length || status || canLoad"
    class="reel-previews"
    :class="{ 'reel-previews--empty': !previews.length }"
    aria-label="Upcoming reel items"
    @keydown="isolate"
  >
    <div v-if="previews.length" class="reel-preview-count" role="group" aria-label="Number of reel previews">
      <button
        v-for="value in counts"
        :key="value"
        type="button"
        :aria-label="`Show ${value} previews`"
        :aria-pressed="value === count"
        @click="count = value"
      >{{ value }}</button>
    </div>
    <ol v-if="previews.length" class="reel-preview-list" :class="{ 'reel-preview-list--dense': previews.length > 4 }">
      <li v-for="(preview, index) in previews" :key="preview.id" :data-preview-post-id="preview.id">
        <span class="reel-preview-position" aria-hidden="true">+{{ index + 1 }}</span>
        <img
          v-if="preview.src && !failed.has(preview.src)"
          :src="preview.src"
          :alt="`Upcoming item ${index + 1}`"
          loading="lazy"
          decoding="async"
          @error="failed.add(preview.src)"
        >
        <Film v-else-if="preview.type === 'video'" role="img" aria-label="Video" />
        <Music v-else-if="preview.type === 'audio'" role="img" aria-label="Audio" />
        <ImageOff v-else role="img" aria-label="Preview unavailable" />
      </li>
    </ol>
    <div v-if="status || canLoad" class="reel-preview-boundary">
      <span v-if="status" role="status">{{ status }}</span>
      <button v-if="canLoad" type="button" @click="emit('loadMore')">
        {{ boundary === 'retry' ? 'Retry' : 'Load more' }}
      </button>
    </div>
  </aside>
</template>
