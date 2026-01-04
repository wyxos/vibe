<script setup lang="ts">
/* eslint-disable max-lines */
import {
  masonryDefaults,
  type BackfillStats,
  type MasonryRestoredPages,
  type MasonryItemBase,
  type MasonryProps,
  type PageToken,
} from '@/masonry/types'
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  useAttrs,
  provide,
  watch,
} from 'vue'

import MasonryLoader from '@/components/MasonryLoader.vue'
import {
  masonryItemRegistryKey,
  type MasonryItemDefinition,
  type MasonryItemSlotProps,
} from '@/components/masonryItemRegistry'

import { getColumnCount, getColumnWidth } from '@/masonry/layout'
import {
  clampDelayMs,
  clampPageSize,
  createBackfillBatchLoader,
  type BackfillStatsShape,
} from '@/masonry/backfill'
import { buildMasonryLayout, getVisibleIndicesFromBuckets } from '@/masonry/layoutEngine'

defineOptions({ inheritAttrs: false })

export type {
  BackfillStats,
  GetContentFn,
  GetContentResult,
  MasonryItemBase,
  MasonryMode,
  MasonryRestoredPages,
  PageToken,
} from '@/masonry/types'

const props = withDefaults(defineProps<MasonryProps>(), masonryDefaults)

const emit = defineEmits<{
  (e: 'update:items', items: MasonryItemBase[]): void
  (e: 'preloaded', items: MasonryItemBase[]): void
  (e: 'failures', payloads: Array<{ item: MasonryItemBase; error: unknown }>): void
}>()

const attrs = useAttrs()

const SlotRenderer = defineComponent({
  name: 'SlotRenderer',
  props: {
    slotFn: {
      type: Function,
      required: false,
    },
    slotProps: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const fn = props.slotFn as ((p: unknown) => unknown) | undefined
      return fn ? (fn(props.slotProps) as unknown) : null
    }
  },
})

const masonryItemDefinition = shallowRef<MasonryItemDefinition | null>(null)

provide(masonryItemRegistryKey, (definition: MasonryItemDefinition) => {
  if (masonryItemDefinition.value) {
    if (import.meta.env.DEV) {
      console.warn('[Masonry] Only one <MasonryItem> definition is supported.')
    }
    return
  }
  masonryItemDefinition.value = definition
})

const PRELOAD_BATCH_DEBOUNCE_MS = 100
const pendingPreloadedItems: MasonryItemBase[] = []
const pendingFailurePayloads: Array<{ item: MasonryItemBase; error: unknown }> = []
let flushPreloadedTimer: ReturnType<typeof setTimeout> | null = null
let flushFailuresTimer: ReturnType<typeof setTimeout> | null = null

function flushPreloaded() {
  if (!pendingPreloadedItems.length) return
  const batch = pendingPreloadedItems.splice(0, pendingPreloadedItems.length)
  emit('preloaded', batch)
}

function flushFailures() {
  if (!pendingFailurePayloads.length) return
  const batch = pendingFailurePayloads.splice(0, pendingFailurePayloads.length)
  emit('failures', batch)
}

function scheduleFlushPreloaded() {
  if (flushPreloadedTimer) return
  flushPreloadedTimer = setTimeout(() => {
    flushPreloadedTimer = null
    flushPreloaded()
  }, PRELOAD_BATCH_DEBOUNCE_MS)
}

function scheduleFlushFailures() {
  if (flushFailuresTimer) return
  flushFailuresTimer = setTimeout(() => {
    flushFailuresTimer = null
    flushFailures()
  }, PRELOAD_BATCH_DEBOUNCE_MS)
}

function handleItemPreloaded(item: MasonryItemBase) {
  masonryItemDefinition.value?.onPreloaded?.(item)
  pendingPreloadedItems.push(item)
  scheduleFlushPreloaded()
}

function handleItemFailed(payload: { item: MasonryItemBase; error: unknown }) {
  masonryItemDefinition.value?.onFailed?.(payload)
  pendingFailurePayloads.push(payload)
  scheduleFlushFailures()
}

onMounted(() => {
  if (!masonryItemDefinition.value) {
    throw new Error('[Masonry] Missing <MasonryItem> definition. Add <MasonryItem> as a child of <Masonry>.')
  }
})

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

