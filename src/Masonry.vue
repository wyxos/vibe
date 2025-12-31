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

// Tailwind `gap-4` = 1rem by default.
const ITEM_GAP_PX = 16

// Keep a stable per-item column assignment to avoid remounting lots of items
// (and reloading images) when the items array changes.
const columnsState = ref([])
let itemIdToColumnIndex = new Map()

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

function rebuildColumns() {
  const count = columnCount.value
  const colWidth = columnWidth.value

  const nextColumns = Array.from({ length: count }, () => ({ height: 0, items: [] }))

  for (const item of itemsState.value) {
    const id = item?.id
    let index = id ? itemIdToColumnIndex.get(id) : undefined

    if (typeof index !== 'number' || index < 0 || index >= count) {
      let bestIndex = 0
      for (let i = 1; i < nextColumns.length; i += 1) {
        if (nextColumns[i].height < nextColumns[bestIndex].height) bestIndex = i
      }
      index = bestIndex
      if (id) itemIdToColumnIndex.set(id, index)
    }

    nextColumns[index].items.push(item)
    const itemHeight = estimateItemHeight(item, colWidth)
    nextColumns[index].height += itemHeight + ITEM_GAP_PX
  }

  columnsState.value = nextColumns.map((c) => {
    const heights = []
    const tops = []
    let y = 0

    for (const item of c.items) {
      tops.push(y)
      const h = estimateItemHeight(item, colWidth)
      heights.push(h)
      y += h + ITEM_GAP_PX
    }

    return {
      items: c.items,
      tops,
      heights,
      totalHeight: Math.max(0, y - ITEM_GAP_PX),
    }
  })
}

function findStartIndex(tops, y) {
  // First index whose start is <= y, i.e. last top <= y.
  let lo = 0
  let hi = tops.length - 1
  let best = 0

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (tops[mid] <= y) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return best
}

function findEndIndex(tops, heights, yEnd) {
  // First index whose start is >= yEnd, then step back one.
  let lo = 0
  let hi = tops.length - 1
  let firstGE = tops.length

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (tops[mid] >= yEnd) {
      firstGE = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }

  let end = Math.max(0, firstGE - 1)

  // Ensure the end includes any item whose box overlaps yEnd.
  while (end + 1 < tops.length && tops[end] + heights[end] + ITEM_GAP_PX < yEnd) {
    end += 1
  }

  return end
}

const visibleColumns = computed(() => {
  const cols = columnsState.value
  // In jsdom/tests, element sizing is often 0. Fall back to rendering all.
  if (viewportHeight.value <= 0) {
    return cols.map((c) => ({
      items: c.items,
      topPad: 0,
      bottomPad: 0,
      startIndex: 0,
      endIndex: Math.max(0, c.items.length - 1),
    }))
  }

  const startY = Math.max(0, scrollTop.value - props.overscanPx)
  const endY = scrollTop.value + viewportHeight.value + props.overscanPx

  return cols.map((c) => {
    if (!c.items.length) {
      return { items: [], topPad: 0, bottomPad: 0, startIndex: 0, endIndex: 0 }
    }

    const startIndex = findStartIndex(c.tops, startY)
    const endIndex = Math.min(c.items.length - 1, findEndIndex(c.tops, c.heights, endY))

    const topPad = c.tops[startIndex] ?? 0
    const lastTop = c.tops[endIndex] ?? 0
    const lastHeight = c.heights[endIndex] ?? 0
    const bottomStart = lastTop + lastHeight
    const bottomPad = Math.max(0, c.totalHeight - bottomStart)

    return {
      items: c.items.slice(startIndex, endIndex + 1),
      topPad,
      bottomPad,
      startIndex,
      endIndex,
    }
  })
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
    itemIdToColumnIndex = new Map()
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
  [columnCount, columnWidth],
  () => {
    // Resizing changes the number/size of columns; allow reassignment.
    itemIdToColumnIndex = new Map()
    rebuildColumns()
  },
  { immediate: true },
)

watch(
  // Performance note: this component targets very large arrays (e.g. 10k items).
  // Avoid deep watchers over items; rebuild layout only when the list structure
  // changes (new array reference or length change). This keeps metadata-only
  // updates (e.g. reactions) cheap.
  () => [itemsState.value, itemsState.value.length],
  () => rebuildColumns(),
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

      <div v-else class="flex gap-4">
        <div
          v-for="(col, colIndex) in visibleColumns"
          :key="colIndex"
          class="flex min-w-0 flex-1 flex-col gap-4"
        >
          <div v-if="col.topPad" :style="{ height: col.topPad + 'px' }" />
          <article
            v-for="item in col.items"
            :key="item.id"
            data-testid="item-card"
            class="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
          >
            <slot name="itemHeader" :item="item" :remove="() => removeItem(item)" />

            <div class="bg-slate-100" :style="{ aspectRatio: item.width + ' / ' + item.height }">
              <img
                v-if="item.type === 'image'"
                class="h-full w-full object-cover"
                :src="item.preview"
                :width="item.width"
                :height="item.height"
                loading="lazy"
                :alt="item.id"
              />

              <video
                v-else
                class="h-full w-full object-cover"
                :poster="item.preview"
                controls
                preload="metadata"
              >
                <source :src="item.original" type="video/mp4" />
              </video>
            </div>

            <slot name="itemFooter" :item="item" :remove="() => removeItem(item)">
              <div class="flex items-center justify-between gap-3 px-4 py-3">
                <span
                  class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                  {{ item.type }}
                </span>
                <span class="truncate font-mono text-xs text-slate-500">{{ item.id }}</span>
              </div>
            </slot>
          </article>
          <div v-if="col.bottomPad" :style="{ height: col.bottomPad + 'px' }" />
        </div>
      </div>

      <div class="mt-4 pb-2 text-center text-xs text-slate-600">
        <span v-if="isLoadingNext">Loading more…</span>
        <span v-else-if="nextPage == null">End of list</span>
        <span v-else>Scroll to load page {{ nextPage }}</span>
      </div>
    </div>
  </section>
</template>
