<script setup lang="ts">
import {
  masonryDefaults,
  type BackfillStats,
  type MasonryItemBase,
  type MasonryProps,
  type PageToken,
} from '@/masonry/types'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  useAttrs,
  useSlots,
  watch,
} from 'vue'

import { getColumnCount, getColumnWidth } from '@/masonry/layout'
import {
  clampDelayMs,
  clampPageSize,
  createBackfillBatchLoader,
  type BackfillStatsShape,
} from '@/masonry/backfill'
import { buildMasonryLayout, getVisibleIndicesFromBuckets } from '@/masonry/layoutEngine'

defineOptions({ inheritAttrs: false })

export type { BackfillStats, GetContentFn, GetContentResult, MasonryItemBase, MasonryMode, PageToken } from '@/masonry/types'

const props = withDefaults(defineProps<MasonryProps>(), masonryDefaults)

const emit = defineEmits<(e: 'update:items', items: MasonryItemBase[]) => void>()

const attrs = useAttrs()
const slots = useSlots()

const passthroughAttrs = computed(() => {
  // Avoid double-applying class by stripping it from v-bind.
  const { class: _class, ...rest } = attrs as Record<string, unknown>
  return rest
})

const scrollViewportRef = ref<HTMLElement | null>(null)

const containerWidth = ref(0)
const viewportHeight = ref(0)
const scrollTop = ref(0)
let resizeObserver: ResizeObserver | undefined

const gapX = computed(() => props.gapX)
const gapY = computed(() => props.gapY)

function getMeasuredContainerWidth(el: HTMLElement | null): number {
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
  if (headerHeight.value > 0) return { height: `${headerHeight.value}px` }
  return undefined
})

const footerStyle = computed(() => {
  if (footerHeight.value > 0) return { height: `${footerHeight.value}px` }
  return undefined
})

// Buffer at the bottom to ensure there's always enough scroll room to trigger
// loading the next page.
const SCROLL_BUFFER_PX = 200

// Bucketed index for virtualization.
const BUCKET_PX = 600

// Absolute-position masonry layout state. We keep arrays indexed by item index
// to avoid heavy map lookups during render.
const layoutPositions = ref<Array<{ x: number; y: number }>>([])
const layoutHeights = ref<number[]>([])
const layoutBuckets = ref<Map<number, number[]>>(new Map())
const layoutContentHeight = ref(0)
const layoutIndexById = ref<Map<string, number>>(new Map())

// Entry animation: items appear from above the masonry container.
// For an item with final (x,y), the first paint is at (x, y - height) and it
// animates to (x,y).
const CARD_MOTION_MS = 300
const enterStartIds = ref<Set<string>>(new Set())
const enterAnimatingIds = ref<Set<string>>(new Set())
const scheduledEnterIds = new Set<string>()

// Move + leave animations
const moveOffsets = ref<Map<string, { dx: number; dy: number }>>(new Map())
const moveTransitionIds = ref<Set<string>>(new Set())
const leavingClones = ref<
  Array<{
    id: string
    item: MasonryItemBase
    fromX: number
    fromY: number
    width: number
    height: number
    leaving: boolean
  }>
>([])

function getMoveOffset(id: string): { dx: number; dy: number } {
  const off = moveOffsets.value.get(id)
  return off ? off : { dx: 0, dy: 0 }
}

function getCardTransition(id: string): string | undefined {
  return enterAnimatingIds.value.has(id) || moveTransitionIds.value.has(id)
    ? `transform ${CARD_MOTION_MS}ms ease-out`
    : undefined
}

function getCardTransform(index: number): string {
  const item = itemsState.value[index]
  const id = item?.id

  const pos = layoutPositions.value[index] ?? { x: 0, y: 0 }
  const enterHeight = layoutHeights.value[index] ?? 0
  const enterOffset = enterHeight > 0 ? enterHeight : columnWidth.value
  const startX = pos.x
  const startY = id && enterStartIds.value.has(id) ? -enterOffset : pos.y
  const off = id ? getMoveOffset(id) : { dx: 0, dy: 0 }
  return `translate3d(${startX + off.dx}px,${startY + off.dy}px,0)`
}

function raf(cb: () => void) {
  const fn: (f: FrameRequestCallback) => number =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (f: FrameRequestCallback) => setTimeout(() => f(0), 0) as unknown as number
  fn(() => cb())
}

function raf2(cb: () => void) {
  raf(() => raf(cb))
}