const itemHeaderSlotFn = computed(() => masonryItemDefinition.value?.header)
const itemLoaderSlotFn = computed(() => masonryItemDefinition.value?.loader)
const itemFooterSlotFn = computed(() => masonryItemDefinition.value?.footer)
const itemOverlaySlotFn = computed(() => masonryItemDefinition.value?.overlay)
const itemErrorSlotFn = computed(() => masonryItemDefinition.value?.error)

const hasHeaderSlot = computed(() => Boolean(itemHeaderSlotFn.value))
const hasFooterSlot = computed(() => Boolean(itemFooterSlotFn.value))
const hasOverlaySlot = computed(() => Boolean(itemOverlaySlotFn.value))

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

// Motion timings
const CARD_MOTION_MS = 300
const ENTER_MOTION_MS = 600
const LEAVE_MOTION_MS = 600

function getOutsideViewportBottomY(height: number): number {
  const h = typeof height === 'number' && Number.isFinite(height) ? height : 0
  // Anchor enter animations to the viewport bottom, not the total content height.
  // In resume mode the content can be very tall, which would otherwise make
  // the enter distance huge and the animation look unnaturally fast.
  const viewportBottomY = scrollTop.value + viewportHeight.value
  return viewportBottomY + Math.max(0, h)
}
const enterStartIds = ref<Set<string>>(new Set())
const enterAnimatingIds = ref<Set<string>>(new Set())
const scheduledEnterIds = new Set<string>()
const enterDelayById = ref<Map<string, number>>(new Map())

const MAX_ENTER_STAGGER_TOTAL_MS = 400

function clampEnterStaggerMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0
  return Math.max(0, Math.min(250, ms))
}

function getCardTransitionDelay(id: string): string | undefined {
  if (!enterAnimatingIds.value.has(id)) return undefined
  const d = enterDelayById.value.get(id) ?? 0
  if (d <= 0) return undefined
  return `${d}ms`
}

// Move + leave animations
const moveOffsets = ref<Map<string, { dx: number; dy: number }>>(new Map())
const moveTransitionIds = ref<Set<string>>(new Set())
const leavingClones = ref<
  Array<{
    id: string
    item: MasonryItemBase
    fromX: number
    fromY: number
    toY: number
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
  if (enterAnimatingIds.value.has(id)) return `transform ${ENTER_MOTION_MS}ms ease-out`
  if (moveTransitionIds.value.has(id)) return `transform ${CARD_MOTION_MS}ms ease-out`
  return undefined
}

