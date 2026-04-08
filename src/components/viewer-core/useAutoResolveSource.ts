import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'
import type { VibeFeedMode, VibeLoadPhase } from './removalState'
import {
  type VibeAutoBucket,
  filterRemovedItems,
  flattenVibeBuckets,
  getVibeBucketVisibleCount,
  getVibeCursorAtVisibleIndex,
  replaceVibeBucketAtCursor,
  resolveVibeBucketItems,
} from './autoBuckets'
import {
  clamp,
  getCursorKey,
  isActiveLoadPhase,
  normalizePageSize,
  PREFETCH_OFFSET,
  type ResolveFn,
  type VibeAutoDirection,
} from './autoResolveHelpers'
import { DEFAULT_DYNAMIC_FILL_DELAY_MS, DEFAULT_DYNAMIC_FILL_DELAY_STEP_MS, getDynamicFillDelayMs, normalizeDynamicFillDelayMs, useFillDelayCountdown } from './fillDelay'
import { getVibeOccurrenceKey } from './itemIdentity'

type VibeAutoEmit = (event: 'update:activeIndex', value: number) => void

interface VibeCollectedBuckets {
  buckets: VibeAutoBucket[]
  visibleCount: number
}

export function useAutoResolveSource(options: {
  emit: VibeAutoEmit
  fillDelayMs?: number
  fillDelayStepMs?: number
  initialCursor?: string | null
  mode?: VibeFeedMode
  pageSize?: number
  removedIds: Ref<Set<string>>
  resolve?: ResolveFn
}) {
  const autoBuckets = ref<VibeAutoBucket[]>([])
  const autoActiveIndex = ref(0)
  const pendingAppendBuckets = ref<VibeAutoBucket[]>([])
  const errorMessage = ref<string | null>(null)
  const operationPhase = ref<VibeLoadPhase>('idle')
  const fillCollectedCount = ref<number | null>(null)
  const fillDelay = useFillDelayCountdown()
  const fillDelayRemainingMs = fillDelay.remainingMs
  const fillTargetCount = ref<number | null>(null)
  const isAwaitingAppendCommit = ref(false)
  const isAutoPrefetchEnabled = ref(true)
  const inFlightCursors = new Set<string>()
  let occurrenceSequence = 0

  const fillDelayMs = computed(() => normalizeDynamicFillDelayMs(options.fillDelayMs, DEFAULT_DYNAMIC_FILL_DELAY_MS))
  const fillDelayStepMs = computed(() => normalizeDynamicFillDelayMs(options.fillDelayStepMs, DEFAULT_DYNAMIC_FILL_DELAY_STEP_MS))
  const mode = computed<VibeFeedMode>(() => options.mode ?? 'dynamic')
  const pageSize = computed(() => normalizePageSize(options.pageSize))
  const sourceItems = computed(() => flattenVibeBuckets(autoBuckets.value))
  const items = computed(() => filterRemovedItems(sourceItems.value, options.removedIds.value))
  const activeIndex = computed(() => autoActiveIndex.value)
  const loading = computed(() => isActiveLoadPhase(operationPhase.value) || isAwaitingAppendCommit.value)
  const firstBucket = computed(() => autoBuckets.value[0] ?? null)
  const lastBucket = computed(() => autoBuckets.value[autoBuckets.value.length - 1] ?? null)
  const nextCursor = computed(() => lastBucket.value?.nextCursor ?? null)
  const previousCursor = computed(() => firstBucket.value?.previousCursor ?? null)
  const hasNextPage = computed(() => Boolean(nextCursor.value))
  const hasPreviousPage = computed(() => Boolean(previousCursor.value))
  const pendingAppendItems = computed(() =>
    filterRemovedItems(flattenVibeBuckets(pendingAppendBuckets.value), options.removedIds.value),
  )
  const currentCursor = computed(() =>
    getVibeCursorAtVisibleIndex(autoBuckets.value, options.removedIds.value, activeIndex.value),
  )
  const canRetryInitialLoad = computed(() =>
    !items.value.length
    && !loading.value
    && Boolean(errorMessage.value),
  )

  watch(
    () => items.value.length,
    (length) => {
      if (length === 0) {
        autoActiveIndex.value = 0
        return
      }
      if (autoActiveIndex.value > length - 1) {
        autoActiveIndex.value = length - 1
      }
    },
  )

  watch(
    () => autoActiveIndex.value,
    () => {
      if (!isAutoPrefetchEnabled.value) {
        return
      }
      void maybePrefetchAround()
    },
  )

  onMounted(() => {
    if (!options.resolve) {
      return
    }
    void loadInitialBuckets()
  })

  onBeforeUnmount(() => {
    fillDelay.clear(true)
  })

  async function loadInitialBuckets() {
    const resolvedBuckets = await collectBuckets({
      continueUntilFilled: mode.value === 'dynamic',
      cursor: options.initialCursor ?? null,
      direction: 'forward',
      phase: 'loading',
    })

    if (!resolvedBuckets) {
      return
    }
    autoBuckets.value = resolvedBuckets.buckets
    autoActiveIndex.value = 0
    finishLoadPhase()
  }

  async function prefetchNextPage() {
    if (!hasNextPage.value || loading.value) {
      return
    }
    if (mode.value === 'static' && needsStaticReload('trailing')) {
      await reloadBoundaryBucket('trailing')
      return
    }

    await appendBuckets(nextCursor.value)
  }

  async function prefetchPreviousPage() {
    if (!hasPreviousPage.value || loading.value) {
      return
    }
    if (mode.value === 'static' && needsStaticReload('leading')) {
      await reloadBoundaryBucket('leading')
      return
    }

    await prependBuckets(previousCursor.value)
  }

  async function retryInitialLoad() {
    if (!canRetryInitialLoad.value) {
      return
    }

    autoBuckets.value = []
    autoActiveIndex.value = 0
    pendingAppendBuckets.value = []
    errorMessage.value = null
    operationPhase.value = 'idle'
    fillCollectedCount.value = null
    fillTargetCount.value = null
    isAwaitingAppendCommit.value = false
    inFlightCursors.clear()
    fillDelay.clear(true)

    await loadInitialBuckets()
  }

  async function commitPendingAppend() {
    if (!pendingAppendBuckets.value.length) {
      isAwaitingAppendCommit.value = false
      finishLoadPhase()
      return
    }

    autoBuckets.value = [...autoBuckets.value, ...pendingAppendBuckets.value]
    pendingAppendBuckets.value = []
    isAwaitingAppendCommit.value = false
    finishLoadPhase()
  }

  function setActiveIndex(nextIndex: number) {
    const nextItems = items.value

    if (!nextItems.length) {
      return
    }

    const clampedIndex = clamp(nextIndex, 0, nextItems.length - 1)
    if (clampedIndex === autoActiveIndex.value) {
      return
    }

    autoActiveIndex.value = clampedIndex
    options.emit('update:activeIndex', clampedIndex)
  }

  function setAutoPrefetchEnabled(nextValue: boolean) {
    isAutoPrefetchEnabled.value = nextValue
  }

  function getActiveOccurrenceKey() {
    const currentItem = items.value[clamp(activeIndex.value, 0, Math.max(0, items.value.length - 1))]
    return currentItem ? getVibeOccurrenceKey(currentItem) : null
  }

  function syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey: string | null = null) {
    if (!items.value.length) {
      autoActiveIndex.value = 0
      return
    }

    const anchoredIndex = anchorOccurrenceKey
      ? items.value.findIndex((item) => getVibeOccurrenceKey(item) === anchorOccurrenceKey)
      : -1
    autoActiveIndex.value = anchoredIndex >= 0
      ? anchoredIndex
      : clamp(activeIndex.value, 0, items.value.length - 1)
  }

  function maybeCommitPendingAppendWhenFilteredOut() {
    if (pendingAppendBuckets.value.length > 0 && !pendingAppendItems.value.length) {
      void commitPendingAppend()
    }
  }

  async function maybePrefetchAround() {
    if (!items.value.length || isLoadingInitialPhase()) {
      return
    }

    if (hasPreviousPage.value && autoActiveIndex.value < PREFETCH_OFFSET) {
      await prefetchPreviousPage()
    }

    if (hasNextPage.value && autoActiveIndex.value >= items.value.length - PREFETCH_OFFSET) {
      await prefetchNextPage()
    }
  }

  async function appendBuckets(cursor: string | null) {
    const resolvedBuckets = await collectBuckets({
      continueUntilFilled: mode.value === 'dynamic',
      cursor,
      direction: 'forward',
      phase: 'loading',
    })

    if (!resolvedBuckets) {
      return
    }

    pendingAppendBuckets.value = resolvedBuckets.buckets

    if (!pendingAppendItems.value.length) {
      autoBuckets.value = [...autoBuckets.value, ...pendingAppendBuckets.value]
      pendingAppendBuckets.value = []
      isAwaitingAppendCommit.value = false
      finishLoadPhase()
      return
    }

    isAwaitingAppendCommit.value = true
  }

  async function prependBuckets(cursor: string | null) {
    const resolvedBuckets = await collectBuckets({
      continueUntilFilled: mode.value === 'dynamic',
      cursor,
      direction: 'backward',
      phase: 'loading',
    })

    if (!resolvedBuckets) {
      return
    }

    const anchorOccurrenceKey = getActiveOccurrenceKey()
    autoBuckets.value = [...resolvedBuckets.buckets, ...autoBuckets.value]
    syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
    finishLoadPhase()
  }

  async function reloadBoundaryBucket(edge: 'leading' | 'trailing') {
    if (!options.resolve) {
      return
    }

    const targetBucket = edge === 'leading' ? firstBucket.value : lastBucket.value
    if (!targetBucket) {
      return
    }

    const cursorKey = getCursorKey(targetBucket.cursor)
    if (inFlightCursors.has(cursorKey)) {
      return
    }

    inFlightCursors.add(cursorKey)
    errorMessage.value = null
    operationPhase.value = 'reloading'
    fillCollectedCount.value = null
    fillTargetCount.value = null

    try {
      const response = await options.resolve({
        cursor: targetBucket.cursor,
        pageSize: pageSize.value,
      })

      const nextBucket = createBucket({
        cursor: targetBucket.cursor,
        nextCursor: response.nextPage,
        nextItems: response.items,
        previousCursor: response.previousPage ?? null,
        previousItems: targetBucket.items,
      })
      const anchorOccurrenceKey = getActiveOccurrenceKey()

      autoBuckets.value = replaceVibeBucketAtCursor(autoBuckets.value, targetBucket.cursor, nextBucket)
      syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
      finishLoadPhase()
    }
    catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'The viewer could not load items.'
      operationPhase.value = 'failed'
      fillCollectedCount.value = null
      fillTargetCount.value = null
    }
    finally {
      inFlightCursors.delete(cursorKey)
    }
  }

  async function collectBuckets(request: {
    continueUntilFilled: boolean
    cursor: string | null
    direction: VibeAutoDirection
    phase: Extract<VibeLoadPhase, 'loading' | 'reloading'>
  }): Promise<VibeCollectedBuckets | null> {
    if (!options.resolve) {
      return null
    }

    const visitedCursorKeys = new Set<string>()
    const collectedBuckets: VibeAutoBucket[] = []
    let cursor = request.cursor
    let fillRequestIndex = 0

    errorMessage.value = null
    operationPhase.value = request.phase
    fillCollectedCount.value = null
    fillTargetCount.value = null

    while (true) {
      const cursorKey = getCursorKey(cursor)
      if (visitedCursorKeys.has(cursorKey) || inFlightCursors.has(cursorKey)) {
        break
      }

      visitedCursorKeys.add(cursorKey)
      inFlightCursors.add(cursorKey)

      try {
        const response = await options.resolve({
          cursor,
          pageSize: pageSize.value,
        })
        const nextBucket = createBucket({
          cursor,
          nextCursor: response.nextPage,
          nextItems: response.items,
          previousCursor: response.previousPage ?? null,
          previousItems: [],
        })

        collectedBuckets.push(nextBucket)
        const visibleCount = collectedBuckets.reduce((count, bucket) => {
          return count + getVibeBucketVisibleCount(bucket, options.removedIds.value)
        }, 0)
        const nextCursor = request.direction === 'forward' ? nextBucket.nextCursor : nextBucket.previousCursor

        if (!request.continueUntilFilled || visibleCount >= pageSize.value || !nextCursor) {
          return {
            buckets: request.direction === 'backward'
              ? [...collectedBuckets].reverse()
              : collectedBuckets,
            visibleCount,
          }
        }

        operationPhase.value = 'filling'
        fillCollectedCount.value = visibleCount
        fillTargetCount.value = pageSize.value
        fillRequestIndex += 1
        const nextDelayMs = getDynamicFillDelayMs(fillRequestIndex, fillDelayMs.value, fillDelayStepMs.value)
        await fillDelay.wait(nextDelayMs)
        cursor = nextCursor
      }
      catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'The viewer could not load items.'
        operationPhase.value = 'failed'
        fillCollectedCount.value = null
        fillTargetCount.value = null
        return null
      }
      finally {
        inFlightCursors.delete(cursorKey)
      }
    }

    return {
      buckets: request.direction === 'backward'
        ? [...collectedBuckets].reverse()
        : collectedBuckets,
      visibleCount: collectedBuckets.reduce((count, bucket) => {
        return count + getVibeBucketVisibleCount(bucket, options.removedIds.value)
      }, 0),
    }
  }

  function createBucket(options: {
    cursor: string | null
    nextCursor: string | null
    nextItems: VibeViewerItem[]
    previousCursor: string | null
    previousItems: VibeViewerItem[]
  }) {
    const resolvedItems = resolveVibeBucketItems(options.nextItems, options.previousItems, occurrenceSequence)
    occurrenceSequence = resolvedItems.nextSequence

    return {
      cursor: options.cursor,
      items: resolvedItems.items,
      nextCursor: options.nextCursor,
      previousCursor: options.previousCursor,
    }
  }

  function finishLoadPhase() {
    operationPhase.value = 'idle'
    fillCollectedCount.value = null
    fillTargetCount.value = null
    fillDelay.clear()
  }

  function isLoadingInitialPhase() {
    return operationPhase.value === 'loading'
      && autoBuckets.value.length === 0
      && pendingAppendBuckets.value.length === 0
  }

  function needsStaticReload(edge: 'leading' | 'trailing') {
    const targetBucket = edge === 'leading' ? firstBucket.value : lastBucket.value

    if (!targetBucket) {
      return false
    }

    return getVibeBucketVisibleCount(targetBucket, options.removedIds.value) < pageSize.value
  }

  return {
    activeIndex,
    canRetryInitialLoad,
    commitPendingAppend,
    currentCursor,
    errorMessage,
    fillCollectedCount,
    fillDelayRemainingMs,
    fillTargetCount,
    hasNextPage,
    hasPreviousPage,
    items,
    loading,
    mode,
    nextCursor,
    pendingAppendItems,
    phase: operationPhase,
    prefetchNextPage,
    prefetchPreviousPage,
    previousCursor,
    retryInitialLoad,
    setActiveIndex,
    setAutoPrefetchEnabled,
    syncActiveIndexAfterVisibilityChange,
    getActiveOccurrenceKey,
    maybeCommitPendingAppendWhenFilteredOut,
  }
}
