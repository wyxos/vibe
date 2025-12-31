<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useAttrs, watch } from 'vue'

import {
  estimateItemHeight,
  getColumnCount,
  getColumnWidth,
} from './masonryLayout.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  getContent: {
    type: Function,
    required: true,
  },
  items: {
    type: Array,
    default: undefined,
  },
  page: {
    type: [String, Number],
    default: 1,
  },
  itemWidth: {
    type: Number,
    default: 300,
  },
  prefetchThresholdPx: {
    type: Number,
    default: 200,
  },
  gapX: {
    type: Number,
    default: 16,
  },
  gapY: {
    type: Number,
    default: 16,
  },
  overscanPx: {
    type: Number,
    default: 600,
  },
})

const emit = defineEmits(['update:items'])

const attrs = useAttrs()

const passthroughAttrs = computed(() => {
  // Avoid double-applying class by stripping it from v-bind.
  const { class: _class, ...rest } = attrs
  return rest
})

const scrollContainerEl = ref(null)

const containerWidth = ref(0)
const viewportHeight = ref(0)
const scrollTop = ref(0)
let resizeObserver

const gapX = computed(() => props.gapX)
const gapY = computed(() => props.gapY)

// Buffer at the bottom to ensure there's always enough scroll room to trigger
// loading the next page.
const SCROLL_BUFFER_PX = 200

// Bucketed index for virtualization.
const BUCKET_PX = 600

// Absolute-position masonry layout state. We keep arrays indexed by item index
// to avoid heavy map lookups during render.
const layoutPositions = ref([])
const layoutHeights = ref([])
const layoutBuckets = ref(new Map())
const layoutContentHeight = ref(0)

const isLoadingInitial = ref(true)
const isLoadingNext = ref(false)
const error = ref('')

const pagesLoaded = ref([])
const internalItems = ref([])
const controlledItemsMirror = ref([])
const nextPage = ref(props.page)

const isItemsControlled = computed(() => props.items !== undefined)

watch(
  () => props.items,
  (next) => {
    if (!isItemsControlled.value) return
    controlledItemsMirror.value = Array.isArray(next) ? next : []
  },
  { immediate: true },
)

const itemsState = computed({
  get() {
    return isItemsControlled.value ? controlledItemsMirror.value : internalItems.value
  },
  set(next) {
    if (isItemsControlled.value) {
      controlledItemsMirror.value = next
      emit('update:items', next)
    } else {
      internalItems.value = next
    }
  },
})

function removeItem(itemOrId) {
  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id
  if (!id) return
  itemsState.value = itemsState.value.filter((it) => it?.id !== id)
}

defineExpose({
  remove: removeItem,
})

function rebuildLayout() {
  const count = columnCount.value
  const colWidth = columnWidth.value
  const gx = gapX.value
  const gy = gapY.value

  const colHeights = Array.from({ length: count }, () => 0)
  const positions = new Array(itemsState.value.length)
  const heights = new Array(itemsState.value.length)
  const buckets = new Map()

  let maxY = 0

  // Sequential placement into the shortest column gives a masonry layout while
  // preserving a single DOM sequence (no re-parenting on removal).
  for (let index = 0; index < itemsState.value.length; index += 1) {
    const item = itemsState.value[index]

    let bestCol = 0
    for (let c = 1; c < colHeights.length; c += 1) {
      if (colHeights[c] < colHeights[bestCol]) bestCol = c
    }

    const x = bestCol * (colWidth + gx)
    const y = colHeights[bestCol]
    const h = estimateItemHeight(item, colWidth)

    positions[index] = { x, y }
    heights[index] = h

    colHeights[bestCol] = y + h + gy
    maxY = Math.max(maxY, y + h)

    // Virtualization buckets by y-range.
    const startBucket = Math.floor(y / BUCKET_PX)
    const endBucket = Math.floor((y + h) / BUCKET_PX)
    for (let b = startBucket; b <= endBucket; b += 1) {
      const arr = buckets.get(b)
      if (arr) arr.push(index)
      else buckets.set(b, [index])
    }
  }

  layoutPositions.value = positions
  layoutHeights.value = heights
  layoutBuckets.value = buckets
  layoutContentHeight.value = maxY
}

const containerHeight = computed(() => {
  const base = Math.max(layoutContentHeight.value, viewportHeight.value)
  return base + SCROLL_BUFFER_PX
})

const visibleIndices = computed(() => {
  const len = itemsState.value.length
  if (!len) return []

  // In jsdom/tests, element sizing is often 0. Render all items.
  if (viewportHeight.value <= 0) return Array.from({ length: len }, (_, i) => i)

  const startY = Math.max(0, scrollTop.value - props.overscanPx)
  const endY = scrollTop.value + viewportHeight.value + props.overscanPx

  const startBucket = Math.floor(startY / BUCKET_PX)
  const endBucket = Math.floor(endY / BUCKET_PX)

  const picked = new Set()
  for (let b = startBucket; b <= endBucket; b += 1) {
    const bucket = layoutBuckets.value.get(b)
    if (!bucket) continue
    for (const idx of bucket) picked.add(idx)
  }

  const ordered = Array.from(picked)
  ordered.sort((a, b) => a - b)
  return ordered
})

const firstLoadedPageToken = computed(() => {
  return pagesLoaded.value.length ? pagesLoaded.value[0] : props.page
})

