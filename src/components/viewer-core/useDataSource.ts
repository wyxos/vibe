import { computed, ref, watch } from 'vue'

import type { VibeViewerItem } from '../viewer'
import { getVibeOccurrenceKey, reconcileVibeOccurrenceKeys } from './itemIdentity'
import { useVibeRemovalState } from './removalState'
import { useAutoResolveSource } from './useAutoResolveSource'

export type { VibeHandle, VibeRemoveResult } from './removalState'
export type { VibeFeedMode, VibeLoadPhase } from './removalState'

export interface VibeResolveParams {
  cursor: string | null
  pageSize: number
}

export interface VibeResolveResult {
  items: VibeViewerItem[]
  nextPage: string | null
  previousPage?: string | null
}

interface VibeSharedProps {
  hasPreviousPage?: boolean
  paginationDetail?: string | null
  requestNextPage?: (() => void | Promise<void>) | null
  requestPreviousPage?: (() => void | Promise<void>) | null
}

export interface VibeControlledProps extends VibeSharedProps {
  items: VibeViewerItem[]
  activeIndex?: number
  loading?: boolean
  hasNextPage?: boolean
  mode?: never
  resolve?: never
  initialCursor?: never
  pageSize?: never
}

export interface VibeAutoProps {
  resolve: (params: VibeResolveParams) => Promise<VibeResolveResult>
  initialCursor?: string | null
  mode?: import('./removalState').VibeFeedMode
  pageSize?: number
  items?: never
  activeIndex?: never
  hasPreviousPage?: never
  loading?: never
  hasNextPage?: never
  paginationDetail?: never
  requestNextPage?: never
  requestPreviousPage?: never
}

export type VibeProps = VibeControlledProps | VibeAutoProps

export type VibeEmit = (event: 'update:activeIndex', value: number) => void

