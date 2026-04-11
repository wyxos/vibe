import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import type { VibeViewerItem } from '../viewer'
import {
  buildMasonryLayout,
  getColumnCount,
  getColumnWidth,
  getVisibleIndicesFromBuckets,
  snapshotPositionsById,
} from './masonryLayout'
import { getVibeMasonryEnterDuration, useMasonryMotion } from './useMasonryMotion'
import {
  getVibeMasonryDistanceFromBottom,
  getVibeMasonryScrollbarThumbStyle,
  getVibeMasonryViewportHeight,
  getVibeMasonryViewportWidth,
} from './masonryViewport'
import { useEdgeBoundary } from './useEdgeBoundary'
import { getVibeOccurrenceKey } from './itemIdentity'
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
const PREPEND_MOVE_MOTION_MS = 500
const EDGE_COOLDOWN_MS = 1000
export function useVibeMasonryList(options: {
  active: Ref<boolean>
  allowExhaustedNextPageRefresh: Ref<boolean>
  items: Ref<VibeViewerItem[]>
  activeIndex: Ref<number>
  loading: Ref<boolean>
  hasNextPage: Ref<boolean>
  hasPreviousPage: Ref<boolean>
  paginationDetail: Ref<string | null>
  pendingAppendItems: Ref<VibeViewerItem[]>
  commitPendingAppend: Ref<(() => void | Promise<void>) | null | undefined>
  requestNextPage: Ref<(() => void | Promise<void>) | null | undefined>
  requestPreviousPage: Ref<(() => void | Promise<void>) | null | undefined>
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
  const renderedItems = computed(() => renderedIndices.value.map((index) => ({ item: options.items.value[index], index })))
  const containerHeight = computed(() => {
    const contentHeight = layoutContentHeight.value + CONTENT_INSET_PX * 2
    const nextReservedHeight = reservedContentHeight.value ?? 0
    return Math.max(contentHeight, nextReservedHeight, viewportHeight.value) + SCROLL_BUFFER_PX
  })
  const canRequestNextBoundary = computed(() => options.hasNextPage.value || options.allowExhaustedNextPageRefresh.value)
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
  const motion = useMasonryMotion({
    items: options.items,
    visibleIndices: renderedIndices,
    positions: layoutPositions,
    heights: layoutHeights,
    indexById: layoutIndexById,
    columnWidth,
    scrollTop,
    viewportHeight,
  })
  const previousPageBoundary = useEdgeBoundary({
    direction: 'top',
    getAnimationLockMs(addedItemCount) {
      return Math.max(PREPEND_MOVE_MOTION_MS, getVibeMasonryEnterDuration(addedItemCount)) + EDGE_COOLDOWN_MS
    },
    hasPage: options.hasPreviousPage,
    isAtBoundary() {
      return scrollTop.value <= CONTENT_INSET_PX + GAP_PX
    },
    loading: options.loading,
    requestPage: options.requestPreviousPage,
  })
  const nextPageBoundary = useEdgeBoundary({
    direction: 'bottom',
    getAnimationLockMs(addedItemCount) {
      return getVibeMasonryEnterDuration(addedItemCount) + EDGE_COOLDOWN_MS
    },
    hasPage: canRequestNextBoundary,
    isAtBoundary() {
      return getDistanceFromBottom() <= PREFETCH_THRESHOLD_PX
    },
    loading: options.loading,
    requestPage: options.requestNextPage,
  })

  let resizeObserver: ResizeObserver | null = null
  let scrollFrame = 0
  let appendCommitTimer: ReturnType<typeof setTimeout> | null = null
  let isSettlingReservedHeight = false

  watch(
    [() => options.items.value.map((item) => getVibeOccurrenceKey(item)), columnCount, columnWidth],
    async ([currentIds], [previousIds = []]) => {
      const oldPositionsById = snapshotPositionsById(options.items.value, layoutIndexById.value, layoutPositions.value)
      const previousIdSet = new Set(previousIds)
      const addedItems = options.items.value.filter((item) => !previousIdSet.has(getVibeOccurrenceKey(item)))
      const isPrepend = currentIds.length > previousIds.length && previousIds.length > 0 && currentIds[0] !== previousIds[0]
      const shouldPreserveAnchor = isPrepend && scrollTop.value > CONTENT_INSET_PX + GAP_PX
      const anchorItem = shouldPreserveAnchor ? options.items.value[resolvedActiveIndex.value] : null
      const anchorId = anchorItem ? getVibeOccurrenceKey(anchorItem) : null
      rebuildLayout()
      if (addedItems.length > 0) {
        motion.markEnter(addedItems, isPrepend ? 'top' : 'bottom')
        if (isPrepend) {
          previousPageBoundary.onItemsMutated(addedItems.length)
        }
        else {
          nextPageBoundary.onItemsMutated(addedItems.length)
        }
      }

      motion.playFlipMoveAnimation(
        oldPositionsById,
        new Set(addedItems.map((item) => getVibeOccurrenceKey(item))),
        isPrepend ? PREPEND_MOVE_MOTION_MS : undefined,
      )

      if (anchorId) {
        await nextTick()
        preserveScrollAnchor(anchorId, oldPositionsById)
      }
      else if (options.active.value && previousIds.length > 0) {
        syncBoundaryIndexFromScroll()
      }
    },
    { immediate: true },
  )

  watch(
    [() => options.pendingAppendItems.value.map((item) => getVibeOccurrenceKey(item)), columnCount, columnWidth, viewportHeight],
    ([pendingIds]) => {
      clearAppendCommitTimer()
      if (!pendingIds.length) return
      reservedContentHeight.value = measureContentHeight([...options.items.value, ...options.pendingAppendItems.value])
      schedulePendingAppendCommit()
    },
    { immediate: true },
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

      previousPageBoundary.onLoadingChange(isLoading)
      nextPageBoundary.onLoadingChange(isLoading)

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
    previousPageBoundary.syncBoundary()
    nextPageBoundary.syncBoundary()
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
    if (!options.active.value) return
    scrollTop.value = scrollViewportRef.value?.scrollTop ?? 0
    viewportHeight.value = getViewportHeight()
    previousPageBoundary.syncBoundary()
    nextPageBoundary.syncBoundary()
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

  function onWheel(event: WheelEvent) {
    if (!options.active.value) return
    previousPageBoundary.onWheel(event)
    nextPageBoundary.onWheel(event)
    maybeRequestMoreAtBoundary()
  }

  function getCardStyle(index: number) {
    const item = options.items.value[index]
    const itemKey = item ? getVibeOccurrenceKey(item) : ''

    return {
      height: `${layoutHeights.value[index] ?? columnWidth.value}px`,
      width: `${columnWidth.value}px`,
      transition: itemKey ? motion.getCardTransition(itemKey) : undefined,
      transitionDelay: itemKey ? motion.getCardTransitionDelay(itemKey) : undefined,
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
    previousPageBoundary.maybeRequestPage()
    nextPageBoundary.maybeRequestPage()
  }

  function updateViewportMetrics() {
    viewportHeight.value = getViewportHeight()
    viewportWidth.value = getViewportWidth()
  }

  function getViewportHeight() {
    return getVibeMasonryViewportHeight(scrollViewportRef.value, viewportHeight.value)
  }

  function getViewportWidth() {
    return getVibeMasonryViewportWidth(scrollViewportRef.value, viewportWidth.value, ITEM_WIDTH_PX)
  }

  function getDistanceFromBottom() {
    return getVibeMasonryDistanceFromBottom(
      scrollViewportRef.value,
      scrollTop.value,
      viewportHeight.value,
      containerHeight.value,
    )
  }

  function getScrollbarThumbStyle() {
    return getVibeMasonryScrollbarThumbStyle(scrollbarThumbHeight.value, scrollbarThumbTop.value)
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
    if (!appendCommitTimer) return
    clearTimeout(appendCommitTimer)
    appendCommitTimer = null
  }

  return {
    columnWidth,
    containerHeight,
    getCardStyle,
    getScrollbarThumbStyle,
    onScroll,
    onWheel,
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
