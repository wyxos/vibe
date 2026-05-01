import { computed, nextTick } from 'vue'

import type { VibeViewerItem } from '../viewer'
import { PREFETCH_OFFSET } from './autoResolveHelpers'
import type { VibeEmptyStateMode } from './surfaceSlots'
import { getVibeOccurrenceKey } from './itemIdentity'
import { useVibeRemovalState } from './removalState'
import { useAutoResolveSource } from './useAutoResolveSource'

export type { VibeHandle, VibeRemoveResult } from './removalState'
export type { VibeFillMode, VibeLoadPhase, VibeSurfaceMode } from './removalState'

export interface VibeResolveParams {
  cursor: string | null
  pageSize: number
  signal?: AbortSignal
}

export interface VibeResolveResult {
  items: VibeViewerItem[]
  nextPage: string | null
  previousPage?: string | null
  total?: number | null
}

export interface VibeInitialState {
  items: VibeViewerItem[]
  cursor: string | null
  nextCursor?: string | null
  previousCursor?: string | null
  activeIndex?: number
}

export interface VibeProps {
  bottomLoadBufferPx?: number
  emptyStateMode?: VibeEmptyStateMode
  fillDelayMs?: number
  fillDelayStepMs?: number
  initialCursor?: string | null
  initialState?: VibeInitialState
  loopFullscreenVideo?: boolean
  pageSize?: number
  paginationDetail?: string | null
  resolve?: (params: VibeResolveParams) => Promise<VibeResolveResult>
  showDominantImageTone?: boolean
  showEndBadge?: boolean
  showStatusBadges?: boolean
  surfaceMode?: import('./removalState').VibeSurfaceMode
}

export interface VibeEmit {
  (event: 'update:activeIndex', value: number): void
  (event: 'update:surfaceMode', value: import('./removalState').VibeSurfaceMode): void
}

