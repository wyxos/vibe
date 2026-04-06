import { computed, onMounted, ref, watch } from 'vue'

import type { VibeViewerItem } from '../vibeViewer'

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

  const autoItems = ref<VibeViewerItem[]>([])
  const autoActiveIndex = ref(0)
  const nextPage = ref<string | null>(null)
  const previousPage = ref<string | null>(null)
  const pendingAppendItems = ref<VibeViewerItem[]>([])
  const pendingAppendNextPage = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  const isLoadingInitial = ref(false)
  const isPrefetchingNext = ref(false)
  const isPrefetchingPrevious = ref(false)
  const isAwaitingAppendCommit = ref(false)
  const isAutoPrefetchEnabled = ref(true)

  const loadedCursors = new Set<string>()
  const inFlightCursors = new Set<string>()

  let hasWarnedMixedProps = false

  const isAutoMode = computed(() => typeof autoProps.getItems === 'function')
  const pageSize = computed(() => normalizePageSize(autoProps.pageSize))
  const items = computed(() => isAutoMode.value ? autoItems.value : (controlledProps.items ?? []))
  const activeIndex = computed(() => isAutoMode.value ? autoActiveIndex.value : (controlledProps.activeIndex ?? 0))
  const loading = computed(() =>
    isAutoMode.value
      ? (isLoadingInitial.value || isPrefetchingNext.value || isPrefetchingPrevious.value || isAwaitingAppendCommit.value)
      : (controlledProps.loading ?? false),
  )
  const hasNextPage = computed(() => isAutoMode.value ? Boolean(nextPage.value) : (controlledProps.hasNextPage ?? false))
  const hasPreviousPage = computed(() => isAutoMode.value ? Boolean(previousPage.value) : (controlledProps.hasPreviousPage ?? false))
  const paginationDetail = computed(() => controlledProps.paginationDetail ?? null)
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

      if (mode === 'initial') {
        autoItems.value = response.items
        autoActiveIndex.value = 0
        nextPage.value = response.nextPage
        previousPage.value = response.previousPage ?? null
        return
      }

      if (mode === 'append') {
        pendingAppendItems.value = response.items
        pendingAppendNextPage.value = response.nextPage
        isAwaitingAppendCommit.value = true
        return
      }

      autoItems.value = [...response.items, ...autoItems.value]
      autoActiveIndex.value += response.items.length
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

    autoItems.value = []
    autoActiveIndex.value = 0
    nextPage.value = null
    previousPage.value = null
    pendingAppendItems.value = []
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
    if (!pendingAppendItems.value.length) {
      isAwaitingAppendCommit.value = false
      pendingAppendNextPage.value = null
      return
    }

    autoItems.value = [...autoItems.value, ...pendingAppendItems.value]
    nextPage.value = pendingAppendNextPage.value
    pendingAppendItems.value = []
    pendingAppendNextPage.value = null
    isAwaitingAppendCommit.value = false
  }

  function setAutoPrefetchEnabled(nextValue: boolean) {
    isAutoPrefetchEnabled.value = nextValue
  }

  return {
    activeIndex,
    canRetryInitialLoad,
    commitPendingAppend,
    errorMessage,
    hasNextPage,
    hasPreviousPage,
    isAutoMode,
    items,
    loading,
    paginationDetail,
    pendingAppendItems,
    prefetchNextPage,
    prefetchPreviousPage,
    retryInitialLoad,
    setActiveIndex,
    setAutoPrefetchEnabled,
  }
}