function getCardTransform(index: number): string {
  const item = itemsState.value[index]
  const id = item?.id

  const pos = layoutPositions.value[index] ?? { x: 0, y: 0 }
  const enterHeight = layoutHeights.value[index] ?? 0
  const enterOffset = enterHeight > 0 ? enterHeight : columnWidth.value
  const startX = pos.x
  const startY = id && enterStartIds.value.has(id) ? getOutsideViewportBottomY(enterOffset) : pos.y
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

const warnedInvalidDimensionsById = new Set<string>()

function isValidDimension(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0
}

function markEnterFromTop(items: MasonryItemBase[]) {
  if (!Array.isArray(items) || items.length === 0) return
  const next = new Set(enterStartIds.value)
  let changed = false
  for (const it of items) {
    const id = it?.id
    if (!id) continue

    // Diagnostics: warn once per malformed item.
    if (!warnedInvalidDimensionsById.has(id)) {
      const w = (it as MasonryItemBase | undefined)?.width
      const h = (it as MasonryItemBase | undefined)?.height
      if (!isValidDimension(w) || !isValidDimension(h)) {
        warnedInvalidDimensionsById.add(id)
        console.warn(
          `[Masonry] Item "${id}" has invalid dimensions (width=${String(w)}, height=${String(
            h
          )}); layout expects { id, width, height }.`
        )
      }
    }

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

// Network resilience
// Retry policy: retry up to 5 times with linear backoff 1s..5s.
// (Total attempts: 1 initial + up to 5 retries)
const MAX_GETCONTENT_RETRIES = 5
const BASE_RETRY_DELAY_MS = 1000

let feedGeneration = 0

let lastPrefetchScrollTop = 0
let lastPrefetchScrollHeight = 0

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError'
}

function abortError(): Error {
  const e = new Error('aborted')
  e.name = 'AbortError'
  return e
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getContentWithRetry(pageToken: PageToken, generation: number) {
  let retry = 0
  while (true) {
    if (generation !== feedGeneration) throw abortError()
    try {
      return await props.getContent(pageToken)
    } catch (err) {
      if (generation !== feedGeneration) throw abortError()
      if (retry >= MAX_GETCONTENT_RETRIES) throw err
      retry += 1
      await sleep(retry * BASE_RETRY_DELAY_MS)
    }
  }
}

const pagesLoaded = ref<PageToken[]>([])
const internalItems = ref<MasonryItemBase[]>([])
const controlledItemsMirror = ref<MasonryItemBase[]>([])
const nextPage = ref<PageToken | null>(props.page)
const backfillBuffer = ref<MasonryItemBase[]>([])

let loadNextInFlight: Promise<void> | null = null
let loadFirstInFlight: Promise<void> | null = null

let nextOriginalIndex = 0

function syncNextOriginalIndexFromItems(list: MasonryItemBase[]) {
  let max = -1
  for (const it of list) {
    const oi = it?.originalIndex
    if (isFiniteNumber(oi) && oi > max) max = oi
  }
  nextOriginalIndex = max + 1
}

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

async function restore(itemsOrIds: string | MasonryItemBase | Array<string | MasonryItemBase>) {
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

async function undo() {
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

function forget(itemsOrIds: string | MasonryItemBase | Array<string | MasonryItemBase>) {
  const raw = Array.isArray(itemsOrIds) ? itemsOrIds : [itemsOrIds]
  const ids = raw.map(toId).filter(Boolean) as string[]
  if (!ids.length) return

  const idSet = new Set(ids)

  // Remove from the restore pool.
  for (const id of idSet) removedPoolById.delete(id)

  // Remove from undo history (so undo can't resurrect committed removals).
  for (let i = removalHistory.length - 1; i >= 0; i -= 1) {
    const batch = removalHistory[i]
    const nextBatch = batch.filter((id) => !idSet.has(id))
    if (nextBatch.length) removalHistory[i] = nextBatch
    else removalHistory.splice(i, 1)
  }
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
  getContent: (pageToken) => getContentWithRetry(pageToken, feedGeneration),
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

const isResumeMode = ref(false)
const hasPlayedResumeEnter = ref(false)


async function loadDefaultPage(pageToLoad: PageToken) {
  const result = await getContentWithRetry(pageToLoad, feedGeneration)
  assignOriginalIndices(result.items)
  markEnterFromTop(result.items)
  return { items: result.items, nextPage: result.nextPage }
}

function toId(itemOrId: string | MasonryItemBase | null | undefined): string | null {
  if (!itemOrId) return null
  return typeof itemOrId === 'string' ? itemOrId : itemOrId?.id
}

async function remove(itemsOrIds: string | MasonryItemBase | Array<string | MasonryItemBase>) {
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
  // Compute leave target in scroll content coordinates so it doesn't depend on
  // the dynamic container height (which can change when the scrollbar appears/disappears).
  const viewportBottomY = scrollTop.value + viewportHeight.value
  const clones: Array<{
    id: string
    item: MasonryItemBase
    fromX: number
    fromY: number
    toY: number
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
    const leaveBaseY = Math.max(pos.y, viewportBottomY)
    clones.push({
      id,
      item,
      fromX: pos.x,
      fromY: pos.y,
      toY: leaveBaseY + Math.max(0, height),
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
      }, LEAVE_MOTION_MS)
    })
  }
}

async function removeItem(itemOrId: string | MasonryItemBase) {
  return remove(itemOrId)
}

function cancel() {
  // Soft-cancel in-flight requests by bumping generation. Loaders will treat this as AbortError.
  feedGeneration += 1
  loadNextInFlight = null
  loadFirstInFlight = null
  isLoadingInitial.value = false
  isLoadingNext.value = false
}

defineExpose({
  remove,
  restore,
  undo,
  forget,
  loadNextPage,
  cancel,
  get pagesLoaded() {
    return pagesLoaded.value
  },
  set pagesLoaded(value: PageToken[]) {
    pagesLoaded.value = value
  },
  get nextPage() {
    return nextPage.value
  },
  set nextPage(value: PageToken | null) {
    nextPage.value = value
  },
  get isLoading() {
    return isLoadingInitial.value || isLoadingNext.value
  },
  get hasReachedEnd() {
    if (props.mode !== 'backfill') return nextPage.value == null
    return nextPage.value == null && backfillBuffer.value.length === 0
  },
  get backfillStats() {
    return backfillStats.value
  },
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

    // Resume mode: only animate the first viewport worth of items.
    // Do this inside the visibleIndices watcher so we never shift items offscreen
    // before the enter scheduler can run (which would otherwise require a scroll).
    if (isResumeMode.value && !hasPlayedResumeEnter.value) {
      const batch: MasonryItemBase[] = []
      for (const idx of indices) {
        const it = itemsState.value[idx]
        if (it) batch.push(it)
      }
      if (batch.length) {
        markEnterFromTop(batch)
      }
      hasPlayedResumeEnter.value = true
    }

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

    // Assign per-item stagger delays for this batch.
    const stepMs = idsToSchedule.length > 1 ? clampEnterStaggerMs(props.enterStaggerMs) : 0
    if (stepMs > 0) {
      const next = new Map(enterDelayById.value)
      for (let i = 0; i < idsToSchedule.length; i += 1) {
        const id = idsToSchedule[i]
        const delay = Math.min(i * stepMs, MAX_ENTER_STAGGER_TOTAL_MS)
        next.set(id, delay)
      }
      enterDelayById.value = next
    }

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
        const nextDelay = new Map(enterDelayById.value)
        for (const id of idsToSchedule) {
          nextAnimating.delete(id)
          scheduledEnterIds.delete(id)
          nextDelay.delete(id)
        }
        enterAnimatingIds.value = nextAnimating
        enterDelayById.value = nextDelay
      }, ENTER_MOTION_MS)
    })
  },
  { flush: 'post' }
)

