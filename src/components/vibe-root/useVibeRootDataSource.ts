import { computed, onMounted, ref, watch } from 'vue'

import type { VibeViewerItem } from '../vibeViewer'
import { getVibeOccurrenceKey, reconcileVibeOccurrenceKeys } from './itemIdentity'
import { useVibeRemovalState } from './removalState'

export type { VibeRootHandle, VibeRootRemoveResult } from './removalState'

const DEFAULT_PAGE_SIZE = 25
const PREFETCH_OFFSET = 3
const INITIAL_CURSOR_KEY = '__vibe_initial_cursor__'

export interface VibeGetItemsParams {
  cursor: string | null
  pageSize: number
}

export interface VibeGetItemsResult {
  items: VibeViewerItem[]
  nextPage: string | null
  previousPage?: string | null
}

interface VibeRootSharedProps {
  hasPreviousPage?: boolean
  paginationDetail?: string | null
  requestNextPage?: (() => void | Promise<void>) | null
  requestPreviousPage?: (() => void | Promise<void>) | null
}

export interface VibeRootControlledProps extends VibeRootSharedProps {
  items: VibeViewerItem[]
  activeIndex?: number
  loading?: boolean
  hasNextPage?: boolean
  getItems?: never
  initialCursor?: never
  pageSize?: never
}

