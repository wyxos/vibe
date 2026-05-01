import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import type { VibeViewerItem } from '../viewer'
import {
  getColumnCount,
  getColumnWidth,
  getVisibleIndicesFromBuckets,
} from './masonryLayout'
import { useMasonryLayoutState } from './masonryLayoutState'
import { getVibeMasonryEnterDuration, getVibeMasonryLeaveDuration, useMasonryMotion } from './useMasonryMotion'
import {
  getVibeMasonryDistanceFromBottom,
  getVibeMasonryViewportHeight,
  getVibeMasonryViewportWidth,
} from './masonryViewport'
import {
  getLeadingBoundaryLoadProgress,
  getTrailingBoundaryLoadProgress,
  normalizeMasonryBottomLoadBufferPx,
  useMasonryAutoScroll,
  useMasonryScrollbar,
} from './masonryScrollBehavior'
import { useEdgeBoundary } from './useEdgeBoundary'
import { getVibeOccurrenceKey } from './itemIdentity'
import { useMasonryBoundaryLock } from './masonryBoundaryLock'
import { getMasonryItemMutation } from './masonryItemMutation'
import { useMasonryPendingAppend } from './masonryPendingAppend'
const BUCKET_PX = 600
const CONTENT_INSET_PX = 24
const GAP_PX = 16
const ITEM_WIDTH_PX = 300
const OVERSCAN_PX = 200
const NEXT_PAGE_LOAD_PROGRESS_THRESHOLD_PX = 0
const NEXT_PAGE_BOUNDARY_EPSILON_PX = 1
const PREVIOUS_PAGE_BOUNDARY_THRESHOLD_PX = CONTENT_INSET_PX + GAP_PX
const SCROLL_BUFFER_PX = 200
const PREPEND_MOVE_MOTION_MS = 500
const EDGE_COOLDOWN_MS = 1000
export function useVibeMasonryList(options: {
  active: Ref<boolean>
  allowExhaustedNextPageRefresh: Ref<boolean>
  bottomLoadBufferPx: Ref<number | undefined>
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
  setActiveIndex: (index: number) => void
}) {
  const scrollViewportRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const viewportHeight = ref(typeof window === 'undefined' ? 0 : (window.innerHeight || 0))
  const viewportWidth = ref(typeof window === 'undefined' ? 0 : (window.innerWidth || ITEM_WIDTH_PX))
  const layout = useMasonryLayoutState({ bucketPx: BUCKET_PX, contentInsetPx: CONTENT_INSET_PX, gapPx: GAP_PX })
  const { buckets: layoutBuckets, columnHeights: layoutColumnHeights, contentHeight: layoutContentHeight, heights: layoutHeights, indexById: layoutIndexById, positions: layoutPositions } = layout
  const preservedScrollTop = ref<number | null>(null)
  const boundaryLock = useMasonryBoundaryLock()
  const availableWidth = computed(() => Math.max(ITEM_WIDTH_PX, viewportWidth.value - CONTENT_INSET_PX * 2))
  const columnCount = computed(() => getColumnCount(availableWidth.value, ITEM_WIDTH_PX))
  const columnWidth = computed(() => getColumnWidth(availableWidth.value, columnCount.value, ITEM_WIDTH_PX, GAP_PX))
  const bottomLoadBufferPx = computed(() => normalizeMasonryBottomLoadBufferPx(options.bottomLoadBufferPx.value))
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
    const nextReservedHeight = pendingAppend.reservedContentHeight.value ?? 0
    return Math.max(contentHeight, nextReservedHeight, viewportHeight.value) + SCROLL_BUFFER_PX + bottomLoadBufferPx.value
  })
  const canRequestNextBoundary = computed(() => options.hasNextPage.value || options.allowExhaustedNextPageRefresh.value)
  const nextBoundaryLoadProgress = computed(() => getTrailingBoundaryLoadProgress({
    active: options.active.value,
    maxScrollTop: getMaxScrollTop(),
    progressDistancePx: scrollTop.value,
    thresholdPx: NEXT_PAGE_LOAD_PROGRESS_THRESHOLD_PX,
    triggerEnabled: canRequestNextBoundary.value,
  }))
  const paginationLabel = computed(() => options.items.value.length > 0
    ? `${resolvedActiveIndex.value + 1} / ${options.items.value.length}`
    : '0 / 0')
  const previousBoundaryLoadProgress = computed(() => getLeadingBoundaryLoadProgress({
    active: options.active.value,
    maxScrollTop: getMaxScrollTop(),
    progressDistancePx: scrollTop.value,
    thresholdPx: PREVIOUS_PAGE_BOUNDARY_THRESHOLD_PX,
    triggerEnabled: options.hasPreviousPage.value,
  }))
  const scrollbar = useMasonryScrollbar({ containerHeight, scrollTop, viewportHeight })
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
    interactionLocked: boundaryLock.isBoundaryInteractionLocked,
    isAtBoundary() {
      return scrollTop.value <= PREVIOUS_PAGE_BOUNDARY_THRESHOLD_PX
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
    interactionLocked: boundaryLock.isBoundaryInteractionLocked,
    isAtBoundary() {
      return getDistanceFromBottom() <= NEXT_PAGE_BOUNDARY_EPSILON_PX
    },
    loading: options.loading,
    requestPage: options.requestNextPage,
  })
  const autoScrollController = useMasonryAutoScroll({
    active: options.active,
    getMaxScrollTop,
    getViewport: () => scrollViewportRef.value,
    onScroll,
  })
  const pendingAppend = useMasonryPendingAppend({
    bucketPx: BUCKET_PX,
    columnHeights: layoutColumnHeights,
    columnCount,
    columnWidth,
    commitPendingAppend: options.commitPendingAppend,
    contentHeight: layoutContentHeight,
    contentInsetPx: CONTENT_INSET_PX,
    gapPx: GAP_PX,
    items: options.items,
    pendingAppendItems: options.pendingAppendItems,
  })
  let resizeObserver: ResizeObserver | null = null
  let scrollFrame = 0

  watch(
    [() => options.items.value, columnCount, columnWidth],
    async ([currentItems], [previousItems = []]) => {
      const mutation = getMasonryItemMutation({
        activeIndex: resolvedActiveIndex.value,
        contentInsetPx: CONTENT_INSET_PX,
        currentItems,
        gapPx: GAP_PX,
        layoutHeights: layoutHeights.value,
        layoutIndexById: layoutIndexById.value,
        layoutPositions: layoutPositions.value,
        previousItems: previousItems ?? [],
        scrollTop: scrollTop.value,
      })
      if (mutation.shouldLockBoundaryInteractionForRemoval) {
        boundaryLock.lockBoundaryInteraction(getVibeMasonryLeaveDuration() + EDGE_COOLDOWN_MS)
      }
      if (mutation.shouldResetScrollForEmptyRemoval) {
        resetScrollToTop()
      }
      const previousLayoutItems = previousItems ?? []
      if (layout.canAppend(currentItems, previousLayoutItems, mutation, columnCount.value)) {
        layout.append(mutation.addedItems, previousLayoutItems.length, columnCount.value, columnWidth.value)
      }
      else {
        layout.rebuild(currentItems, columnCount.value, columnWidth.value)
      }
      if (mutation.removedItems.length > 0) {
        motion.markLeave(mutation.removedItems)
      }
      if (mutation.addedItems.length > 0) {
        motion.markEnter(mutation.addedItems, mutation.isPrepend ? 'top' : 'bottom')
        if (mutation.isPrepend) {
          previousPageBoundary.onItemsMutated(mutation.addedItems.length)
        }
        else {
          nextPageBoundary.onItemsMutated(mutation.addedItems.length)
        }
      }
      motion.playFlipMoveAnimation(
        mutation.oldPositionsById,
        new Set(mutation.addedItems.map((item) => getVibeOccurrenceKey(item))),
        mutation.isPrepend ? PREPEND_MOVE_MOTION_MS : undefined,
      )

      if (mutation.anchorId) {
        await nextTick()
        preserveScrollAnchor(mutation.anchorId, mutation.oldPositionsById)
      }
      else if (options.active.value && mutation.previousIds.length > 0) {
        syncBoundaryIndexFromScroll()
      }
    },
    { immediate: true },
  )
  watch(
    [() => options.pendingAppendItems.value.map((item) => getVibeOccurrenceKey(item)), columnCount, columnWidth, viewportHeight],
    () => pendingAppend.refreshReservedContentHeight(),
    { immediate: true },
  )

  watch(
    () => options.active.value,
    async (nextActive, previousActive) => {
      const viewport = scrollViewportRef.value
      if (!nextActive) {
        if (viewport) {
          preservedScrollTop.value = viewport.scrollTop
        }
        autoScrollController.stop()
        return
      }
      autoScrollController.start()
      if (!viewport) {
        return
      }
      if (previousActive !== false || preservedScrollTop.value == null) {
        return
      }
      await nextTick()
      const maxScrollTop = Math.max(0, containerHeight.value - viewportHeight.value)
      const nextScrollTop = clamp(preservedScrollTop.value, 0, maxScrollTop)
      viewport.scrollTop = nextScrollTop
      scrollTop.value = nextScrollTop
      previousPageBoundary.syncBoundary()
      nextPageBoundary.syncBoundary()
    },
  )

  watch(
    () => options.loading.value,
    async (isLoading) => {
      pendingAppend.clearReservedHeightWhenIdle(isLoading)
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
    pendingAppend.clearAppendCommitTimer()
    boundaryLock.clearBoundaryInteractionReleaseTimer()
    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame)
      scrollFrame = 0
    }
    autoScrollController.stop()
  })

  function onScroll() {
    if (!options.active.value) return
    scrollTop.value = scrollViewportRef.value?.scrollTop ?? 0
    viewportHeight.value = getViewportHeight()
    previousPageBoundary.syncBoundary('scroll')
    nextPageBoundary.syncBoundary('scroll')
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

  function resetScrollToTop() {
    const viewport = scrollViewportRef.value

    if (!viewport) {
      scrollTop.value = 0
      return
    }

    viewport.scrollTop = 0
    scrollTop.value = 0
    previousPageBoundary.syncBoundary()
    nextPageBoundary.syncBoundary()
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
    const nearTop = scrollTop.value <= PREVIOUS_PAGE_BOUNDARY_THRESHOLD_PX
    const nearBottom = getDistanceFromBottom() <= NEXT_PAGE_BOUNDARY_EPSILON_PX

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

  function getMaxScrollTop() {
    const scrollHeight = Math.max(scrollViewportRef.value?.scrollHeight ?? 0, containerHeight.value)
    return Math.max(0, scrollHeight - viewportHeight.value)
  }

  return {
    autoScroll: autoScrollController.autoScroll,
    columnWidth,
    containerHeight,
    getCardStyle,
    getLeavingCardStyle: motion.getLeavingCardStyle,
    getScrollbarThumbStyle: scrollbar.getScrollbarThumbStyle,
    leavingItems: motion.leavingItems,
    nextBoundaryLoadProgress,
    onScroll,
    onWheel,
    paginationLabel,
    previousBoundaryLoadProgress,
    renderedItems,
    resolvedActiveIndex,
    scrollToIndex,
    showScrollbar: scrollbar.showScrollbar,
    scrollViewportRef,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