export function useDataSource(props: Readonly<VibeProps>, emit: VibeEmit) {
  const controlledProps = props as Partial<VibeControlledProps>
  const autoProps = props as Partial<VibeAutoProps>
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
    initialCursor: autoProps.initialCursor,
    mode: autoProps.mode,
    pageSize: autoProps.pageSize,
    removedIds,
    resolve: autoProps.resolve,
  })

  let hasWarnedMixedProps = false
  let occurrenceSequence = 0
  const controlledSourceItems = ref<VibeViewerItem[]>([])
  const isAutoMode = computed(() => typeof autoProps.resolve === 'function')
  const controlledItems = computed(() => {
    if (!removedIds.value.size) {
      return controlledSourceItems.value
    }

    return controlledSourceItems.value.filter((item) => !removedIds.value.has(item.id))
  })
  const items = computed(() => isAutoMode.value ? autoSource.items.value : controlledItems.value)
  const activeIndex = computed(() => isAutoMode.value ? autoSource.activeIndex.value : (controlledProps.activeIndex ?? 0))
  const loading = computed(() => isAutoMode.value ? autoSource.loading.value : (controlledProps.loading ?? false))
  const hasNextPage = computed(() => isAutoMode.value ? autoSource.hasNextPage.value : (controlledProps.hasNextPage ?? false))
  const hasPreviousPage = computed(() => isAutoMode.value ? autoSource.hasPreviousPage.value : (controlledProps.hasPreviousPage ?? false))
  const removedCount = computed(() => removedIds.value.size)
  const paginationDetail = computed(() => controlledProps.paginationDetail ?? null)

  watch(
    [() => controlledProps.items, () => autoProps.resolve],
    ([maybeItems, maybeResolve]) => {
      if (!Array.isArray(maybeItems) || typeof maybeResolve !== 'function' || hasWarnedMixedProps) {
        return
      }

      hasWarnedMixedProps = true
      console.warn('[Vibe] `resolve` and `items` were both provided. `resolve` mode will be used.')
    },
    {
      immediate: true,
    },
  )

  watch(
    () => controlledProps.items ?? [],
    (nextItems) => {
      if (isAutoMode.value) {
        return
      }

      const resolvedItems = reconcileVibeOccurrenceKeys(nextItems, controlledSourceItems.value, occurrenceSequence)
      controlledSourceItems.value = resolvedItems.items
      occurrenceSequence = resolvedItems.nextSequence
    },
    {
      deep: true,
      immediate: true,
    },
  )

  function setActiveIndex(nextIndex: number) {
    const nextItems = items.value

    if (!nextItems.length) {
      return
    }

    const clampedIndex = clamp(nextIndex, 0, nextItems.length - 1)

    if (isAutoMode.value) {
      autoSource.setActiveIndex(clampedIndex)
      return
    }

    if (clampedIndex !== (controlledProps.activeIndex ?? 0)) {
      emit('update:activeIndex', clampedIndex)
    }
  }

  function remove(ids: string | string[]) {
    const anchorOccurrenceKey = getActiveOccurrenceKey()
    const result = removeRemovedIds(ids)

    if (!result.ids.length) {
      return result
    }

    if (isAutoMode.value) {
      autoSource.maybeCommitPendingAppendWhenFilteredOut()
      autoSource.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
      return result
    }

    syncControlledActiveIndex(anchorOccurrenceKey)
    return result
  }

  function restore(ids: string | string[]) {
    const anchorOccurrenceKey = getActiveOccurrenceKey()
    const result = restoreRemovedIds(ids)

    if (!result.ids.length) {
      return result
    }

    if (isAutoMode.value) {
      autoSource.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
      return result
    }

    syncControlledActiveIndex(anchorOccurrenceKey)
    return result
  }

  function undo() {
    const anchorOccurrenceKey = getActiveOccurrenceKey()
    const result = undoRemovedIds()

    if (!result?.ids.length) {
      return result
    }

    if (isAutoMode.value) {
      autoSource.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
      return result
    }

    syncControlledActiveIndex(anchorOccurrenceKey)
    return result
  }

  function resetRemovedItems() {
    const anchorOccurrenceKey = getActiveOccurrenceKey()
    clearRemoved()

    if (isAutoMode.value) {
      autoSource.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
      return
    }

    syncControlledActiveIndex(anchorOccurrenceKey)
  }

  function getActiveOccurrenceKey() {
    const currentItem = items.value[clamp(activeIndex.value, 0, Math.max(0, items.value.length - 1))]
    return currentItem ? getVibeOccurrenceKey(currentItem) : null
  }

  function syncControlledActiveIndex(anchorId: string | null = null) {
    if (!items.value.length) {
      return
    }

    const anchoredIndex = anchorId
      ? items.value.findIndex((item) => getVibeOccurrenceKey(item) === anchorId)
      : -1
    const clampedIndex = anchoredIndex >= 0 ? anchoredIndex : clamp(activeIndex.value, 0, items.value.length - 1)

    if (clampedIndex !== (controlledProps.activeIndex ?? 0)) {
      emit('update:activeIndex', clampedIndex)
    }
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  return {
    activeIndex,
    canRetryInitialLoad: computed(() => isAutoMode.value ? autoSource.canRetryInitialLoad.value : false),
    clearRemoved: resetRemovedItems,
    commitPendingAppend: autoSource.commitPendingAppend,
    currentCursor: computed(() => isAutoMode.value ? autoSource.currentCursor.value : null),
    errorMessage: computed(() => isAutoMode.value ? autoSource.errorMessage.value : null),
    fillCollectedCount: computed(() => isAutoMode.value ? autoSource.fillCollectedCount.value : null),
    fillDelayRemainingMs: computed(() => isAutoMode.value ? autoSource.fillDelayRemainingMs.value : null),
    fillTargetCount: computed(() => isAutoMode.value ? autoSource.fillTargetCount.value : null),
    getRemovedIds,
    hasNextPage,
    hasPreviousPage,
    isAutoMode,
    items,
    loading,
    mode: computed(() => isAutoMode.value ? autoSource.mode.value : null),
    nextCursor: computed(() => isAutoMode.value ? autoSource.nextCursor.value : null),
    paginationDetail,
    pendingAppendItems: autoSource.pendingAppendItems,
    phase: computed(() => isAutoMode.value ? autoSource.phase.value : (loading.value ? 'loading' : 'idle')),
    prefetchNextPage: isAutoMode.value ? autoSource.prefetchNextPage : async () => {
      if (loading.value || typeof controlledProps.requestNextPage !== 'function') {
        return
      }

      await controlledProps.requestNextPage()
    },
    prefetchPreviousPage: isAutoMode.value ? autoSource.prefetchPreviousPage : async () => {
      if (loading.value || typeof controlledProps.requestPreviousPage !== 'function') {
        return
      }

      await controlledProps.requestPreviousPage()
    },
    previousCursor: computed(() => isAutoMode.value ? autoSource.previousCursor.value : null),
    removedCount,
    remove,
    restore,
    retryInitialLoad: autoSource.retryInitialLoad,
    setActiveIndex,
    setAutoPrefetchEnabled: autoSource.setAutoPrefetchEnabled,
    undo,
  }
}