export interface VibeRootAutoProps {
  getItems: (params: VibeGetItemsParams) => Promise<VibeGetItemsResult>
  initialCursor?: string | null
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

export type VibeRootProps = VibeRootControlledProps | VibeRootAutoProps

export type VibeRootEmit = (event: 'update:activeIndex', value: number) => void

export function useVibeRootDataSource(props: Readonly<VibeRootProps>, emit: VibeRootEmit) {
  const controlledProps = props as Partial<VibeRootControlledProps>
  const autoProps = props as Partial<VibeRootAutoProps>

  const autoSourceItems = ref<VibeViewerItem[]>([])
  const controlledSourceItems = ref<VibeViewerItem[]>([])
  const autoActiveIndex = ref(0)
  const nextPage = ref<string | null>(null)
  const previousPage = ref<string | null>(null)
  const pendingAppendSourceItems = ref<VibeViewerItem[]>([])
  const pendingAppendNextPage = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  const isLoadingInitial = ref(false)
  const isPrefetchingNext = ref(false)
  const isPrefetchingPrevious = ref(false)
  const isAwaitingAppendCommit = ref(false)
  const isAutoPrefetchEnabled = ref(true)
  const removalState = useVibeRemovalState()
  const {
    clearRemoved,
    getRemovedIds,
    remove: removeRemovedIds,
    removedIds,
    restore: restoreRemovedIds,
    undo: undoRemovedIds,
  } = removalState

  const loadedCursors = new Set<string>()
  const inFlightCursors = new Set<string>()

  let hasWarnedMixedProps = false
  let occurrenceSequence = 0

  const isAutoMode = computed(() => typeof autoProps.getItems === 'function')
  const pageSize = computed(() => normalizePageSize(autoProps.pageSize))
  const sourceItems = computed(() => isAutoMode.value ? autoSourceItems.value : controlledSourceItems.value)
  const items = computed(() => filterRemovedItems(sourceItems.value, removedIds.value))
  const activeIndex = computed(() => isAutoMode.value ? autoActiveIndex.value : (controlledProps.activeIndex ?? 0))
  const loading = computed(() =>
    isAutoMode.value
      ? (isLoadingInitial.value || isPrefetchingNext.value || isPrefetchingPrevious.value || isAwaitingAppendCommit.value)
      : (controlledProps.loading ?? false),
  )
  const hasNextPage = computed(() => isAutoMode.value ? Boolean(nextPage.value) : (controlledProps.hasNextPage ?? false))
  const hasPreviousPage = computed(() => isAutoMode.value ? Boolean(previousPage.value) : (controlledProps.hasPreviousPage ?? false))
  const removedCount = computed(() => removedIds.value.size)
  const paginationDetail = computed(() => controlledProps.paginationDetail ?? null)
  const pendingAppendItems = computed(() => filterRemovedItems(pendingAppendSourceItems.value, removedIds.value))
  const canRetryInitialLoad = computed(() =>
    isAutoMode.value
    && !items.value.length
    && !loading.value
    && Boolean(errorMessage.value),
  )

  watch(
    [() => controlledProps.items, () => autoProps.getItems],
    ([maybeItems, maybeGetItems]) => {
      if (!Array.isArray(maybeItems) || typeof maybeGetItems !== 'function' || hasWarnedMixedProps) {
        return
      }

      hasWarnedMixedProps = true
      console.warn('[VibeRoot] `getItems` and `items` were both provided. `getItems` mode will be used.')
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

      const nextResolvedItems = reconcileVibeOccurrenceKeys(nextItems, controlledSourceItems.value, occurrenceSequence)
      controlledSourceItems.value = nextResolvedItems.items
      occurrenceSequence = nextResolvedItems.nextSequence
    },
    {
      deep: true,
      immediate: true,
    },
  )

  watch(
    () => items.value.length,
    (length) => {
      if (!isAutoMode.value) {
        return
      }

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
      if (!isAutoMode.value || !isAutoPrefetchEnabled.value) {
        return
      }

      void maybePrefetchAround()
    },
  )

  onMounted(() => {
    if (!isAutoMode.value) {
      return
    }

    void loadPage(autoProps.initialCursor ?? null, 'initial')
  })

  function normalizePageSize(value: number | undefined) {
    if (!value || !Number.isFinite(value) || value < 1) {
      return DEFAULT_PAGE_SIZE
    }

    return Math.floor(value)
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function getCursorKey(cursor: string | null) {
    return cursor ?? INITIAL_CURSOR_KEY
  }

  function setActiveIndex(nextIndex: number) {
    const nextItems = items.value

    if (!nextItems.length) {
      return
    }

    const clampedIndex = clamp(nextIndex, 0, nextItems.length - 1)

    if (isAutoMode.value) {
      if (clampedIndex === autoActiveIndex.value) {
        return
      }

      autoActiveIndex.value = clampedIndex
      emit('update:activeIndex', clampedIndex)
      return
    }

    if (clampedIndex !== (controlledProps.activeIndex ?? 0)) {
      emit('update:activeIndex', clampedIndex)
    }
  }

  async function maybePrefetchAround() {
    if (!items.value.length || isLoadingInitial.value) {
      return
    }

    if (previousPage.value && autoActiveIndex.value < PREFETCH_OFFSET) {
      await loadPage(previousPage.value, 'prepend')
    }

    if (nextPage.value && autoActiveIndex.value >= items.value.length - PREFETCH_OFFSET) {
      await loadPage(nextPage.value, 'append')
    }
  }

  async function loadPage(cursor: string | null, mode: 'initial' | 'append' | 'prepend') {
    if (!autoProps.getItems) {
      return
    }

    const cursorKey = getCursorKey(cursor)

    if (loadedCursors.has(cursorKey) || inFlightCursors.has(cursorKey)) {
      return
    }

    inFlightCursors.add(cursorKey)
    errorMessage.value = null

    if (mode === 'initial') {
      isLoadingInitial.value = true
    }
    else if (mode === 'append') {
      isPrefetchingNext.value = true
    }
    else {
      isPrefetchingPrevious.value = true
    }

    try {
      const response = await autoProps.getItems({
        cursor,
        pageSize: pageSize.value,
      })

      loadedCursors.add(cursorKey)
      const resolvedResponseItems = resolveIncomingItems(response.items)

      if (mode === 'initial') {
        autoSourceItems.value = resolvedResponseItems
        autoActiveIndex.value = 0
        nextPage.value = response.nextPage
        previousPage.value = response.previousPage ?? null
        return
      }

      if (mode === 'append') {
        pendingAppendSourceItems.value = resolvedResponseItems
        pendingAppendNextPage.value = response.nextPage
        if (!filterRemovedItems(resolvedResponseItems, removedIds.value).length) {
          autoSourceItems.value = [...autoSourceItems.value, ...resolvedResponseItems]
          nextPage.value = response.nextPage
          pendingAppendSourceItems.value = []
          pendingAppendNextPage.value = null
          isAwaitingAppendCommit.value = false
          return
        }

        isAwaitingAppendCommit.value = true
        return
      }

      autoSourceItems.value = [...resolvedResponseItems, ...autoSourceItems.value]
      autoActiveIndex.value += filterRemovedItems(resolvedResponseItems, removedIds.value).length
      previousPage.value = response.previousPage ?? null
    }
    catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'The viewer could not load items.'
    }
    finally {
      inFlightCursors.delete(cursorKey)

      if (mode === 'initial') {
        isLoadingInitial.value = false
      }
      else if (mode === 'append') {
        isPrefetchingNext.value = false
      }
      else {
        isPrefetchingPrevious.value = false
      }
    }
  }

  async function retryInitialLoad() {
    if (!canRetryInitialLoad.value) {
      return
    }

    autoSourceItems.value = []
    autoActiveIndex.value = 0
    nextPage.value = null
    previousPage.value = null
    pendingAppendSourceItems.value = []
    pendingAppendNextPage.value = null
    errorMessage.value = null
    isAwaitingAppendCommit.value = false
    loadedCursors.clear()
    inFlightCursors.clear()

    await loadPage(autoProps.initialCursor ?? null, 'initial')
  }

  async function prefetchNextPage() {
    if (isAutoMode.value) {
      if (!nextPage.value || isLoadingInitial.value) {
        return
      }

      await loadPage(nextPage.value, 'append')
      return
    }

    if (loading.value || typeof controlledProps.requestNextPage !== 'function') {
      return
    }

    await controlledProps.requestNextPage()
  }

  async function prefetchPreviousPage() {
    if (isAutoMode.value) {
      if (!previousPage.value || isLoadingInitial.value) {
        return
      }

      await loadPage(previousPage.value, 'prepend')
      return
    }

    if (loading.value || typeof controlledProps.requestPreviousPage !== 'function') {
      return
    }

    await controlledProps.requestPreviousPage()
  }

  async function commitPendingAppend() {
    if (!pendingAppendSourceItems.value.length) {
      isAwaitingAppendCommit.value = false
      pendingAppendNextPage.value = null
      return
    }

    autoSourceItems.value = [...autoSourceItems.value, ...pendingAppendSourceItems.value]
    nextPage.value = pendingAppendNextPage.value
    pendingAppendSourceItems.value = []
    pendingAppendNextPage.value = null
    isAwaitingAppendCommit.value = false
  }

  function remove(ids: string | string[]) {
    const anchorOccurrenceKey = getActiveOccurrenceKey()
    const result = removeRemovedIds(ids)

    if (!result.ids.length) {
      return result
    }

    if (isAutoMode.value && pendingAppendSourceItems.value.length > 0 && !filterRemovedItems(pendingAppendSourceItems.value, removedIds.value).length) {
      void commitPendingAppend()
    }
    syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)

    return result
  }

