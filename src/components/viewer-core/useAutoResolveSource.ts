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
} from './autoBuckets'
import {
  createAutoResolveBucket,
  finalizeCollectedBuckets,
  getActiveOccurrenceKey as getActiveOccurrenceKeyFromItems,
  getSyncedActiveIndex,
  hydrateAutoResolveState,
  isAbortError,
  isStaticBoundaryUnderfilled,
  type VibeCollectedBuckets,
} from './autoResolveState'
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
type VibeAutoEmit = (event: 'update:activeIndex', value: number) => void
export function useAutoResolveSource(options: {
  emit: VibeAutoEmit
  fillDelayMs?: number
  fillDelayStepMs?: number
  initialCursor?: string | null
  initialState?: {
    activeIndex?: number
    cursor: string | null
    items: VibeViewerItem[]
    nextCursor?: string | null
    previousCursor?: string | null
  }
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
  let activeResolveController: AbortController | null = null
  let lastLoadAttempt: (() => Promise<void>) | null = null
  let operationSequence = 0
  let occurrenceSequence = 0
  const fillDelayMs = computed(() => normalizeDynamicFillDelayMs(options.fillDelayMs, DEFAULT_DYNAMIC_FILL_DELAY_MS))
  const fillDelayStepMs = computed(() => normalizeDynamicFillDelayMs(options.fillDelayStepMs, DEFAULT_DYNAMIC_FILL_DELAY_STEP_MS))
  const hasResolver = computed(() => typeof options.resolve === 'function')
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
  const canRefreshTrailingBoundary = computed(() => hasResolver.value && autoBuckets.value.length > 0)
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
    if (hydrateInitialState()) {
      return
    }
    if (!options.resolve) {
      return
    }
    void loadInitialBuckets()
  })
  onBeforeUnmount(() => {
    activeResolveController?.abort()
    activeResolveController = null
    fillDelay.clear(true)
  })
  async function loadInitialBuckets() {
    lastLoadAttempt = loadInitialBuckets
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
    if (loading.value) return
    if (!hasNextPage.value) {
      if (!canRefreshTrailingBoundary.value) {
        return
      }

      return reloadBoundaryBucket('trailing')
    }
    if (mode.value === 'static' && needsStaticReload('trailing')) return reloadBoundaryBucket('trailing')
    await appendBuckets(nextCursor.value)
  }
  async function prefetchPreviousPage() {
    if (!hasPreviousPage.value || loading.value) return
    if (mode.value === 'static' && needsStaticReload('leading')) return reloadBoundaryBucket('leading')
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
    activeResolveController?.abort()
    activeResolveController = null
    fillDelay.clear(true)
    if (hydrateInitialState()) {
      finishLoadPhase()
      return
    }
    await loadInitialBuckets()
  }
  async function retry() {
    if (canRetryInitialLoad.value) return retryInitialLoad()
    if (operationPhase.value !== 'failed' || !lastLoadAttempt) return
    errorMessage.value = null
    await lastLoadAttempt()
  }
  async function commitPendingAppend() {
    if (!pendingAppendBuckets.value.length) {
      isAwaitingAppendCommit.value = false
      return finishLoadPhase()
    }
    autoBuckets.value = [...autoBuckets.value, ...pendingAppendBuckets.value]
    pendingAppendBuckets.value = []
    isAwaitingAppendCommit.value = false
    finishLoadPhase()
  }
  function setActiveIndex(nextIndex: number) {
    const nextItems = items.value
    if (!nextItems.length) return
    const clampedIndex = clamp(nextIndex, 0, nextItems.length - 1)
    if (clampedIndex === autoActiveIndex.value) return
    autoActiveIndex.value = clampedIndex
    options.emit('update:activeIndex', clampedIndex)
  }
  function setAutoPrefetchEnabled(nextValue: boolean) {
    isAutoPrefetchEnabled.value = nextValue
  }
  function cancel() {
    operationSequence += 1
    activeResolveController?.abort()
    activeResolveController = null
    fillDelay.clear(true)
    inFlightCursors.clear()
    errorMessage.value = null
    fillCollectedCount.value = null
    fillTargetCount.value = null
    if (pendingAppendBuckets.value.length > 0) {
      autoBuckets.value = [...autoBuckets.value, ...pendingAppendBuckets.value]
      pendingAppendBuckets.value = []
    }
    isAwaitingAppendCommit.value = false
    finishLoadPhase()
  }
  function getActiveOccurrenceKey() {
    return getActiveOccurrenceKeyFromItems(items.value, activeIndex.value)
  }
  function syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey: string | null = null) {
    autoActiveIndex.value = getSyncedActiveIndex(items.value, activeIndex.value, anchorOccurrenceKey)
  }
  function maybeCommitPendingAppendWhenFilteredOut() {
    if (pendingAppendBuckets.value.length > 0 && !pendingAppendItems.value.length) void commitPendingAppend()
  }
  async function maybePrefetchAround() {
    if (!items.value.length || isLoadingInitialPhase()) return
    if (hasPreviousPage.value && autoActiveIndex.value < PREFETCH_OFFSET) await prefetchPreviousPage()
    if (hasNextPage.value && autoActiveIndex.value >= items.value.length - PREFETCH_OFFSET) await prefetchNextPage()
  }
  async function appendBuckets(cursor: string | null) {
    lastLoadAttempt = async () => {
      await appendBuckets(cursor)
    }
    const resolvedBuckets = await collectBuckets({
      continueUntilFilled: mode.value === 'dynamic',
      cursor,
      direction: 'forward',
      phase: 'loading',
    })
    if (!resolvedBuckets) return
    if (resolvedBuckets.canceled) {
      autoBuckets.value = [...autoBuckets.value, ...resolvedBuckets.buckets]
      pendingAppendBuckets.value = []
      isAwaitingAppendCommit.value = false
      return finishLoadPhase()
    }
    pendingAppendBuckets.value = resolvedBuckets.buckets
    if (!pendingAppendItems.value.length) {
      autoBuckets.value = [...autoBuckets.value, ...pendingAppendBuckets.value]
      pendingAppendBuckets.value = []
      isAwaitingAppendCommit.value = false
      return finishLoadPhase()
    }
    isAwaitingAppendCommit.value = true
  }
  async function prependBuckets(cursor: string | null) {
    lastLoadAttempt = async () => {
      await prependBuckets(cursor)
    }
    const resolvedBuckets = await collectBuckets({
      continueUntilFilled: mode.value === 'dynamic',
      cursor,
      direction: 'backward',
      phase: 'loading',
    })
    if (!resolvedBuckets) return
    const anchorOccurrenceKey = getActiveOccurrenceKey()
    autoBuckets.value = [...resolvedBuckets.buckets, ...autoBuckets.value]
    syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
    finishLoadPhase()
  }
  async function reloadBoundaryBucket(edge: 'leading' | 'trailing') {
    lastLoadAttempt = async () => {
      await reloadBoundaryBucket(edge)
    }
    if (!options.resolve) return
    const targetBucket = edge === 'leading' ? firstBucket.value : lastBucket.value
    if (!targetBucket) return
    const cursorKey = getCursorKey(targetBucket.cursor)
    if (inFlightCursors.has(cursorKey)) return
    inFlightCursors.add(cursorKey)
    errorMessage.value = null
    operationPhase.value = 'reloading'
    fillCollectedCount.value = null
    fillTargetCount.value = null
    const operationId = ++operationSequence
    const resolveController = typeof AbortController === 'undefined' ? null : new AbortController()
    activeResolveController = resolveController
    try {
      const response = await options.resolve({
        cursor: targetBucket.cursor,
        pageSize: pageSize.value,
        signal: resolveController?.signal,
      })
      if (operationId !== operationSequence) return finishLoadPhase()
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
      if (isAbortError(error) || operationId !== operationSequence) {
        finishLoadPhase()
        return
      }
      errorMessage.value = error instanceof Error ? error.message : 'The viewer could not load items.'
      operationPhase.value = 'failed'
      fillCollectedCount.value = null
      fillTargetCount.value = null
    }
    finally {
      if (activeResolveController === resolveController) activeResolveController = null
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
    const operationId = ++operationSequence
    const visitedCursorKeys = new Set<string>()
    const collectedBuckets: VibeAutoBucket[] = []
    let cursor = request.cursor
    let fillRequestIndex = 0
    errorMessage.value = null
    operationPhase.value = request.phase
    fillCollectedCount.value = null
    fillTargetCount.value = null
    while (true) {
      if (operationId !== operationSequence) return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, true)
      const cursorKey = getCursorKey(cursor)
      if (visitedCursorKeys.has(cursorKey) || inFlightCursors.has(cursorKey)) {
        break
      }
      visitedCursorKeys.add(cursorKey)
      inFlightCursors.add(cursorKey)
      const resolveController = typeof AbortController === 'undefined' ? null : new AbortController()
      activeResolveController = resolveController
      try {
        const response = await options.resolve({
          cursor,
          pageSize: pageSize.value,
          signal: resolveController?.signal,
        })
        if (operationId !== operationSequence) return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, true)
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
            canceled: false,
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
        if (operationId !== operationSequence) return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, true)
        cursor = nextCursor
      }
      catch (error) {
        if (isAbortError(error) || operationId !== operationSequence) {
          return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, true)
        }
        errorMessage.value = error instanceof Error ? error.message : 'The viewer could not load items.'
        operationPhase.value = 'failed'
        fillCollectedCount.value = null
        fillTargetCount.value = null
        return null
      }
      finally {
        if (activeResolveController === resolveController) activeResolveController = null
        inFlightCursors.delete(cursorKey)
      }
    }
    return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, false)
  }
  function createBucket(options: {
    cursor: string | null
    nextCursor: string | null
    nextItems: VibeViewerItem[]
    previousCursor: string | null
    previousItems: VibeViewerItem[]
  }) {
    const created = createAutoResolveBucket({
      cursor: options.cursor,
      nextCursor: options.nextCursor,
      nextItems: options.nextItems,
      previousCursor: options.previousCursor,
      previousItems: options.previousItems,
      sequence: occurrenceSequence,
    })
    occurrenceSequence = created.nextSequence
    return created.bucket
  }
  function finishLoadPhase() {
    operationPhase.value = 'idle'
    fillCollectedCount.value = null
    fillTargetCount.value = null
    fillDelay.clear()
  }
  function hydrateInitialState() {
    if (!options.initialState || !options.initialState.items.length) return false
    const hydratedState = hydrateAutoResolveState({
      initialState: options.initialState,
      removedIds: options.removedIds.value,
      sequence: occurrenceSequence,
    })
    autoBuckets.value = hydratedState.buckets
    autoActiveIndex.value = hydratedState.activeIndex
    occurrenceSequence = hydratedState.nextSequence
    errorMessage.value = null
    pendingAppendBuckets.value = []
    isAwaitingAppendCommit.value = false
    return true
  }
  function isLoadingInitialPhase() {
    return operationPhase.value === 'loading' && autoBuckets.value.length === 0 && pendingAppendBuckets.value.length === 0
  }
  function needsStaticReload(edge: 'leading' | 'trailing') {
    const targetBucket = edge === 'leading' ? firstBucket.value : lastBucket.value
    return isStaticBoundaryUnderfilled(targetBucket, options.removedIds.value, pageSize.value)
  }
  return {
    activeIndex,
    canRetryInitialLoad,
    cancel,
    canRefreshTrailingBoundary,
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
    retry,
    setActiveIndex,
    setAutoPrefetchEnabled,
    syncActiveIndexAfterVisibilityChange,
    getActiveOccurrenceKey,
    maybeCommitPendingAppendWhenFilteredOut,
  }
}
