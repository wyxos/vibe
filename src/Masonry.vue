<script setup lang="ts">
import {
  masonryDefaults,
  type BackfillStats,
  type MasonryItemBase,
  type MasonryProps,
  type PageToken,
} from './masonryTypes'
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

import { getColumnCount, getColumnWidth } from './masonryLayout'
import {
  clampDelayMs,
  clampPageSize,
  createBackfillBatchLoader,
  type BackfillStatsShape,
} from './masonryBackfill'
import { buildMasonryLayout, getVisibleIndicesFromBuckets } from './masonryLayoutEngine'

defineOptions({ inheritAttrs: false })

export type { BackfillStats, GetContentFn, GetContentResult, MasonryItemBase, MasonryMode, PageToken } from './masonryTypes'

const props = withDefaults(defineProps<MasonryProps>(), masonryDefaults)

const emit = defineEmits<(e: 'update:items', items: MasonryItemBase[]) => void>()

const attrs = useAttrs()
const slots = useSlots()

const passthroughAttrs = computed(() => {
  // Avoid double-applying class by stripping it from v-bind.
  const { class: _class, ...rest } = attrs as Record<string, unknown>
  return rest
})

const scrollContainerEl = ref<HTMLElement | null>(null)

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

// Entry animation: items appear from the left edge of the masonry container.
// For an item with final (x,y), the first paint is at (-width, y) and it
// animates to (x,y).
const ENTER_FROM_LEFT_MS = 300
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
    leaving: boolean
  }>
>([])

function getMoveOffset(id: string): { dx: number; dy: number } {
  const off = moveOffsets.value.get(id)
  return off ? off : { dx: 0, dy: 0 }
}

function getCardTransition(id: string): string | undefined {
  return enterAnimatingIds.value.has(id) || moveTransitionIds.value.has(id)
    ? `transform ${ENTER_FROM_LEFT_MS}ms ease-out`
    : undefined
}

function getCardTransform(index: number): string {
  const item = itemsState.value[index]
  const id = item?.id

  const pos = layoutPositions.value[index] ?? { x: 0, y: 0 }
  const startX = id && enterStartIds.value.has(id) ? -columnWidth.value : pos.x
  const startY = pos.y
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

function markEnterFromLeft(items: MasonryItemBase[]) {
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

const pagesLoaded = ref<PageToken[]>([])
const internalItems = ref<MasonryItemBase[]>([])
const controlledItemsMirror = ref<MasonryItemBase[]>([])
const nextPage = ref<PageToken | null>(props.page)
const backfillBuffer = ref<MasonryItemBase[]>([])

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
  markEnterFromLeft,
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
  markEnterFromLeft(result.items)
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

  // Render clones for removed items that are currently in layout.
  const width = columnWidth.value
  const clones: Array<{
    id: string
    item: MasonryItemBase
    fromX: number
    fromY: number
    width: number
    leaving: boolean
  }> = []
  for (const id of removeSet) {
    const idx = layoutIndexById.value.get(id)
    if (idx == null) continue
    const item = itemsState.value[idx]
    if (!item) continue
    const pos = layoutPositions.value[idx] ?? { x: 0, y: 0 }
    clones.push({
      id,
      item,
      fromX: pos.x,
      fromY: pos.y,
      width,
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
  const offsets = new Map<string, { dx: number; dy: number }>()
  const animIds: string[] = []

  for (const [itId, oldPos] of oldPosById.entries()) {
    if (removeSet.has(itId)) continue
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

  if (offsets.size) {
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
    }, ENTER_FROM_LEFT_MS)
  }

  if (clones.length) {
    const cloneIds = new Set(clones.map((c) => c.id))
    // Trigger leave transition on the clones, then remove them.
    raf(() => {
      leavingClones.value = leavingClones.value.map((c) =>
        cloneIds.has(c.id) ? { ...c, leaving: false } : c
      )
      setTimeout(() => {
        leavingClones.value = leavingClones.value.filter((c) => !cloneIds.has(c.id))
      }, ENTER_FROM_LEFT_MS)
    })
  }
}

async function removeItem(itemOrId: string | MasonryItemBase) {
  return removeItems(itemOrId)
}

defineExpose({
  remove: removeItems,
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
      }, ENTER_FROM_LEFT_MS)
    })
  },
  { flush: 'post' }
)

const firstLoadedPageToken = computed(() => {
  return pagesLoaded.value.length ? pagesLoaded.value[0] : props.page
})

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
      itemsState.value = [...itemsState.value, ...result.batchItems]
      nextPage.value = result.nextPage
      return
    }

    const pageToLoad = nextPage.value
    if (pageToLoad == null) return

    const result = await loadDefaultPage(pageToLoad)
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
      containerWidth.value = getMeasuredContainerWidth(el)
      viewportHeight.value = el.clientHeight
    })
  }

  // Seed initial load
  nextPage.value = props.page
  backfillBuffer.value = []
  backfillStats.value = {
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

  try {
    isLoadingInitial.value = true
    error.value = ''

    if (props.mode === 'backfill') {
      const result = await backfillLoader.loadBackfillBatch(props.page)
      pagesLoaded.value = result.pages.length ? result.pages : [props.page]
      itemsState.value = result.batchItems
      nextPage.value = result.nextPage
    } else {
      const result = await loadDefaultPage(props.page)
      pagesLoaded.value = [props.page]
      itemsState.value = result.items
      nextPage.value = result.nextPage
    }
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
    backfillBuffer.value = []
    backfillStats.value = {
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
    isLoadingInitial.value = true
    isLoadingNext.value = false
    error.value = ''

    try {
      if (props.mode === 'backfill') {
        const result = await backfillLoader.loadBackfillBatch(newPage)
        pagesLoaded.value = result.pages.length ? result.pages : [newPage]
        itemsState.value = result.batchItems
        nextPage.value = result.nextPage
      } else {
        const result = await loadDefaultPage(newPage)
        pagesLoaded.value = [newPage]
        itemsState.value = result.items
        nextPage.value = result.nextPage
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      isLoadingInitial.value = false
    }
  }
)

watch(
  gapX,
  () => {
    const el = scrollContainerEl.value
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