function markEnterFromTop(items: MasonryItemBase[]) {
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

function snapshotVisiblePositions(): Map<string, { x: number; y: number }> {
  const oldPosById = new Map<string, { x: number; y: number }>()
  for (const vi of visibleIndices.value) {
    const it = itemsState.value[vi]
    const itId = it?.id
    if (!itId) continue
    const p = layoutPositions.value[vi]
    if (!p) continue
    oldPosById.set(itId, { x: p.x, y: p.y })
  }
  return oldPosById
}

function playFlipMoveAnimation(oldPosById: Map<string, { x: number; y: number }>, skipIds?: Set<string>) {
  if (!oldPosById.size) return

  const offsets = new Map<string, { dx: number; dy: number }>()
  const animIds: string[] = []

  for (const [itId, oldPos] of oldPosById.entries()) {
    if (skipIds?.has(itId)) continue
    const newIdx = layoutIndexById.value.get(itId)
    if (newIdx == null) continue
    const newPos = layoutPositions.value[newIdx]
    if (!newPos) continue
    const dx = oldPos.x - newPos.x
    const dy = oldPos.y - newPos.y
    if (dx || dy) {
      offsets.set(itId, { dx, dy })
      animIds.push(itId)
    }
  }

  if (!offsets.size) return

  // Invert (no transition): keep items visually at old positions.
  moveOffsets.value = offsets
  const withoutThese = new Set(moveTransitionIds.value)
  for (const mid of animIds) withoutThese.delete(mid)
  moveTransitionIds.value = withoutThese

  // Play: enable transition next frame, then clear offsets the following frame.
  raf(() => {
    moveTransitionIds.value = new Set([...moveTransitionIds.value, ...animIds])
    raf(() => {
      moveOffsets.value = new Map()
    })
  })

  setTimeout(() => {
    const next = new Set(moveTransitionIds.value)
    for (const mid of animIds) next.delete(mid)
    moveTransitionIds.value = next
  }, CARD_MOTION_MS)
}

const isLoadingInitial = ref(true)
const isLoadingNext = ref(false)
const error = ref('')

const pagesLoaded = ref<PageToken[]>([])
const internalItems = ref<MasonryItemBase[]>([])
const controlledItemsMirror = ref<MasonryItemBase[]>([])
const nextPage = ref<PageToken | null>(props.page)
const backfillBuffer = ref<MasonryItemBase[]>([])

let nextOriginalIndex = 0

function assignOriginalIndices(newItems: MasonryItemBase[]) {
  for (const it of newItems) {
    if (!it || typeof it !== 'object') continue
    if (!it.id) continue
    if (it.originalIndex != null) continue
    it.originalIndex = nextOriginalIndex
    nextOriginalIndex += 1
  }
}

const removedPoolById = new Map<string, MasonryItemBase>()
const removalHistory: string[][] = []

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function insertItemsByOriginalIndex(
  current: MasonryItemBase[],
  itemsToInsert: MasonryItemBase[]
): MasonryItemBase[] {
  if (!itemsToInsert.length) return current

  const existingIds = new Set<string>()
  for (const it of current) {
    const id = it?.id
    if (id) existingIds.add(id)
  }

  const uniqueToInsert: MasonryItemBase[] = []
  for (const it of itemsToInsert) {
    const id = it?.id
    if (!id) continue
    if (existingIds.has(id)) continue
    uniqueToInsert.push(it)
    existingIds.add(id)
  }

  if (!uniqueToInsert.length) return current

  const sorted = uniqueToInsert.slice().sort((a, b) => {
    const ao = isFiniteNumber(a.originalIndex) ? a.originalIndex : Number.POSITIVE_INFINITY
    const bo = isFiniteNumber(b.originalIndex) ? b.originalIndex : Number.POSITIVE_INFINITY
    return ao - bo
  })

  const next = current.slice()
  for (const it of sorted) {
    const oi = it.originalIndex
    if (!isFiniteNumber(oi)) {
      next.push(it)
      continue
    }

    // Insert after the last item with originalIndex <= oi.
    let lo = 0
    let hi = next.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      const midOi = next[mid]?.originalIndex
      const midVal = isFiniteNumber(midOi) ? midOi : Number.POSITIVE_INFINITY
      if (midVal <= oi) lo = mid + 1
      else hi = mid
    }
    next.splice(lo, 0, it)
  }

  return next
}

