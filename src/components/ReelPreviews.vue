<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { resolveMediaType } from '../core/mediaType'
import { resolveReelPreviewCount, useReelPreviewOptions } from '../core/reelPreviews'
import type { VibeItem, VibeReelPreviewCount, VibeState } from '../types'
import ReelPreviewMedia from './ReelPreviewMedia.vue'

const props = defineProps<{
  items: readonly VibeItem[]
  activeIndex: number
  state: VibeState
}>()
const emit = defineEmits<{ loadMore: [] }>()
const counts = [4, 6, 8] as const
const options = useReelPreviewOptions()
const countOption = options.reelPreviewCount
const localCount = ref(typeof countOption === 'number' ? countOption : 4)
const selectedCount = computed(() => resolveReelPreviewCount(typeof countOption === 'function' ? countOption() : localCount.value))
const backwards = ref(false)
watch(() => props.activeIndex, (index, previous) => { backwards.value = index < previous })

function chooseCount(value: VibeReelPreviewCount) {
  localCount.value = value
  options.onReelPreviewCountChange?.(value)
}

const previews = computed(() => props.items.slice(0, selectedCount.value).map((item) => {
  if (options.resolveReelPreview) return { id: item.postId, source: options.resolveReelPreview(item) }
  const type = resolveMediaType(item.type, item.src)
  const preview = item.preview
  const src = preview && resolveMediaType(preview.type, preview.src) === 'image'
    ? preview.src : type === 'image' ? item.src : null
  return { id: item.postId, source: { src, type } }
}))
const boundary = computed(() => {
  if (!props.state.infiniteScroll || props.state.loadMoreLocked) return null
  if (props.state.isLoadingMore) return 'loading'
  if (props.state.next === null) return 'end'
  if (props.state.nextPageError) return 'retry'
  return null
})
const status = computed(() => {
  if (!boundary.value || props.items.length >= selectedCount.value) return null
  return {
    loading: 'Loading previews…',
    end: 'End of feed',
    retry: 'Could not load more',
  }[boundary.value]
})
const canRetry = computed(() => props.items.length < selectedCount.value && boundary.value === 'retry')

function isolate(event: KeyboardEvent) {
  if (event.key !== 'Escape') event.stopPropagation()
}

function pinLeavingTile(node: Element) {
  if (!(node instanceof HTMLElement)) return
  // Keep the outgoing card in place while the surviving cards slide into their new slots.
  Object.assign(node.style, {
    inset: `${node.offsetTop}px auto auto ${node.offsetLeft}px`,
    width: `${node.offsetWidth}px`,
    height: `${node.offsetHeight}px`,
  })
}
</script>

<template>
  <aside
    v-if="previews.length || status"
    class="reel-previews"
    :class="{ 'reel-previews--empty': !previews.length }"
    aria-label="Upcoming reel items"
    data-reel-gesture-ignore
    @keydown="isolate"
  >
    <div v-if="previews.length && (countOption === undefined || options.onReelPreviewCountChange)" class="reel-preview-count" role="group" aria-label="Number of reel previews">
      <button
        v-for="value in counts"
        :key="value"
        type="button"
        :aria-label="`Show ${value} previews`"
        :aria-pressed="value === selectedCount"
        @click="chooseCount(value)"
      >{{ value }}</button>
    </div>
    <TransitionGroup
      v-if="previews.length" tag="ol" name="vibe-preview-tile" class="reel-preview-list"
      :class="{ 'reel-preview-list--dense': previews.length > 4, 'reel-preview-list--backwards': backwards }"
      @before-leave="pinLeavingTile"
    >
      <li v-for="(preview, index) in previews" :key="preview.id" :data-preview-post-id="preview.id">
        <span class="reel-preview-position" aria-hidden="true">+{{ index + 1 }}</span>
        <ReelPreviewMedia :source="preview.source" :position="index + 1" />
      </li>
    </TransitionGroup>
    <div v-if="status" class="reel-preview-boundary">
      <span v-if="status" role="status">{{ status }}</span>
      <button v-if="canRetry" type="button" @click="emit('loadMore')">Retry</button>
    </div>
  </aside>
</template>
