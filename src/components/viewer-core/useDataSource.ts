import { computed } from 'vue'

import type { VibeViewerItem } from '../viewer'
import { useVibeRemovalState } from './removalState'
import { useAutoResolveSource } from './useAutoResolveSource'

export type { VibeHandle, VibeRemoveResult } from './removalState'
export type { VibeFeedMode, VibeLoadPhase, VibeSurfaceMode } from './removalState'

export interface VibeResolveParams {
  cursor: string | null
  pageSize: number
  signal?: AbortSignal
}

export interface VibeResolveResult {
  items: VibeViewerItem[]
  nextPage: string | null
  previousPage?: string | null
}

export interface VibeInitialState {
  items: VibeViewerItem[]
  cursor: string | null
  nextCursor?: string | null
  previousCursor?: string | null
  activeIndex?: number
}

export interface VibeProps {
  fillDelayMs?: number
  fillDelayStepMs?: number
  initialCursor?: string | null
  initialState?: VibeInitialState
  mode?: import('./removalState').VibeFeedMode
  pageSize?: number
  paginationDetail?: string | null
  resolve?: (params: VibeResolveParams) => Promise<VibeResolveResult>
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
    mode: props.mode,
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
    const result = removeRemovedIds(ids)

    if (!result.ids.length) {
      return result
    }

    autoSource.maybeCommitPendingAppendWhenFilteredOut()
    autoSource.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
    return result
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
    clearRemoved: resetRemovedItems,
    commitPendingAppend: autoSource.commitPendingAppend,
    currentCursor: autoSource.currentCursor,
    errorMessage: autoSource.errorMessage,
    fillCollectedCount: autoSource.fillCollectedCount,
    fillDelayRemainingMs: autoSource.fillDelayRemainingMs,
    fillTargetCount: autoSource.fillTargetCount,
    getRemovedIds,
    hasNextPage,
    hasPreviousPage,
    items,
    loading,
    loadNext,
    loadPrevious,
    mode: autoSource.mode,
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
  }
}
