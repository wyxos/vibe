<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useAttrs, useSlots, watch } from 'vue'

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
  headerHeight: {
    type: Number,
    default: 0,
  },
  footerHeight: {
    type: Number,
    default: 0,
  },
  overscanPx: {
    type: Number,
    default: 600,
  },
})

const emit = defineEmits(['update:items'])

const attrs = useAttrs()
const slots = useSlots()

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

function getMeasuredContainerWidth(el) {
  if (!el) return 0
  const pr = Math.max(0, gapX.value)
  // clientWidth includes padding but excludes scrollbar. Subtract padding-right
  // so layout math uses the true content width.
  return Math.max(0, el.clientWidth - pr)
}

const headerHeight = computed(() => props.headerHeight)
const footerHeight = computed(() => props.footerHeight)

const hasHeaderSlot = computed(() => Boolean(slots.itemHeader))
const hasFooterSlot = computed(() => Boolean(slots.itemFooter))

const headerStyle = computed(() => {
  if (headerHeight.value > 0) return { height: headerHeight.value + 'px' }
  return undefined
})

const footerStyle = computed(() => {
  if (footerHeight.value > 0) return { height: footerHeight.value + 'px' }
  return undefined
})

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
const layoutIndexById = ref(new Map())

// Entry animation: items appear from the left edge of the masonry container.
// For an item with final (x,y), the first paint is at (-width, y) and it
// animates to (x,y).
const ENTER_FROM_LEFT_MS = 300
const enterStartIds = ref(new Set())
const enterAnimatingIds = ref(new Set())
const scheduledEnterIds = new Set()

// Move + leave animations
const moveOffsets = ref(new Map())
const moveAnimatingIds = ref(new Set())
const leavingClones = ref([])

function getMoveOffset(id) {
  const off = moveOffsets.value.get(id)
  return off ? off : { dx: 0, dy: 0 }
}

function getCardTransition(id) {
  return (enterAnimatingIds.value.has(id) || moveAnimatingIds.value.has(id))
    ? 'transform ' + ENTER_FROM_LEFT_MS + 'ms ease-out'
    : undefined
}

function getCardTransform(index) {
  const item = itemsState.value[index]
  const id = item?.id

  const pos = layoutPositions.value[index] ?? { x: 0, y: 0 }
  const baseX = id && enterStartIds.value.has(id) ? -columnWidth.value : pos.x
  const baseY = pos.y
  const off = id ? getMoveOffset(id) : { dx: 0, dy: 0 }
  return (
    'translate3d(' + baseX + 'px,' + baseY + 'px,0) ' +
    'translate3d(' + off.dx + 'px,' + off.dy + 'px,0)'
  )
}

function raf(cb) {
  const fn = typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : (f) => setTimeout(f, 0)
  fn(cb)
}

function raf2(cb) {
  raf(() => raf(cb))
}