async function restoreItems(itemsToRestore: MasonryItemBase[]) {
  if (!itemsToRestore.length) return

  // Animate restored cards the same way as new appends.
  markEnterFromTop(itemsToRestore)

  // Snapshot current positions for FLIP move animation.
  const oldPosById = snapshotVisiblePositions()

  itemsState.value = insertItemsByOriginalIndex(itemsState.value, itemsToRestore)

  // Wait for Vue + layout watcher to apply the new layout/indices.
  await nextTick()

  // Move existing items smoothly into their new positions.
  playFlipMoveAnimation(oldPosById)
}

async function restoreRemoved(itemsOrIds: string | MasonryItemBase | Array<string | MasonryItemBase>) {
  const raw = Array.isArray(itemsOrIds) ? itemsOrIds : [itemsOrIds]
  const ids = raw.map(toId).filter(Boolean)
  if (!ids.length) return

  const items: MasonryItemBase[] = []
  for (const id of ids as string[]) {
    const it = removedPoolById.get(id)
    if (!it) continue
    items.push(it)
  }
  if (!items.length) return

  await restoreItems(items)

  for (const it of items) {
    if (it?.id) removedPoolById.delete(it.id)
  }
}

async function undoLastRemoval() {
  const last = removalHistory.pop()
  if (!last?.length) return

  const items: MasonryItemBase[] = []
  for (const id of last) {
    const it = removedPoolById.get(id)
    if (!it) continue
    items.push(it)
  }
  if (!items.length) return

  await restoreItems(items)

  for (const it of items) {
    if (it?.id) removedPoolById.delete(it.id)
  }
}

async function restore(itemsOrIds: string | MasonryItemBase | Array<string | MasonryItemBase>) {
  return restoreRemoved(itemsOrIds)
}

async function undo() {
  return undoLastRemoval()
}

const backfillStats = shallowRef<BackfillStats>({
  enabled: false,
  isBackfillActive: false,
  isRequestInFlight: false,
  requestPage: null,
  progress: {
    collected: 0,
    target: 0,
  },
  cooldownMsRemaining: 0,
  cooldownMsTotal: 2000,
  pageSize: 20,
  bufferSize: 0,
  lastBatch: null,
  totals: {
    pagesFetched: 0,
    itemsFetchedFromNetwork: 0,
  },
})

const backfillLoader = createBackfillBatchLoader<MasonryItemBase, PageToken>({
  getContent: (pageToken) => props.getContent(pageToken),
  markEnterFromLeft: markEnterFromTop,
  buffer: backfillBuffer,
  stats: backfillStats as unknown as typeof backfillStats & {
    value: BackfillStatsShape<PageToken>
  },
  isEnabled: () => props.mode === 'backfill',
  getPageSize: () => props.pageSize,
  getRequestDelayMs: () => props.backfillRequestDelayMs,
})

const isItemsControlled = computed(() => props.items !== undefined)

watch(
  () => props.items,
  (next) => {
    if (!isItemsControlled.value) return
    controlledItemsMirror.value = Array.isArray(next) ? next : []
  },
  { immediate: true }
)

const itemsState = computed({
  get() {
    return isItemsControlled.value ? controlledItemsMirror.value : internalItems.value
  },
  set(next: MasonryItemBase[]) {
    if (isItemsControlled.value) {
      controlledItemsMirror.value = next
      emit('update:items', next)
    } else {
      internalItems.value = next
    }
  },
})


async function loadDefaultPage(pageToLoad: PageToken) {
  const result = await props.getContent(pageToLoad)
  assignOriginalIndices(result.items)
  markEnterFromTop(result.items)
  return { items: result.items, nextPage: result.nextPage }
}

function toId(itemOrId: string | MasonryItemBase | null | undefined): string | null {
  if (!itemOrId) return null
  return typeof itemOrId === 'string' ? itemOrId : itemOrId?.id
}