async function loadNextPage() {
  if (loadNextInFlight) return loadNextInFlight
  if (isLoadingInitial.value || isLoadingNext.value) return
  if (props.mode !== 'backfill' && nextPage.value == null) return
  if (props.mode === 'backfill' && nextPage.value == null && backfillBuffer.value.length === 0) {
    return
  }

  const generation = feedGeneration
  let p: Promise<void> | null = null
  p = (async () => {
    try {
      isLoadingNext.value = true
      error.value = ''

      if (props.mode === 'backfill') {
        const result = await backfillLoader.loadBackfillBatch(nextPage.value)
        if (generation !== feedGeneration) return
        if (result.pages.length) pagesLoaded.value = [...pagesLoaded.value, ...result.pages]
        assignOriginalIndices(result.batchItems)
        itemsState.value = [...itemsState.value, ...result.batchItems]
        nextPage.value = result.nextPage
        return
      }

      const pageToLoad = nextPage.value
      if (pageToLoad == null) return

      const result = await loadDefaultPage(pageToLoad)
      if (generation !== feedGeneration) return
      pagesLoaded.value = [...pagesLoaded.value, pageToLoad]
      assignOriginalIndices(result.items)
      itemsState.value = [...itemsState.value, ...result.items]
      nextPage.value = result.nextPage
    } catch (err) {
      if (generation !== feedGeneration) return
      if (isAbortError(err)) return
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      if (generation === feedGeneration) isLoadingNext.value = false
      if (loadNextInFlight === p) loadNextInFlight = null
    }
  })()

  loadNextInFlight = p

  return p
}

