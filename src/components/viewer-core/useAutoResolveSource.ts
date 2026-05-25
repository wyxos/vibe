import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import type { VibeViewerItem } from '../viewer'
import type { VibeLoadPhase } from './removalState'
import {
  type VibeAutoBucket,
  filterRemovedItems,
  flattenVibeBuckets,
  getVibeCursorAtVisibleIndex,
} from './autoBuckets'
import {
  getActiveOccurrenceKey as getActiveOccurrenceKeyFromItems,
  getSyncedActiveIndex,
  hydrateAutoResolveState,
  isBoundaryPageUnderfilled,
} from './autoResolveState'
import { createAutoResolveBucketFactory } from './autoResolveBucketFactory'
import { createAutoResolveFillUntilController } from './autoResolveFillUntil'
import { createAutoResolveLoadingController } from './autoResolveLoading'
import { useFillProgressState } from './fillProgress'
import {
  clamp,
  isActiveLoadPhase,
  normalizePageSize,
  PREFETCH_OFFSET,
  type ResolveFn,
} from './autoResolveHelpers'
import { findLeadingBoundaryBucket, findTrailingBoundaryBucket, getExhaustedNextCursor, markVibeNextCursorExhausted, trimVibeBucketsToVisibleWindow } from './autoResolveCursors'
import { createEmptyVisiblePrefetchScheduler } from './emptyVisiblePrefetch'
import { getVibeOccurrenceKey } from './itemIdentity'
import { DEFAULT_FILL_DELAY_MS, DEFAULT_FILL_DELAY_STEP_MS, getFillDelayMs, normalizeFillDelayMaxMs, normalizeFillDelayMs, useFillDelayCountdown } from './fillDelay'
type VibeAutoEmit = (event: 'update:activeIndex', value: number) => void
export function useAutoResolveSource(options: {
  emit: VibeAutoEmit
  fillDelayMaxMs?: number
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
  pageSize?: number
  removedIds: Ref<Set<string>>
  resolve?: ResolveFn
}) {
  const hasSeededItems = Boolean(options.initialState?.items.length)
  const autoBuckets = ref<VibeAutoBucket[]>([])
  const autoActiveIndex = ref(0)
  const pendingAppendBuckets = ref<VibeAutoBucket[]>([])
  const isLeadingBoundarySuppressed = ref(false)
  const errorMessage = ref<string | null>(null)
  const operationPhase = ref<VibeLoadPhase>(!hasSeededItems && typeof options.resolve === 'function' ? 'initializing' : 'idle')
  const fillCollectedCount = ref<number | null>(null)
  const fillCursor = ref<string | null>(null)
  const fillDelay = useFillDelayCountdown()
  const fillDelayRemainingMs = fillDelay.remainingMs
  const fillTargetCount = ref<number | null>(null)
  const isAwaitingAppendCommit = ref(false)
  const isAutoPrefetchEnabled = ref(true)
  const isFillUntilActive = ref(false)
  const isManualPageLoadingLocked = ref(false)
  const inFlightCursors = new Set<string>()
  let activeResolveController: AbortController | null = null
  let lastLoadAttempt: (() => Promise<void>) | null = null
  let operationSequence = 0
  let occurrenceSequence = 0
  const createBucket = createAutoResolveBucketFactory({ getSequence: () => occurrenceSequence, setSequence: (sequence) => { occurrenceSequence = sequence } })
  const fillDelayMaxMs = computed(() => normalizeFillDelayMaxMs(options.fillDelayMaxMs))
  const fillDelayMs = computed(() => normalizeFillDelayMs(options.fillDelayMs, DEFAULT_FILL_DELAY_MS))
  const fillDelayStepMs = computed(() => normalizeFillDelayMs(options.fillDelayStepMs, DEFAULT_FILL_DELAY_STEP_MS))
  const hasResolver = computed(() => typeof options.resolve === 'function')
  const pageSize = computed(() => normalizePageSize(options.pageSize))
  const sourceItems = computed(() => flattenVibeBuckets(autoBuckets.value))
  const fillProgressState = useFillProgressState(() => sourceItems.value.length)
  const items = computed(() => filterRemovedItems(sourceItems.value, options.removedIds.value))
  const activeIndex = computed(() => autoActiveIndex.value)
  const loading = computed(() => isActiveLoadPhase(operationPhase.value) || isAwaitingAppendCommit.value)
  const leadingBoundaryBucket = computed(() => findLeadingBoundaryBucket(autoBuckets.value, options.removedIds.value))
  const trailingBoundaryBucket = computed(() => findTrailingBoundaryBucket(autoBuckets.value, options.removedIds.value))
  const nextCursor = computed(() => trailingBoundaryBucket.value?.nextCursor ?? null)
  const previousCursor = computed(() => isLeadingBoundarySuppressed.value ? null : (leadingBoundaryBucket.value?.previousCursor ?? null))
  const hasNextPage = computed(() => Boolean(nextCursor.value) && trailingBoundaryBucket.value?.nextCursorExhausted !== true)
  const hasPreviousPage = computed(() => Boolean(previousCursor.value))
  const isPageLoadingLocked = computed(() => isManualPageLoadingLocked.value || isFillUntilActive.value)
  const canRefreshTrailingBoundary = computed(() => hasResolver.value && Boolean(trailingBoundaryBucket.value?.items.length))
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
  const fillUntilController = createAutoResolveFillUntilController({
    autoBuckets,
    clearActiveResolveController(controller) { if (activeResolveController === controller) activeResolveController = null },
    clearFillDelay: (cancel) => fillDelay.clear(cancel),
    createBucket,
    errorMessage,
    fillCollectedCount, fillCursor, fillTargetCount, ...fillProgressState.refs,
    finishLoadPhase,
    getFillDelayMs: (index) => getFillDelayMs(index, fillDelayMs.value, fillDelayStepMs.value, fillDelayMaxMs.value),
    getHasNextPage: () => hasNextPage.value,
    getIsLoading: () => loading.value,
    getIsManualPageLoadingLocked: () => isManualPageLoadingLocked.value,
    getLoadedItemCount: () => sourceItems.value.length,
    getNextCursor: () => nextCursor.value,
    getOperationIsCurrent: (operationId) => operationId === operationSequence,
    getPageSize: () => pageSize.value,
    getResolve: () => options.resolve,
    getTrailingBoundaryBucket: () => trailingBoundaryBucket.value,
    getVisibleItemCount: () => items.value.length,
    inFlightCursors,
    isAwaitingAppendCommit,
    isFillUntilActive,
    nextOperationId: () => ++operationSequence,
    operationPhase,
    pendingAppendBuckets,
    refreshTrailingBoundaryBeforeEnd: async () => { if (canRefreshTrailingBoundary.value) { await prefetchNextPage(); await commitPendingAppend() } },
    setActiveResolveController: (controller) => { activeResolveController = controller },
    setLastLoadAttempt: (attempt) => { lastLoadAttempt = attempt },
    waitFillDelay: (delayMs) => fillDelay.wait(delayMs),
  })
  const emptyVisiblePrefetch = createEmptyVisiblePrefetchScheduler({ canRefreshTrailingBoundary, hasNextPage, isInitialLoading: isLoadingInitialPhase, isPageLoadingLocked, items, loading, prefetchNextPage, removedIds: options.removedIds, trailingBoundaryBucket })
  const loadingController = createAutoResolveLoadingController({
    autoBuckets,
    clearActiveResolveController(controller) { if (activeResolveController === controller) activeResolveController = null },
    clearFillState,
    createBucket,
    errorMessage,
    fillCollectedCount,
    fillCursor,
    fillTargetCount,
    finishLoadPhase,
    getActiveOccurrenceKey,
    getBoundaryBucket: (edge) => edge === 'leading' ? leadingBoundaryBucket.value : trailingBoundaryBucket.value,
    getFillDelayMs: (index) => getFillDelayMs(index, fillDelayMs.value, fillDelayStepMs.value, fillDelayMaxMs.value),
    getOperationIsCurrent: (operationId) => operationId === operationSequence,
    getPageSize: () => pageSize.value,
    getResolve: () => options.resolve,
    getSequence: () => occurrenceSequence,
    inFlightCursors,
    isManualPageLoadingLocked,
    nextOperationId: () => ++operationSequence,
    operationPhase,
    removedIds: options.removedIds,
    setActiveResolveController: (controller) => { activeResolveController = controller },
    setSequence: (sequence) => { occurrenceSequence = sequence },
    syncActiveIndexAfterVisibilityChange,
    waitFillDelay: (delayMs) => fillDelay.wait(delayMs),
  })
  watch(
    () => items.value.length,
    (length) => {
      if (length === 0) { autoActiveIndex.value = 0; emptyVisiblePrefetch.schedule(); return }
      emptyVisiblePrefetch.resetRefreshAttempt()
      if (isLeadingBoundarySuppressed.value) {
        trimBucketsToVisibleWindow()
        isLeadingBoundarySuppressed.value = false
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
      continueUntilFilled: true,
      cursor: options.initialCursor ?? null,
      direction: 'forward',
      phase: 'initializing',
    })
    if (!resolvedBuckets) {
      return
    }
    autoBuckets.value = resolvedBuckets.buckets
    autoActiveIndex.value = 0
    finishLoadPhase()
  }
  async function prefetchNextPage() {
    if (isPageLoadingLocked.value || loading.value) return
    const shouldCommitAppendImmediately = !items.value.length
    const targetBucket = trailingBoundaryBucket.value
    const appendOptions = {
      commitImmediately: shouldCommitAppendImmediately,
      originCursor: targetBucket?.cursor ?? null,
    }
    const exhaustedNextCursor = getExhaustedNextCursor(targetBucket)
    if (needsBoundaryReload('trailing')) {
      if (!canRefreshTrailingBoundary.value) {
        return
      }

      const reloadResult = await reloadBoundaryBucket('trailing')
      if (reloadResult?.followCursor && (reloadResult.itemsInserted === 0 || needsBoundaryReload('trailing'))) {
        await appendBuckets(reloadResult.followCursor, appendOptions)
      }
      return
    }
    if (exhaustedNextCursor) {
      if (targetBucket?.cursor === exhaustedNextCursor) {
        const reloadResult = await reloadBoundaryBucket('trailing')
        if (reloadResult?.followCursor && reloadResult.itemsInserted === 0) await appendBuckets(reloadResult.followCursor, appendOptions)
        return
      }
      await appendBuckets(exhaustedNextCursor, appendOptions)
      return
    }
    if (!hasNextPage.value) {
      const reloadResult = canRefreshTrailingBoundary.value ? await reloadBoundaryBucket('trailing') : null
      if (reloadResult?.followCursor && reloadResult.itemsInserted === 0) await appendBuckets(reloadResult.followCursor, appendOptions)
      return
    }
    await appendBuckets(nextCursor.value, appendOptions)
  }
  async function prefetchPreviousPage() {
    if (isPageLoadingLocked.value || !hasPreviousPage.value || loading.value) return
    if (needsBoundaryReload('leading')) {
      const reloadResult = await reloadBoundaryBucket('leading')
      if (reloadResult?.itemsInserted === 0 && reloadResult.followCursor) {
        await prependBuckets(reloadResult.followCursor)
      }
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
    isLeadingBoundarySuppressed.value = false
    errorMessage.value = null
    operationPhase.value = hasResolver.value ? 'initializing' : 'idle'
    clearFillState()
    fillProgressState.reset()
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
    if (isPageLoadingLocked.value || operationPhase.value !== 'failed' || !lastLoadAttempt) return
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
  function setAutoPrefetchEnabled(nextValue: boolean) { isAutoPrefetchEnabled.value = nextValue; emptyVisiblePrefetch.schedule() }
  function lockPageLoading() {
    isManualPageLoadingLocked.value = true
    fillDelay.clear(true)
  }
  function unlockPageLoading() { isManualPageLoadingLocked.value = false; emptyVisiblePrefetch.schedule() }
  function cancel() {
    abortActiveResolve()
    errorMessage.value = null
    clearFillState()
    fillUntilController.cancel()
    if (pendingAppendBuckets.value.length > 0) {
      autoBuckets.value = [...autoBuckets.value, ...pendingAppendBuckets.value]
      pendingAppendBuckets.value = []
    }
    isAwaitingAppendCommit.value = false
    isLeadingBoundarySuppressed.value = false
    finishLoadPhase()
  }
  function cancelFill() { if (!isFillUntilActive.value) return; abortActiveResolve(); clearFillState(); fillUntilController.cancel(); isAwaitingAppendCommit.value = false; finishLoadPhase() }
  function abortActiveResolve() { operationSequence += 1; activeResolveController?.abort(); activeResolveController = null; fillDelay.clear(true); inFlightCursors.clear() }
  function getActiveOccurrenceKey() {
    return getActiveOccurrenceKeyFromItems(items.value, activeIndex.value)
  }
  function syncActiveIndexAfterVisibilityChange(
    anchorOccurrenceKey: string | null = null,
    options: { preserveTrailingPlaceholder?: boolean } = {},
  ) {
    if (items.value.length === 0) {
      autoActiveIndex.value = 0
      if (!options.preserveTrailingPlaceholder && autoBuckets.value.length > 0) {
        isLeadingBoundarySuppressed.value = true
      }
      return
    }

    if (anchorOccurrenceKey) {
      const anchoredIndex = items.value.findIndex((item) => getVibeOccurrenceKey(item) === anchorOccurrenceKey)

      if (anchoredIndex >= 0) {
        autoActiveIndex.value = anchoredIndex
        return
      }
    }

    if (options.preserveTrailingPlaceholder && autoActiveIndex.value >= items.value.length) {
      autoActiveIndex.value = items.value.length
      return
    }

    autoActiveIndex.value = getSyncedActiveIndex(items.value, activeIndex.value, anchorOccurrenceKey)
  }
  function maybeCommitPendingAppendWhenFilteredOut() {
    if (pendingAppendBuckets.value.length > 0 && (!pendingAppendItems.value.length || !items.value.length)) void commitPendingAppend()
  }
  async function maybePrefetchAround(refreshExhausted = true) {
    if (!isAutoPrefetchEnabled.value || isLoadingInitialPhase()) return
    if (!items.value.length) {
      if (hasNextPage.value || canRefreshTrailingBoundary.value) await prefetchNextPage()
      return
    }
    if (hasPreviousPage.value && autoActiveIndex.value < PREFETCH_OFFSET) await prefetchPreviousPage()
    if ((hasNextPage.value || (refreshExhausted && canRefreshTrailingBoundary.value)) && autoActiveIndex.value >= items.value.length - PREFETCH_OFFSET) await prefetchNextPage()
  }
  async function appendBuckets(cursor: string | null, appendOptions: { commitImmediately?: boolean, originCursor?: string | null } = {}) {
    lastLoadAttempt = async () => {
      await appendBuckets(cursor, appendOptions)
    }
    const resolvedBuckets = await collectBuckets({
      continueUntilFilled: true,
      cursor,
      direction: 'forward',
      phase: 'loading',
    })
    if (!resolvedBuckets) return
    if (!resolvedBuckets.visibleCount) {
      autoBuckets.value = markVibeNextCursorExhausted(autoBuckets.value, appendOptions.originCursor, cursor, true)
      pendingAppendBuckets.value = []
      isAwaitingAppendCommit.value = false
      return finishLoadPhase()
    }
    if (resolvedBuckets.canceled) {
      autoBuckets.value = [...autoBuckets.value, ...resolvedBuckets.buckets]
      pendingAppendBuckets.value = []
      isAwaitingAppendCommit.value = false
      return finishLoadPhase()
    }
    pendingAppendBuckets.value = resolvedBuckets.buckets
    if (appendOptions.commitImmediately || !items.value.length || !pendingAppendItems.value.length) {
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
      continueUntilFilled: true,
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
  async function reloadBoundaryBucket(edge: 'leading' | 'trailing'): Promise<{
    followCursor: string | null
    itemsInserted: number
  } | null> {
    lastLoadAttempt = async () => {
      await reloadBoundaryBucket(edge)
    }
    return loadingController.reloadBoundaryBucket(edge)
  }
  function collectBuckets(request: Parameters<typeof loadingController.collectBuckets>[0]) {
    return loadingController.collectBuckets(request)
  }
  function finishLoadPhase() {
    operationPhase.value = 'idle'
    clearFillState()
    fillDelay.clear(); emptyVisiblePrefetch.schedule()
  }
  function clearFillState() {
    fillCollectedCount.value = null
    fillCursor.value = null
    fillTargetCount.value = null
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
    isLeadingBoundarySuppressed.value = false
    errorMessage.value = null
    pendingAppendBuckets.value = []
    isAwaitingAppendCommit.value = false
    return true
  }
  function isLoadingInitialPhase() {
    return operationPhase.value === 'initializing'
  }
  function needsBoundaryReload(edge: 'leading' | 'trailing') {
    const targetBucket = edge === 'leading' ? leadingBoundaryBucket.value : trailingBoundaryBucket.value
    return isBoundaryPageUnderfilled(targetBucket, options.removedIds.value, pageSize.value)
  }
  function trimBucketsToVisibleWindow() {
    autoBuckets.value = trimVibeBucketsToVisibleWindow(autoBuckets.value, options.removedIds.value)
  }
  return {
    activeIndex,
    canRetryInitialLoad,
    cancel,
    cancelFill,
    canRefreshTrailingBoundary,
    commitPendingAppend,
    currentCursor,
    errorMessage,
    fillCollectedCount, fillCursor, fillDelayRemainingMs, fillTargetCount, ...fillProgressState.refs,
    fillUntil: fillUntilController.fillUntil,
    fillUntilEnd: fillUntilController.fillUntilEnd,
    hasNextPage,
    hasPreviousPage,
    isAutoPrefetchEnabled,
    isPageLoadingLocked,
    items,
    lockPageLoading,
    loading,
    maybePrefetchAround,
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
    unlockPageLoading,
    getActiveOccurrenceKey,
    maybeCommitPendingAppendWhenFilteredOut,
  }
}