function markEnterFromLeft(items) {
  if (!Array.isArray(items) || items.length === 0) return
  const next = new Set(enterStartIds.value)
  let changed = false
  for (const it of items) {
    const id = it?.id
    if (!id) continue
    if (!next.has(id)) {
      next.add(id)
      changed = true
    }
  }
  if (changed) enterStartIds.value = next
}

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

  const idx = layoutIndexById.value.get(id)
  if (idx == null) {
    itemsState.value = itemsState.value.filter((it) => it?.id !== id)
    return
  }

  const item = itemsState.value[idx]
  const pos = layoutPositions.value[idx] ?? { x: 0, y: 0 }
  const width = columnWidth.value

  // Snapshot positions for the currently rendered subset.
  const oldPosById = new Map()
  for (const vi of visibleIndices.value) {
    const it = itemsState.value[vi]
    const itId = it?.id
    if (!itId) continue
    const p = layoutPositions.value[vi]
    if (!p) continue
    oldPosById.set(itId, { x: p.x, y: p.y })
  }

  // Render a clone at the current position, then animate it left out of view.
  leavingClones.value = [
    ...leavingClones.value,
    {
      id,
      item,
      fromX: pos.x,
      fromY: pos.y,
      width,
      leaving: true,
    },
  ]

  // Remove from data immediately so remaining items compute their new layout.
  itemsState.value = itemsState.value.filter((it) => it?.id !== id)

  // Animate remaining items into place (FLIP).
  raf2(() => {
    const offsets = new Map()
    const animIds = new Set()

    for (const [itId, oldPos] of oldPosById.entries()) {
      if (itId === id) continue
      const newIdx = layoutIndexById.value.get(itId)
      if (newIdx == null) continue
      const newPos = layoutPositions.value[newIdx]
      if (!newPos) continue
      const dx = oldPos.x - newPos.x
      const dy = oldPos.y - newPos.y
      if (dx || dy) {
        offsets.set(itId, { dx, dy })
        animIds.add(itId)
      }
    }

    if (!offsets.size) return

    moveOffsets.value = offsets
    moveAnimatingIds.value = animIds

    raf(() => {
      // Drop offsets so transition animates to 0.
      moveOffsets.value = new Map()
      setTimeout(() => {
        const next = new Set(moveAnimatingIds.value)
        for (const itId of animIds) next.delete(itId)
        moveAnimatingIds.value = next
      }, ENTER_FROM_LEFT_MS)
    })
  })

  // Trigger leave transition on the clone, then remove it.
  raf(() => {
    leavingClones.value = leavingClones.value.map((c) => (c.id === id ? { ...c, leaving: false } : c))
    setTimeout(() => {
      leavingClones.value = leavingClones.value.filter((c) => c.id !== id)
    }, ENTER_FROM_LEFT_MS)
  })
}

defineExpose({
  remove: removeItem,
})

function rebuildLayout() {
  const count = columnCount.value
  const colWidth = columnWidth.value
  const gx = gapX.value
  const gy = gapY.value
  const hh = headerHeight.value
  const fh = footerHeight.value

  const colHeights = Array.from({ length: count }, () => 0)
  const positions = new Array(itemsState.value.length)
  const heights = new Array(itemsState.value.length)
  const buckets = new Map()
  const indexById = new Map()

  let maxY = 0

  // Sequential placement into the shortest column gives a masonry layout while
  // preserving a single DOM sequence (no re-parenting on removal).
  for (let index = 0; index < itemsState.value.length; index += 1) {
    const item = itemsState.value[index]
    if (item?.id) indexById.set(item.id, index)

    let bestCol = 0
    for (let c = 1; c < colHeights.length; c += 1) {
      if (colHeights[c] < colHeights[bestCol]) bestCol = c
    }

    const x = bestCol * (colWidth + gx)
    const y = colHeights[bestCol]
    const h = estimateItemHeight(item, colWidth) + hh + fh

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
  layoutIndexById.value = indexById
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

watch(
  visibleIndices,
  (indices) => {
    if (!indices?.length) return

    const idsToSchedule = []
    for (const idx of indices) {
      const id = itemsState.value[idx]?.id
      if (!id) continue
      if (!enterStartIds.value.has(id)) continue
      if (scheduledEnterIds.has(id)) continue
      scheduledEnterIds.add(id)
      idsToSchedule.push(id)
    }

    if (!idsToSchedule.length) return

    // 1) ensure transition is enabled in its own frame
    raf(() => {
      const next = new Set(enterAnimatingIds.value)
      for (const id of idsToSchedule) next.add(id)
      enterAnimatingIds.value = next
    })

    // 2) then move from start -> final position (transition applies)
    raf2(() => {
      const nextStart = new Set(enterStartIds.value)
      for (const id of idsToSchedule) nextStart.delete(id)
      enterStartIds.value = nextStart

      setTimeout(() => {
        const nextAnimating = new Set(enterAnimatingIds.value)
        for (const id of idsToSchedule) {
          nextAnimating.delete(id)
          scheduledEnterIds.delete(id)
        }
        enterAnimatingIds.value = nextAnimating
      }, ENTER_FROM_LEFT_MS)
    })
  },
  { flush: 'post' },
)

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
    markEnterFromLeft(result.items)
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
      containerWidth.value = getMeasuredContainerWidth(el)
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
    markEnterFromLeft(result.items)
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
    containerWidth.value = getMeasuredContainerWidth(el)
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
      markEnterFromLeft(result.items)
      itemsState.value = result.items
      nextPage.value = result.nextPage
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      isLoadingInitial.value = false
    }
  },
)