function maybeLoadMoreOnScroll() {
  const el = scrollViewportRef.value
  if (!el) return

  const nextScrollTop = el.scrollTop
  const nextViewportHeight = el.clientHeight
  const nextScrollHeight = el.scrollHeight

  // Update reactive measures for virtualization/layout.
  scrollTop.value = nextScrollTop
  viewportHeight.value = nextViewportHeight

  // Guard: avoid prefetch caused by content shrinking (e.g. removals or column-count changes)
  // which can clamp scrollTop and fire a scroll event even if the user didn't scroll.
  const prevScrollTop = lastPrefetchScrollTop
  const prevScrollHeight = lastPrefetchScrollHeight
  const contentShrank = prevScrollHeight > 0 && nextScrollHeight < prevScrollHeight
  lastPrefetchScrollTop = nextScrollTop
  lastPrefetchScrollHeight = nextScrollHeight
  if (contentShrank && nextScrollTop <= prevScrollTop) return

  const distanceFromBottom = nextScrollHeight - (nextScrollTop + nextViewportHeight)
  if (distanceFromBottom <= props.prefetchThresholdPx) void loadNextPage()
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

function resetRuntimeState() {
  feedGeneration += 1
  loadNextInFlight = null
  loadFirstInFlight = null
  lastPrefetchScrollTop = 0
  lastPrefetchScrollHeight = 0
  nextOriginalIndex = 0
  removedPoolById.clear()
  removalHistory.length = 0
  enterStartIds.value = new Set()
  enterAnimatingIds.value = new Set()
  scheduledEnterIds.clear()
  moveOffsets.value = new Map()
  moveTransitionIds.value = new Set()
  leavingClones.value = []
  pagesLoaded.value = []
  nextPage.value = null
  backfillBuffer.value = []
  backfillStats.value = makeInitialBackfillStats()
  isLoadingInitial.value = true
  isLoadingNext.value = false
  error.value = ''
  hasPlayedResumeEnter.value = false
}

function resetFeedState(startPage: PageToken) {
  resetRuntimeState()
  itemsState.value = []
  nextPage.value = startPage
}

function normalizeRestoredPagesLoaded(input: MasonryRestoredPages): PageToken[] {
  const raw = Array.isArray(input) ? input : [input]
  const unique: PageToken[] = []
  const seen = new Set<string>()
  for (const p of raw) {
    if (p == null) continue
    const key = typeof p === 'string' ? `s:${p}` : `n:${String(p)}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(p)
  }
  return unique
}

function applyResumeState(restoredPages?: MasonryRestoredPages) {
  resetRuntimeState()

  pagesLoaded.value = restoredPages ? normalizeRestoredPagesLoaded(restoredPages) : []
  // Resume contract: parent provides the *next* page token via props.page.
  nextPage.value = props.page

  // We assume parent has already restored items in controlled mode.
  // Avoid showing the initial loader and wait for user scroll.
  isLoadingInitial.value = false

  // Ensure originalIndex invariants for remove/restore ordering.
  syncNextOriginalIndexFromItems(itemsState.value)
  assignOriginalIndices(itemsState.value)
}

async function loadFirstPage(startPage: PageToken) {
  if (loadFirstInFlight) return loadFirstInFlight

  const generation = feedGeneration
  let p: Promise<void> | null = null
  p = (async () => {
    try {
      if (props.mode === 'backfill') {
        const result = await backfillLoader.loadBackfillBatch(startPage)
        if (generation !== feedGeneration) return
        pagesLoaded.value = result.pages.length ? result.pages : [startPage]
        assignOriginalIndices(result.batchItems)
        itemsState.value = result.batchItems
        nextPage.value = result.nextPage
      } else {
        const result = await loadDefaultPage(startPage)
        if (generation !== feedGeneration) return
        pagesLoaded.value = [startPage]
        assignOriginalIndices(result.items)
        itemsState.value = result.items
        nextPage.value = result.nextPage
      }
    } catch (err) {
      if (generation !== feedGeneration) return
      if (isAbortError(err)) return
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      if (generation === feedGeneration) isLoadingInitial.value = false
      if (loadFirstInFlight === p) loadFirstInFlight = null
    }
  })()

  loadFirstInFlight = p
  return p
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
  connectViewport()

  // Resume mode: parent provides already-restored items (controlled mode)
  // and a next-page token via props.page. restoredPages is optional.
  if (props.restoredPages != null) {
    isResumeMode.value = true
    applyResumeState(props.restoredPages)
    return
  }

  if (isItemsControlled.value && itemsState.value.length > 0) {
    isResumeMode.value = true
    applyResumeState()
    return
  }

  isResumeMode.value = false

  resetFeedState(props.page)
  await loadFirstPage(props.page)
})

onUnmounted(() => {
  resizeObserver?.disconnect()

  if (flushPreloadedTimer) {
    clearTimeout(flushPreloadedTimer)
    flushPreloadedTimer = null
  }
  if (flushFailuresTimer) {
    clearTimeout(flushFailuresTimer)
    flushFailuresTimer = null
  }

  // Best-effort flush on teardown so callers don't lose a last batch.
  flushPreloaded()
  flushFailures()
})

watch(
  () => props.page,
  async (newPage) => {
    if (isResumeMode.value) {
      nextPage.value = newPage
      return
    }
    // If the starting page changes, restart the feed.
    resetFeedState(newPage)
    await loadFirstPage(newPage)
  }
)

watch(
  () => props.restoredPages,
  (next) => {
    if (!next) return
    isResumeMode.value = true
    applyResumeState(next)
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
    <div class="hidden">
      <slot />
    </div>
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
            transitionDelay: getCardTransitionDelay(itemsState[idx].id),
            transform: getCardTransform(idx),
          }"
        >
          <div
            v-if="hasHeaderSlot || headerHeight > 0"
            data-testid="item-header-container"
            class="w-full"
            :style="headerStyle"
          >
            <SlotRenderer
              :slot-fn="itemHeaderSlotFn"
              :slot-props="({ item: itemsState[idx], remove: () => removeItem(itemsState[idx]) } satisfies MasonryItemSlotProps)"
            />
          </div>

          <div class="relative">
            <MasonryLoader
              :item="itemsState[idx]"
              :remove="() => removeItem(itemsState[idx])"
              :loader-slot-fn="itemLoaderSlotFn"
              :error-slot-fn="itemErrorSlotFn"
              @success="handleItemPreloaded"
              @error="handleItemFailed"
            />

            <div v-if="hasOverlaySlot" class="pointer-events-auto absolute inset-0 z-10">
              <SlotRenderer
                :slot-fn="itemOverlaySlotFn"
                :slot-props="({ item: itemsState[idx], remove: () => removeItem(itemsState[idx]) } satisfies MasonryItemSlotProps)"
              />
            </div>
          </div>

          <div
            v-if="hasFooterSlot || footerHeight > 0"
            data-testid="item-footer-container"
            class="w-full"
            :style="footerStyle"
          >
            <SlotRenderer
              :slot-fn="itemFooterSlotFn"
              :slot-props="({ item: itemsState[idx], remove: () => removeItem(itemsState[idx]) } satisfies MasonryItemSlotProps)"
            />
          </div>
        </article>

        <article
          v-for="c in leavingClones"
          :key="c.id + ':leaving'"
          data-testid="item-card-leaving"
          class="pointer-events-none absolute overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
          :style="{
            width: c.width + 'px',
            transition: 'transform ' + LEAVE_MOTION_MS + 'ms ease-out',
            transform: c.leaving
              ? 'translate3d(' + c.fromX + 'px,' + c.fromY + 'px,0)'
              : 'translate3d(' + c.fromX + 'px,' + c.toY + 'px,0)',
          }"
        >
          <div
            v-if="hasHeaderSlot || headerHeight > 0"
            data-testid="item-header-container"
            class="w-full"
            :style="headerStyle"
          >
            <SlotRenderer
              :slot-fn="itemHeaderSlotFn"
              :slot-props="({ item: c.item, remove: () => {} } satisfies MasonryItemSlotProps)"
            />
          </div>

          <div class="relative">
            <MasonryLoader
              :item="c.item"
              :remove="() => {}"
              :loader-slot-fn="itemLoaderSlotFn"
              :error-slot-fn="itemErrorSlotFn"
            />

            <div v-if="hasOverlaySlot" class="pointer-events-auto absolute inset-0 z-10">
              <SlotRenderer
                :slot-fn="itemOverlaySlotFn"
                :slot-props="({ item: c.item, remove: () => {} } satisfies MasonryItemSlotProps)"
              />
            </div>
          </div>

          <div
            v-if="hasFooterSlot || footerHeight > 0"
            data-testid="item-footer-container"
            class="w-full"
            :style="footerStyle"
          >
            <SlotRenderer
              :slot-fn="itemFooterSlotFn"
              :slot-props="({ item: c.item, remove: () => {} } satisfies MasonryItemSlotProps)"
            />
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