  function restore(ids: string | string[]) {
    const anchorOccurrenceKey = getActiveOccurrenceKey()
    const result = restoreRemovedIds(ids)

    if (!result.ids.length) {
      return result
    }

    syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)

    return result
  }

  function undo() {
    const anchorOccurrenceKey = getActiveOccurrenceKey()
    const result = undoRemovedIds()

    if (!result?.ids.length) {
      return result
    }

    syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)

    return result
  }

  function resetRemovedItems() {
    const anchorOccurrenceKey = getActiveOccurrenceKey()
    clearRemoved()
    syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
  }

  function setAutoPrefetchEnabled(nextValue: boolean) {
    isAutoPrefetchEnabled.value = nextValue
  }

  function filterRemovedItems(nextItems: VibeViewerItem[], nextRemovedIds: Set<string>) {
    if (!nextRemovedIds.size) {
      return nextItems
    }

    return nextItems.filter((item) => !nextRemovedIds.has(item.id))
  }

  function resolveIncomingItems(nextItems: VibeViewerItem[]) {
    const resolvedItems = reconcileVibeOccurrenceKeys(nextItems, [], occurrenceSequence)
    occurrenceSequence = resolvedItems.nextSequence
    return resolvedItems.items
  }

  function getActiveOccurrenceKey() {
    const currentItem = items.value[clamp(activeIndex.value, 0, Math.max(0, items.value.length - 1))]
    return currentItem ? getVibeOccurrenceKey(currentItem) : null
  }

  function syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey: string | null = null) {
    if (!items.value.length) {
      if (isAutoMode.value) {
        autoActiveIndex.value = 0
      }
      return
    }

    const anchoredIndex = anchorOccurrenceKey
      ? items.value.findIndex((item) => getVibeOccurrenceKey(item) === anchorOccurrenceKey)
      : -1
    const clampedIndex = anchoredIndex >= 0 ? anchoredIndex : clamp(activeIndex.value, 0, items.value.length - 1)
    if (isAutoMode.value) {
      autoActiveIndex.value = clampedIndex
      return
    }

    if (clampedIndex !== (controlledProps.activeIndex ?? 0)) {
      emit('update:activeIndex', clampedIndex)
    }
  }

  return {
    activeIndex,
    canRetryInitialLoad,
    clearRemoved: resetRemovedItems,
    commitPendingAppend,
    errorMessage,
    getRemovedIds,
    hasNextPage,
    hasPreviousPage,
    isAutoMode,
    items,
    loading,
    paginationDetail,
    pendingAppendItems,
    prefetchNextPage,
    prefetchPreviousPage,
    removedCount,
    remove,
    restore,
    retryInitialLoad,
    setActiveIndex,
    setAutoPrefetchEnabled,
    undo,
  }
}