watch(
  gapX,
  () => {
    const el = scrollContainerEl.value
    if (!el) return
    containerWidth.value = getMeasuredContainerWidth(el)
  },
  { immediate: false },
)

const columnCount = computed(() => getColumnCount(containerWidth.value, props.itemWidth))
const columnWidth = computed(() =>
  getColumnWidth(containerWidth.value, columnCount.value, props.itemWidth, gapX.value),
)

watch(
  [columnCount, columnWidth, gapX, gapY, headerHeight, footerHeight],
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
      :style="{ paddingRight: gapX + 'px' }"
      @scroll="maybeLoadMoreOnScroll"
    >
      <div v-if="isLoadingInitial" class="flex h-full items-center justify-center">
        <div class="inline-flex items-center gap-3 text-sm text-slate-600">
          <svg
            class="h-5 w-5 animate-spin text-slate-500"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
          <span>Loading…</span>
        </div>
      </div>
      <p v-else-if="error" class="text-sm font-medium text-red-700">Error: {{ error }}</p>

      <div v-else class="relative" :style="{ height: containerHeight + 'px' }">
        <article
          v-for="idx in visibleIndices"
          :key="itemsState[idx].id"
          data-testid="item-card"
          class="absolute overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
          :style="{
            width: columnWidth + 'px',
            transition: getCardTransition(itemsState[idx].id),
            transform: getCardTransform(idx),
          }"
        >
          <div
            v-if="hasHeaderSlot || headerHeight > 0"
            data-testid="item-header-container"
            class="w-full"
            :style="headerStyle"
          >
            <slot name="itemHeader" :item="itemsState[idx]" :remove="() => removeItem(itemsState[idx])" />
          </div>

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

          <div
            v-if="hasFooterSlot || footerHeight > 0"
            data-testid="item-footer-container"
            class="w-full"
            :style="footerStyle"
          >
            <slot name="itemFooter" :item="itemsState[idx]" :remove="() => removeItem(itemsState[idx])"></slot>
          </div>
        </article>

        <article
          v-for="c in leavingClones"
          :key="c.id + ':leaving'"
          data-testid="item-card-leaving"
          class="pointer-events-none absolute overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
          :style="{
            width: c.width + 'px',
            transition: 'transform ' + ENTER_FROM_LEFT_MS + 'ms ease-out',
            transform: c.leaving
              ? 'translate3d(' + c.fromX + 'px,' + c.fromY + 'px,0)'
              : 'translate3d(' + -c.width + 'px,' + c.fromY + 'px,0)',
          }"
        >
          <div
            v-if="hasHeaderSlot || headerHeight > 0"
            data-testid="item-header-container"
            class="w-full"
            :style="headerStyle"
          >
            <slot name="itemHeader" :item="c.item" :remove="() => {}" />
          </div>

          <div
            class="bg-slate-100"
            :style="{ aspectRatio: c.item.width + ' / ' + c.item.height }"
          >
            <img
              v-if="c.item.type === 'image'"
              class="h-full w-full object-cover"
              :src="c.item.preview"
              :width="c.item.width"
              :height="c.item.height"
              loading="lazy"
              :alt="c.item.id"
            />

            <video
              v-else
              class="h-full w-full object-cover"
              :poster="c.item.preview"
              controls
              preload="metadata"
            >
              <source :src="c.item.original" type="video/mp4" />
            </video>
          </div>

          <div
            v-if="hasFooterSlot || footerHeight > 0"
            data-testid="item-footer-container"
            class="w-full"
            :style="footerStyle"
          >
            <slot name="itemFooter" :item="c.item" :remove="() => {}"></slot>
          </div>
        </article>
      </div>

      <div class="mt-4 pb-2 text-center text-xs text-slate-600">
        <span v-if="isLoadingNext" class="inline-flex items-center justify-center gap-2">
          <svg
            class="h-4 w-4 animate-spin text-slate-500"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
          <span>Loading more…</span>
        </span>
        <span v-else-if="nextPage == null">End of list</span>
        <span v-else>Scroll to load page {{ nextPage }}</span>
      </div>
    </div>
  </section>
</template>