export function useDataSource(props: Readonly<VibeProps>, emit: VibeEmit) {
  const removalState = useVibeRemovalState()
  const {
    clearRemoved,
    getRemovedIds,
    remove: removeRemovedIds,
    removedIds,
    restore: restoreRemovedIds,
    undo: undoRemovedIds,
  } = removalState
  const autoSource = useAutoResolveSource({
    emit,
    fillDelayMs: props.fillDelayMs,
    fillDelayStepMs: props.fillDelayStepMs,
    initialCursor: props.initialCursor,
    initialState: props.initialState,
    pageSize: props.pageSize,
    removedIds,
    resolve: props.resolve,
  })

  const items = autoSource.items
  const activeIndex = autoSource.activeIndex
  const loading = autoSource.loading
  const hasNextPage = autoSource.hasNextPage
  const hasPreviousPage = autoSource.hasPreviousPage
  const removedCount = computed(() => removedIds.value.size)
  const paginationDetail = computed(() => props.paginationDetail ?? null)
  const canRefreshExhaustedNextPage = computed(() => (
    !autoSource.hasNextPage.value && autoSource.canRefreshTrailingBoundary.value
  ))

  function setActiveIndex(nextIndex: number) {
    const nextItems = items.value

    if (!nextItems.length) {
      return
    }

    autoSource.setActiveIndex(clamp(nextIndex, 0, nextItems.length - 1))
  }

  function remove(ids: string | string[]) {
    const anchorOccurrenceKey = autoSource.getActiveOccurrenceKey()
    const currentItem = items.value[activeIndex.value] ?? null
    const removedIds = Array.isArray(ids) ? ids : [ids]
    const shouldPrefetchAfterRemoval = Boolean(
      currentItem
      && removedIds.includes(currentItem.id)
      && autoSource.isAutoPrefetchEnabled.value
      && activeIndex.value >= items.value.length - PREFETCH_OFFSET,
    )
    const shouldPreserveTrailingPlaceholder = Boolean(
      currentItem
      && removedIds.includes(currentItem.id)
      && autoSource.hasNextPage.value
      && activeIndex.value === items.value.length - 1,
    )
    const result = removeRemovedIds(ids)

    if (!result.ids.length) {
      return result
    }

    autoSource.maybeCommitPendingAppendWhenFilteredOut()
    autoSource.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey, {
      preserveTrailingPlaceholder: shouldPreserveTrailingPlaceholder,
    })
    if (shouldPrefetchAfterRemoval) {
      scheduleMaybePrefetchAround()
    }
    return result
  }

  function scheduleMaybePrefetchAround() {
    void nextTick().then(() => autoSource.maybePrefetchAround())
  }

  function restore(ids: string | string[]) {
    const anchorOccurrenceKey = autoSource.getActiveOccurrenceKey()
    const result = restoreRemovedIds(ids)

    if (!result.ids.length) {
      return result
    }

    autoSource.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
    return result
  }

  function undo() {
    const anchorOccurrenceKey = autoSource.getActiveOccurrenceKey()
    const result = undoRemovedIds()

    if (!result?.ids.length) {
      return result
    }

    autoSource.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
    return result
  }

  function resetRemovedItems() {
    const anchorOccurrenceKey = autoSource.getActiveOccurrenceKey()
    clearRemoved()
    autoSource.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
  }

  function getItems() {
    return [...items.value]
  }

  function getItemByOccurrenceKey(occurrenceKey: string) {
    return items.value.find((item) => getVibeOccurrenceKey(item) === occurrenceKey) ?? null
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function cancel() {
    autoSource.cancel()
  }

  async function loadNext() {
    await autoSource.prefetchNextPage()
  }

  async function loadPrevious() {
    await autoSource.prefetchPreviousPage()
  }

  async function retry() {
    await autoSource.retry()
  }

  return {
    activeIndex,
    canRefreshExhaustedNextPage,
    canRetryInitialLoad: autoSource.canRetryInitialLoad,
    cancel,
    cancelFill: autoSource.cancelFill,
    clearRemoved: resetRemovedItems,
    commitPendingAppend: autoSource.commitPendingAppend,
    currentCursor: autoSource.currentCursor,
    errorMessage: autoSource.errorMessage,
    fillCollectedCount: autoSource.fillCollectedCount,
    fillCompletedCalls: autoSource.fillCompletedCalls,
    fillCursor: autoSource.fillCursor,
    fillDelayRemainingMs: autoSource.fillDelayRemainingMs,
    fillLoadedCount: autoSource.fillLoadedCount,
    fillMode: autoSource.fillMode,
    fillProgress: autoSource.fillProgress,
    fillTargetCalls: autoSource.fillTargetCalls,
    fillTargetCount: autoSource.fillTargetCount,
    fillTotalCount: autoSource.fillTotalCount,
    fillUntil: autoSource.fillUntil,
    fillUntilEnd: autoSource.fillUntilEnd,
    getItemByOccurrenceKey,
    getItems,
    getRemovedIds,
    hasNextPage,
    hasPreviousPage,
    isPageLoadingLocked: autoSource.isPageLoadingLocked,
    items,
    lockPageLoading: autoSource.lockPageLoading,
    loading,
    loadNext,
    loadPrevious,
    nextCursor: autoSource.nextCursor,
    paginationDetail,
    pendingAppendItems: autoSource.pendingAppendItems,
    phase: autoSource.phase,
    prefetchNextPage: autoSource.prefetchNextPage,
    prefetchPreviousPage: autoSource.prefetchPreviousPage,
    previousCursor: autoSource.previousCursor,
    removedCount,
    remove,
    restore,
    retry,
    retryInitialLoad: autoSource.retryInitialLoad,
    setActiveIndex,
    setAutoPrefetchEnabled: autoSource.setAutoPrefetchEnabled,
    undo,
    unlockPageLoading: autoSource.unlockPageLoading,
  }
}