async function loadNextPage() {
  if (isLoadingInitial.value || isLoadingNext.value) return
  if (nextPage.value == null) return

  try {
    isLoadingNext.value = true
    error.value = ''

    const pageToLoad = nextPage.value
    const result = await props.getContent(pageToLoad)

    pagesLoaded.value = [...pagesLoaded.value, pageToLoad]
    itemsState.value = [...itemsState.value, ...result.items]
    nextPage.value = result.nextPage
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    isLoadingNext.value = false
  }
}

function maybeLoadMoreOnScroll() {
  const el = scrollContainerEl.value
  if (!el) return

  scrollTop.value = el.scrollTop
  viewportHeight.value = el.clientHeight

  const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
  if (distanceFromBottom <= props.prefetchThresholdPx) {
    void loadNextPage()
  }
}

onMounted(async () => {
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      const el = scrollContainerEl.value
      if (!el) return
      containerWidth.value = el.clientWidth
      viewportHeight.value = el.clientHeight
    })
  }

  // Seed initial load
  nextPage.value = props.page

  try {
    isLoadingInitial.value = true
    error.value = ''

    const result = await props.getContent(props.page)

    pagesLoaded.value = [props.page]
    itemsState.value = result.items
    nextPage.value = result.nextPage
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    isLoadingInitial.value = false
  }

  await nextTick()
  const el = scrollContainerEl.value
  if (el) {
    containerWidth.value = el.clientWidth
    viewportHeight.value = el.clientHeight
    scrollTop.value = el.scrollTop
    resizeObserver?.observe(el)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(
  () => props.page,
  async (newPage) => {
    // If the starting page changes, restart the feed.
    pagesLoaded.value = []
    itemsState.value = []
    nextPage.value = newPage
    isLoadingInitial.value = true
    isLoadingNext.value = false
    error.value = ''

    try {
      const result = await props.getContent(newPage)
      pagesLoaded.value = [newPage]
      itemsState.value = result.items
      nextPage.value = result.nextPage
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      isLoadingInitial.value = false
    }
  },
)

const columnCount = computed(() => getColumnCount(containerWidth.value, props.itemWidth))
const columnWidth = computed(() =>
  getColumnWidth(containerWidth.value, columnCount.value, props.itemWidth),
)

watch(
  [columnCount, columnWidth, gapX, gapY],
  () => {
    rebuildLayout()
  },
  { immediate: true },
)

watch(
  // Performance note: this component targets very large arrays (e.g. 10k items).
  // Avoid deep watchers over items; rebuild layout only when the list structure
  // changes (new array reference or length change). This keeps metadata-only
  // updates (e.g. reactions) cheap.
  () => [itemsState.value, itemsState.value.length],
  () => rebuildLayout(),
  { immediate: true },
)

const sectionClass = computed(() => {
  const userClass = attrs.class
  return [
    'mt-8 flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur',
    userClass,
  ]
})
</script>

<template>
  <section v-bind="passthroughAttrs" :class="sectionClass">
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="text-base font-medium text-slate-900">Page {{ firstLoadedPageToken }}</h2>
      <p class="text-xs text-slate-600">Pages loaded: {{ pagesLoaded.length }}</p>
    </div>

    <div
      ref="scrollContainerEl"
      data-testid="items-scroll-container"
      class="mt-4 min-h-0 flex-1 overflow-auto"
      @scroll="maybeLoadMoreOnScroll"
    >
      <p v-if="isLoadingInitial" class="text-sm text-slate-600">Loading…</p>
      <p v-else-if="error" class="text-sm font-medium text-red-700">Error: {{ error }}</p>

      <div v-else class="relative" :style="{ height: containerHeight + 'px' }">
        <article
          v-for="idx in visibleIndices"
          :key="itemsState[idx].id"
          data-testid="item-card"
          class="absolute overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
          :style="{
            width: columnWidth + 'px',
            transform: 'translate3d(' + (layoutPositions[idx]?.x ?? 0) + 'px,' + (layoutPositions[idx]?.y ?? 0) + 'px,0)',
          }"
        >
          <slot name="itemHeader" :item="itemsState[idx]" :remove="() => removeItem(itemsState[idx])" />

          <div
            class="bg-slate-100"
            :style="{ aspectRatio: itemsState[idx].width + ' / ' + itemsState[idx].height }"
          >
            <img
              v-if="itemsState[idx].type === 'image'"
              class="h-full w-full object-cover"
              :src="itemsState[idx].preview"
              :width="itemsState[idx].width"
              :height="itemsState[idx].height"
              loading="lazy"
              :alt="itemsState[idx].id"
            />

            <video
              v-else
              class="h-full w-full object-cover"
              :poster="itemsState[idx].preview"
              controls
              preload="metadata"
            >
              <source :src="itemsState[idx].original" type="video/mp4" />
            </video>
          </div>

          <slot name="itemFooter" :item="itemsState[idx]" :remove="() => removeItem(itemsState[idx])">
            <div class="flex items-center justify-between gap-3 px-4 py-3">
              <span
                class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 text-xs font-medium text-slate-700"
              >
                {{ itemsState[idx].type }}
              </span>
              <span class="truncate font-mono text-xs text-slate-500">{{ itemsState[idx].id }}</span>
            </div>
          </slot>
        </article>
      </div>

      <div class="mt-4 pb-2 text-center text-xs text-slate-600">
        <span v-if="isLoadingNext">Loading more…</span>
        <span v-else-if="nextPage == null">End of list</span>
        <span v-else>Scroll to load page {{ nextPage }}</span>
      </div>
    </div>
  </section>
</template>