async function removeItems(itemsOrIds: string | MasonryItemBase | Array<string | MasonryItemBase>) {
  const raw = Array.isArray(itemsOrIds) ? itemsOrIds : [itemsOrIds]
  const ids = raw.map(toId).filter(Boolean)
  if (!ids.length) return

  const removeSet = new Set(ids as string[])

  // Track removed items (as a batch) so callers can undo/restore.
  const batchIds: string[] = []
  for (const id of removeSet) {
    const idx = layoutIndexById.value.get(id)
    if (idx == null) continue
    const item = itemsState.value[idx]
    if (!item) continue
    removedPoolById.set(id, item)
    batchIds.push(id)
  }
  if (batchIds.length) removalHistory.push(batchIds)

  // Snapshot positions for the currently rendered subset.
  const oldPosById = snapshotVisiblePositions()

  // Render clones for removed items that are currently in layout.
  const width = columnWidth.value
  const clones: Array<{
    id: string
    item: MasonryItemBase
    fromX: number
    fromY: number
    width: number
    height: number
    leaving: boolean
  }> = []
  for (const id of removeSet) {
    const idx = layoutIndexById.value.get(id)
    if (idx == null) continue
    const item = itemsState.value[idx]
    if (!item) continue
    const pos = layoutPositions.value[idx] ?? { x: 0, y: 0 }
    const height = layoutHeights.value[idx] ?? width
    clones.push({
      id,
      item,
      fromX: pos.x,
      fromY: pos.y,
      width,
      height,
      leaving: true,
    })
  }
  if (clones.length) leavingClones.value = [...leavingClones.value, ...clones]

  // Remove from data in one pass so remaining items compute their new layout.
  itemsState.value = itemsState.value.filter((it) => {
    const id = it?.id
    return !id || !removeSet.has(id)
  })

  // Wait for Vue + layout watcher to apply the new layout/indices.
  await nextTick()

  // Animate remaining items into place (FLIP).
  playFlipMoveAnimation(oldPosById, removeSet)

  if (clones.length) {
    const cloneIds = new Set(clones.map((c) => c.id))
    // Trigger leave transition on the clones, then remove them.
    raf(() => {
      leavingClones.value = leavingClones.value.map((c) =>
        cloneIds.has(c.id) ? { ...c, leaving: false } : c
      )
      setTimeout(() => {
        leavingClones.value = leavingClones.value.filter((c) => !cloneIds.has(c.id))
      }, CARD_MOTION_MS)
    })
  }
}

async function removeItem(itemOrId: string | MasonryItemBase) {
  return removeItems(itemOrId)
}

defineExpose({
  remove: removeItems,
  restore,
  undo,
  // Aliases (kept for now; can be removed if you want strictly short API only).
  restoreRemoved,
  undoLastRemoval,
  backfillStats,
})

function rebuildLayout() {
  const next = buildMasonryLayout<MasonryItemBase>({
    items: itemsState.value,
    columnCount: columnCount.value,
    columnWidth: columnWidth.value,
    gapX: gapX.value,
    gapY: gapY.value,
    headerHeight: headerHeight.value,
    footerHeight: footerHeight.value,
    bucketPx: BUCKET_PX,
  })

  layoutPositions.value = next.positions
  layoutHeights.value = next.heights
  layoutBuckets.value = next.buckets
  layoutContentHeight.value = next.contentHeight
  layoutIndexById.value = next.indexById
}

const containerHeight = computed(() => {
  const base = Math.max(layoutContentHeight.value, viewportHeight.value)
  return base + SCROLL_BUFFER_PX
})

const visibleIndices = computed<number[]>(() => {
  return getVisibleIndicesFromBuckets({
    itemCount: itemsState.value.length,
    viewportHeight: viewportHeight.value,
    scrollTop: scrollTop.value,
    overscanPx: props.overscanPx,
    bucketPx: BUCKET_PX,
    buckets: layoutBuckets.value,
  })
})

watch(
  visibleIndices,
  (indices) => {
    if (!indices?.length) return

    const idsToSchedule: string[] = []
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
      }, CARD_MOTION_MS)
    })
  },
  { flush: 'post' }
)

async function loadNextPage() {
  if (isLoadingInitial.value || isLoadingNext.value) return
  if (props.mode !== 'backfill' && nextPage.value == null) return
  if (props.mode === 'backfill' && nextPage.value == null && backfillBuffer.value.length === 0) {
    return
  }

  try {
    isLoadingNext.value = true
    error.value = ''

    if (props.mode === 'backfill') {
      const result = await backfillLoader.loadBackfillBatch(nextPage.value)
      if (result.pages.length) pagesLoaded.value = [...pagesLoaded.value, ...result.pages]
      assignOriginalIndices(result.batchItems)
      itemsState.value = [...itemsState.value, ...result.batchItems]
      nextPage.value = result.nextPage
      return
    }

    const pageToLoad = nextPage.value
    if (pageToLoad == null) return

    const result = await loadDefaultPage(pageToLoad)
    pagesLoaded.value = [...pagesLoaded.value, pageToLoad]
    assignOriginalIndices(result.items)
    itemsState.value = [...itemsState.value, ...result.items]
    nextPage.value = result.nextPage
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    isLoadingNext.value = false
  }
}

