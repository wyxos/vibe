import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

import type { VibeViewerItem } from '../vibeViewer'

import {
  buildMasonryLayout,
  getColumnCount,
  getColumnWidth,
  getVisibleIndicesFromBuckets,
  snapshotPositionsById,
} from './masonryLayout'
import { useVibeMasonryMotion } from './useVibeMasonryMotion'

const BUCKET_PX = 600
const CONTENT_INSET_PX = 24
const GAP_PX = 16
const ITEM_WIDTH_PX = 300
const OVERSCAN_PX = 200
const PREFETCH_THRESHOLD_PX = 200
const SCROLL_BUFFER_PX = 200
const HEIGHT_RESERVE_MS = 300
const SCROLLBAR_INSET_PX = 24
const SCROLLBAR_MIN_THUMB_HEIGHT_PX = 48

export function useVibeMasonryList(options: {
  items: Ref<VibeViewerItem[]>
  activeIndex: Ref<number>
  loading: Ref<boolean>
  hasNextPage: Ref<boolean>
  paginationDetail: Ref<string | null>
  pendingAppendItems: Ref<VibeViewerItem[]>
  commitPendingAppend: Ref<(() => void | Promise<void>) | null | undefined>
  requestNextPage: Ref<(() => void | Promise<void>) | null | undefined>
  restoreToken: Ref<number>
  setActiveIndex: (index: number) => void
}) {
  const scrollViewportRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const viewportHeight = ref(typeof window === 'undefined' ? 0 : (window.innerHeight || 0))
  const viewportWidth = ref(typeof window === 'undefined' ? 0 : (window.innerWidth || ITEM_WIDTH_PX))
  const layoutPositions = ref<{ x: number; y: number }[]>([])
  const layoutHeights = ref<number[]>([])
  const layoutBuckets = ref<Map<number, number[]>>(new Map())
  const layoutContentHeight = ref(0)
  const layoutIndexById = ref<Map<string, number>>(new Map())
  const reservedContentHeight = ref<number | null>(null)
  const isScrollLoadLocked = ref(false)

  const availableWidth = computed(() => Math.max(ITEM_WIDTH_PX, viewportWidth.value - CONTENT_INSET_PX * 2))
  const columnCount = computed(() => getColumnCount(availableWidth.value, ITEM_WIDTH_PX))
  const columnWidth = computed(() => getColumnWidth(availableWidth.value, columnCount.value, ITEM_WIDTH_PX, GAP_PX))
  const resolvedActiveIndex = computed(() => clamp(options.activeIndex.value, 0, Math.max(0, options.items.value.length - 1)))
  const renderedIndices = computed(() =>
    getVisibleIndicesFromBuckets({
      itemCount: options.items.value.length,
      viewportHeight: viewportHeight.value,
      scrollTop: scrollTop.value,
      overscanPx: OVERSCAN_PX,
      bucketPx: BUCKET_PX,
      buckets: layoutBuckets.value,
    }),
  )
  const renderedItems = computed(() => renderedIndices.value.map((index) => ({
    item: options.items.value[index],
    index,
  })))
  const containerHeight = computed(() => {
    const contentHeight = layoutContentHeight.value + CONTENT_INSET_PX * 2
    const nextReservedHeight = reservedContentHeight.value ?? 0

    return Math.max(contentHeight, nextReservedHeight, viewportHeight.value) + SCROLL_BUFFER_PX
  })
  const footerStatusMessage = computed(() => {
    if (options.loading.value) {
      return options.items.value.length > 0 ? 'Loading more items' : 'Loading the first page'
    }

    if (!options.hasNextPage.value && options.items.value.length > 0) {
      return 'End of list'
    }

    return null
  })
  const paginationLabel = computed(() => `${resolvedActiveIndex.value + 1} / ${options.items.value.length}`)
  const scrollbarTrackHeight = computed(() => Math.max(0, viewportHeight.value - SCROLLBAR_INSET_PX * 2))
  const showScrollbar = computed(() => containerHeight.value > viewportHeight.value + 1 && scrollbarTrackHeight.value > 0)
  const scrollbarThumbHeight = computed(() => {
    if (!showScrollbar.value) {
      return 0
    }

    const rawThumbHeight = (viewportHeight.value / containerHeight.value) * scrollbarTrackHeight.value
    return Math.min(scrollbarTrackHeight.value, Math.max(SCROLLBAR_MIN_THUMB_HEIGHT_PX, rawThumbHeight))
  })
  const scrollbarThumbTop = computed(() => {
    if (!showScrollbar.value) {
      return SCROLLBAR_INSET_PX
    }

    const maxScrollTop = Math.max(0, containerHeight.value - viewportHeight.value)
    const maxThumbTravel = Math.max(0, scrollbarTrackHeight.value - scrollbarThumbHeight.value)
    const progress = maxScrollTop > 0 ? clamp(scrollTop.value / maxScrollTop, 0, 1) : 0

    return SCROLLBAR_INSET_PX + maxThumbTravel * progress
  })

  const motion = useVibeMasonryMotion({
    items: options.items,
    visibleIndices: renderedIndices,
    positions: layoutPositions,
    heights: layoutHeights,
    indexById: layoutIndexById,
    columnWidth,
    scrollTop,
    viewportHeight,
  })

  let resizeObserver: ResizeObserver | null = null
  let scrollFrame = 0
  let appendCommitTimer: ReturnType<typeof setTimeout> | null = null
  let isSettlingReservedHeight = false

  watch(
    [() => options.items.value.map((item) => item.id), columnCount, columnWidth],
    async ([currentIds], [previousIds = []]) => {
      const oldPositionsById = snapshotPositionsById(options.items.value, layoutIndexById.value, layoutPositions.value)
      const previousIdSet = new Set(previousIds)
      const addedItems = options.items.value.filter((item) => !previousIdSet.has(item.id))
      const isPrepend = currentIds.length > previousIds.length && previousIds.length > 0 && currentIds[0] !== previousIds[0]
      const anchorId = isPrepend ? options.items.value[resolvedActiveIndex.value]?.id ?? null : null

      rebuildLayout()

      if (addedItems.length > 0) {
        motion.markEnter(addedItems)
      }

      motion.playFlipMoveAnimation(oldPositionsById, new Set(addedItems.map((item) => item.id)))

      if (anchorId) {
        await nextTick()
        preserveScrollAnchor(anchorId, oldPositionsById)
      }

    },
    {
      immediate: true,
    },
  )

  watch(
    [() => options.pendingAppendItems.value.map((item) => item.id), columnCount, columnWidth, viewportHeight],
    ([pendingIds]) => {
      clearAppendCommitTimer()

      if (!pendingIds.length) {
        return
      }

      reservedContentHeight.value = measureContentHeight([...options.items.value, ...options.pendingAppendItems.value])
      schedulePendingAppendCommit()
    },
    {
      immediate: true,
    },
  )

  watch(
    () => options.restoreToken.value,
    async () => {
      await nextTick()
      scrollToIndex(resolvedActiveIndex.value, 'center')
    },
  )

  watch(
    () => options.loading.value,
    async (isLoading) => {
      if (!isLoading && !options.pendingAppendItems.value.length && !appendCommitTimer && !isSettlingReservedHeight) {
        reservedContentHeight.value = null
      }

      await nextTick()
    },
  )

  onMounted(async () => {
    updateViewportMetrics()

    await nextTick()
    if (resolvedActiveIndex.value > 0) {
      scrollToIndex(resolvedActiveIndex.value, 'center')
    }
    else {
      syncActiveIndexFromScroll()
    }
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateViewportMetrics()
      })

      if (scrollViewportRef.value) {
        resizeObserver.observe(scrollViewportRef.value)
      }
    }
    else {
      window.addEventListener('resize', updateViewportMetrics)
    }
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    window.removeEventListener('resize', updateViewportMetrics)
    clearAppendCommitTimer()

    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame)
      scrollFrame = 0
    }
  })

  function rebuildLayout() {
    const nextLayout = buildMasonryLayout(options.items.value, {
      columnCount: columnCount.value,
      columnWidth: columnWidth.value,
      gapX: GAP_PX,
      gapY: GAP_PX,
      bucketPx: BUCKET_PX,
    })

    layoutPositions.value = nextLayout.positions.map((position) => ({
      x: position.x + CONTENT_INSET_PX,
      y: position.y + CONTENT_INSET_PX,
    }))
    layoutHeights.value = nextLayout.heights
    layoutBuckets.value = nextLayout.buckets
    layoutContentHeight.value = nextLayout.contentHeight
    layoutIndexById.value = nextLayout.indexById
  }

  function onScroll() {
    scrollTop.value = scrollViewportRef.value?.scrollTop ?? 0
    viewportHeight.value = getViewportHeight()
    maybeRequestMoreAtBoundary()

    if (syncBoundaryIndexFromScroll()) {
      return
    }

    if (scrollFrame) {
      return
    }

    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0
      syncActiveIndexFromScroll()
    })
  }

  function getCardStyle(index: number) {
    return {
      height: `${layoutHeights.value[index] ?? columnWidth.value}px`,
      width: `${columnWidth.value}px`,
      transition: motion.getCardTransition(options.items.value[index].id),
      transitionDelay: motion.getCardTransitionDelay(options.items.value[index].id),
      transform: motion.getCardTransform(index),
    }
  }

  function scrollToIndex(index: number, alignment: 'center' | 'nearest') {
    const viewport = scrollViewportRef.value
    const position = layoutPositions.value[index]
    const height = layoutHeights.value[index]

    if (!viewport || !position || !height) {
      return
    }

    let nextScrollTop = viewport.scrollTop
    const maxScrollTop = Math.max(0, containerHeight.value - viewportHeight.value)

    if (alignment === 'center') {
      nextScrollTop = position.y - (viewportHeight.value - height) / 2
    }
    else if (position.y < viewport.scrollTop) {
      nextScrollTop = position.y - CONTENT_INSET_PX
    }
    else if (position.y + height > viewport.scrollTop + viewportHeight.value) {
      nextScrollTop = position.y + height - viewportHeight.value + CONTENT_INSET_PX
    }

    viewport.scrollTop = clamp(nextScrollTop, 0, maxScrollTop)
    scrollTop.value = viewport.scrollTop
    syncActiveIndexFromScroll()
  }

  function preserveScrollAnchor(anchorId: string, oldPositionsById: Map<string, { x: number; y: number }>) {
    const viewport = scrollViewportRef.value
    const oldPosition = oldPositionsById.get(anchorId)
    const nextIndex = layoutIndexById.value.get(anchorId)
    const nextPosition = nextIndex == null ? null : layoutPositions.value[nextIndex]

    if (!viewport || !oldPosition || !nextPosition) {
      return
    }

    const deltaY = nextPosition.y - oldPosition.y
    viewport.scrollTop += deltaY
    scrollTop.value = viewport.scrollTop
  }

  function syncActiveIndexFromScroll() {
    if (!renderedIndices.value.length) {
      return
    }

    if (syncBoundaryIndexFromScroll()) {
      return
    }

    const viewportCenter = scrollTop.value + viewportHeight.value / 2
    let nextIndex = resolvedActiveIndex.value
    let bestDistance = Number.POSITIVE_INFINITY

    for (const index of renderedIndices.value) {
      const position = layoutPositions.value[index]
      const height = layoutHeights.value[index]
      if (!position || !height) {
        continue
      }

      const center = position.y + height / 2
      const distance = Math.abs(center - viewportCenter)

      if (distance < bestDistance) {
        bestDistance = distance
        nextIndex = index
      }
    }

    options.setActiveIndex(nextIndex)
  }

  function syncBoundaryIndexFromScroll() {
    const nearTop = scrollTop.value <= CONTENT_INSET_PX + GAP_PX
    const nearBottom = getDistanceFromBottom() <= PREFETCH_THRESHOLD_PX

    if (nearTop) {
      options.setActiveIndex(0)
      return true
    }

    if (nearBottom) {
      options.setActiveIndex(Math.max(0, options.items.value.length - 1))
      return true
    }

    return false
  }

  function maybeRequestMoreAtBoundary() {
    if (
      !options.hasNextPage.value
      || typeof options.requestNextPage.value !== 'function'
    ) {
      return
    }

    const nearBottom = getDistanceFromBottom() <= PREFETCH_THRESHOLD_PX
    if (!nearBottom) {
      isScrollLoadLocked.value = false

      return
    }

    if (options.loading.value || isScrollLoadLocked.value) {
      return
    }

    isScrollLoadLocked.value = true
    void options.requestNextPage.value()
  }

  function updateViewportMetrics() {
    viewportHeight.value = getViewportHeight()
    viewportWidth.value = getViewportWidth()
  }

  function getViewportHeight() {
    const viewport = scrollViewportRef.value

    return viewport?.clientHeight
      || Math.round(viewport?.getBoundingClientRect().height ?? 0)
      || window.innerHeight
      || viewportHeight.value
      || 1
  }

  function getViewportWidth() {
    const viewport = scrollViewportRef.value

    return viewport?.clientWidth
      || Math.round(viewport?.getBoundingClientRect().width ?? 0)
      || window.innerWidth
      || viewportWidth.value
      || ITEM_WIDTH_PX
  }

  function getDistanceFromBottom() {
    const viewport = scrollViewportRef.value
    const scrollHeight = viewport?.scrollHeight ?? containerHeight.value
    return scrollHeight - (scrollTop.value + viewportHeight.value)
  }

  function getScrollbarThumbStyle() {
    return {
      height: `${scrollbarThumbHeight.value}px`,
      transform: `translate3d(0, ${scrollbarThumbTop.value}px, 0)`,
    }
  }

  function measureContentHeight(items: VibeViewerItem[]) {
    if (!items.length) {
      return 0
    }

    const projectedLayout = buildMasonryLayout(items, {
      columnCount: columnCount.value,
      columnWidth: columnWidth.value,
      gapX: GAP_PX,
      gapY: GAP_PX,
      bucketPx: BUCKET_PX,
    })

    return projectedLayout.contentHeight + CONTENT_INSET_PX * 2
  }

  function schedulePendingAppendCommit() {
    const commitPendingAppend = options.commitPendingAppend.value
    if (typeof commitPendingAppend !== 'function') {
      return
    }

    appendCommitTimer = setTimeout(async () => {
      appendCommitTimer = null
      isSettlingReservedHeight = true

      try {
        if (!options.pendingAppendItems.value.length) {
          return
        }

        await commitPendingAppend()
        await nextTick()
        await nextTick()
      }
      finally {
        reservedContentHeight.value = null
        isSettlingReservedHeight = false
      }
    }, HEIGHT_RESERVE_MS)
  }

  function clearAppendCommitTimer() {
    if (!appendCommitTimer) {
      return
    }

    clearTimeout(appendCommitTimer)
    appendCommitTimer = null
  }

  return {
    columnWidth,
    containerHeight,
    footerStatusMessage,
    getCardStyle,
    getScrollbarThumbStyle,
    onScroll,
    paginationLabel,
    renderedItems,
    resolvedActiveIndex,
    scrollToIndex,
    showScrollbar,
    scrollViewportRef,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
