<script setup lang="ts">
import EmblaCarousel, { type EmblaCarouselType } from 'embla-carousel'
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
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
const placement = options.reelPreviewPlacement
const horizontal = computed(() => ['top', 'bottom'].includes(typeof placement === 'function' ? placement() : placement ?? 'right'))

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

const viewport = ref<HTMLElement | null>(null)
const track = shallowRef<typeof previews.value>([])
const positions = computed(() => new Map(previews.value.map(({ id }, index) => [id, index + 1])))
let slider: EmblaCarouselType | undefined
let settled: typeof previews.value = []
let moving = false
let revision = 0

async function sync(animate: boolean) {
  if (moving && animate) return
  moving = false
  const request = ++revision
  const target = previews.value
  const root = viewport.value
  const axis = horizontal.value ? 'x' : 'y'
  const motion = root?.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')
  const canMove = animate && motion?.matches === false && !!root?.clientWidth && !!root.clientHeight
  const oldFirst = settled[0]?.id
  const nextFirst = target[0]?.id
  const forward = settled.findIndex(({ id }) => id === nextFirst)
  const backward = target.findIndex(({ id }) => id === oldFirst)
  const start = canMove ? Math.max(0, backward) : 0
  const end = canMove ? Math.max(0, forward) : 0
  // Stage only the entering and exiting cards around the shared portion of the track.
  track.value = start ? [...target.slice(0, start), ...settled]
    : end ? [...settled.slice(0, end), ...target] : target
  await nextTick()
  if (request !== revision) return
  if (!root || start === end) {
    slider?.destroy()
    slider = undefined
    settled = target
    return
  }
  const settings = { axis, startIndex: start, align: 'start', containScroll: false, duration: 15,
    watchDrag: false, watchResize: false, watchSlides: false, watchFocus: false } as const
  if (slider) slider.reInit(settings)
  else {
    slider = EmblaCarousel(root, settings)
    slider.on('settle', () => {
      if (!moving) return
      moving = false
      void sync(previews.value !== settled)
    })
  }
  settled = target
  moving = true
  slider.scrollTo(end)
}

watch([viewport, horizontal, selectedCount, previews, () => props.activeIndex],
  ([root, axis, count, , index], [oldRoot, oldAxis, oldCount, , oldIndex]) => {
    if (root !== oldRoot) { slider?.destroy(); slider = undefined }
    void sync(root === oldRoot && axis === oldAxis && count === oldCount && index !== oldIndex)
  }, { flush: 'post' })
watch(viewport, (root, _, cleanup) => {
  if (!root) return
  const window = root.ownerDocument.defaultView
  const motion = window?.matchMedia?.('(prefers-reduced-motion: reduce)')
  const update = () => { void sync(false) }
  motion?.addEventListener('change', update)
  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => {
    if (!moving) return
    if (frame !== undefined) window?.cancelAnimationFrame(frame)
    frame = window?.requestAnimationFrame(update)
  })
  let frame: number | undefined
  observer?.observe(root)
  cleanup(() => {
    if (frame !== undefined) window?.cancelAnimationFrame(frame)
    observer?.disconnect()
    motion?.removeEventListener('change', update)
  })
})
onBeforeUnmount(() => { revision++; slider?.destroy() })
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
    <div v-if="previews.length" ref="viewport" class="reel-preview-viewport" :style="{ '--preview-count': selectedCount }">
      <ol class="reel-preview-list">
        <li v-for="preview in track" :key="preview.id"
          :data-preview-post-id="positions.has(preview.id) ? preview.id : undefined" :aria-hidden="!positions.has(preview.id) || undefined">
          <span v-if="positions.has(preview.id)" class="reel-preview-position" aria-hidden="true">+{{ positions.get(preview.id) }}</span>
          <ReelPreviewMedia :source="preview.source" :position="positions.get(preview.id) ?? 0" />
        </li>
      </ol>
    </div>
    <div v-if="status" class="reel-preview-boundary">
      <span v-if="status" role="status">{{ status }}</span>
      <button v-if="canRetry" type="button" @click="emit('loadMore')">Retry</button>
    </div>
  </aside>
</template>