function maybeLoadMoreOnScroll() {
  const el = scrollViewportRef.value
  if (!el) return

  scrollTop.value = el.scrollTop
  viewportHeight.value = el.clientHeight

  const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
  if (distanceFromBottom <= props.prefetchThresholdPx) {
    void loadNextPage()
  }
}

function getViewportEl(): HTMLElement | null {
  return scrollViewportRef.value
}

function syncViewportMeasures(el: HTMLElement) {
  containerWidth.value = getMeasuredContainerWidth(el)
  viewportHeight.value = el.clientHeight
}

function setupResizeObserver() {
  if (typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver(() => {
    const el = getViewportEl()
    if (!el) return
    syncViewportMeasures(el)
  })
}

function makeInitialBackfillStats(): BackfillStats {
  return {
    enabled: props.mode === 'backfill',
    isBackfillActive: false,
    isRequestInFlight: false,
    requestPage: null,
    progress: {
      collected: 0,
      target: 0,
    },
    cooldownMsRemaining: 0,
    cooldownMsTotal: clampDelayMs(props.backfillRequestDelayMs),
    pageSize: clampPageSize(props.pageSize),
    bufferSize: 0,
    lastBatch: null,
    totals: {
      pagesFetched: 0,
      itemsFetchedFromNetwork: 0,
    },
  }
}

function resetFeedState(startPage: PageToken) {
  nextOriginalIndex = 0
  removedPoolById.clear()
  removalHistory.length = 0
  pagesLoaded.value = []
  itemsState.value = []
  nextPage.value = startPage
  backfillBuffer.value = []
  backfillStats.value = makeInitialBackfillStats()
  isLoadingInitial.value = true
  isLoadingNext.value = false
  error.value = ''
}

async function loadFirstPage(startPage: PageToken) {
  try {
    if (props.mode === 'backfill') {
      const result = await backfillLoader.loadBackfillBatch(startPage)
      pagesLoaded.value = result.pages.length ? result.pages : [startPage]
      assignOriginalIndices(result.batchItems)
      itemsState.value = result.batchItems
      nextPage.value = result.nextPage
    } else {
      const result = await loadDefaultPage(startPage)
      pagesLoaded.value = [startPage]
      assignOriginalIndices(result.items)
      itemsState.value = result.items
      nextPage.value = result.nextPage
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    isLoadingInitial.value = false
  }
}

function connectViewport() {
  const el = getViewportEl()
  if (!el) return
  syncViewportMeasures(el)
  scrollTop.value = el.scrollTop
  resizeObserver?.observe(el)
}

onMounted(async () => {
  setupResizeObserver()
  resetFeedState(props.page)
  await loadFirstPage(props.page)
  await nextTick()
  connectViewport()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(
  () => props.page,
  async (newPage) => {
    // If the starting page changes, restart the feed.
    resetFeedState(newPage)
    await loadFirstPage(newPage)
  }
)

watch(
  gapX,
  () => {
    const el = scrollViewportRef.value
    if (!el) return
    containerWidth.value = getMeasuredContainerWidth(el)
  },
  { immediate: false }
)

const columnCount = computed(() => getColumnCount(containerWidth.value, props.itemWidth))
const columnWidth = computed(() =>
  getColumnWidth(containerWidth.value, columnCount.value, props.itemWidth, gapX.value)
)

watch(
  [columnCount, columnWidth, gapX, gapY, headerHeight, footerHeight],
  () => {
    rebuildLayout()
  },
  { immediate: true }
)

watch(
  // Performance note: this component targets very large arrays (e.g. 10k items).
  // Avoid deep watchers over items; rebuild layout only when the list structure
  // changes (new array reference or length change). This keeps metadata-only
  // updates (e.g. reactions) cheap.
  () => [itemsState.value, itemsState.value.length],
  () => rebuildLayout(),
  { immediate: true }
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
    <div
      ref="scrollViewportRef"
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
            transition: 'transform ' + CARD_MOTION_MS + 'ms ease-out',
            transform: c.leaving
              ? 'translate3d(' + c.fromX + 'px,' + c.fromY + 'px,0)'
              : 'translate3d(' + c.fromX + 'px,' + -c.height + 'px,0)',
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
