import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'
import { createBackfillBatchLoader, type BackfillStatsShape } from '@/masonry/backfill'
import type {
  BackfillStats,
  MasonryItemBase,
  MasonryProps,
  MasonryRestoredPages,
  PageToken,
} from '@/masonry/types'
import type { LeavingClone, MasonryPosition } from '@/components/masonry/types'
import {
  abortError,
  assignOriginalIndices,
  getMeasuredContainerWidth,
  isAbortError,
  makeInitialBackfillStats,
  normalizeRestoredPagesLoaded,
  sleep,
  syncNextOriginalIndexFromItems,
  insertItemsByOriginalIndex,
} from '@/components/masonry/runtimeUtils'

type RemovedPayload = {
  items: MasonryItemBase[]
  ids: string[]
}

type UseMasonryRuntimeOptions = {
  props: MasonryProps
  emitUpdateItems: (items: MasonryItemBase[]) => void
  emitRemoved: (payload: RemovedPayload) => void
  scrollViewportRef: Ref<HTMLElement | null>
  gapX: ComputedRef<number>
  columnWidth: ComputedRef<number>
  layoutIndexById: Ref<Map<string, number>>
  layoutPositions: Ref<MasonryPosition[]>
  layoutHeights: Ref<number[]>
  markEnterFromTop: (items: MasonryItemBase[]) => void
  snapshotVisiblePositions: () => Map<string, MasonryPosition>
  playFlipMoveAnimation: (oldPosById: Map<string, MasonryPosition>, skipIds?: Set<string>) => void
  queueLeavingClones: (clones: LeavingClone[]) => void
  resetMotionState: () => void
}

const MAX_GETCONTENT_RETRIES = 5
const BASE_RETRY_DELAY_MS = 1000

export function useMasonryRuntime(options: UseMasonryRuntimeOptions) {
  const pageProp = computed<PageToken>(() => options.props.page ?? 1)
  const pageSizeProp = computed(() => options.props.pageSize ?? 20)
  const backfillDelayProp = computed(() => options.props.backfillRequestDelayMs ?? 2000)
  const prefetchThresholdPx = computed(() => options.props.prefetchThresholdPx ?? 200)

  const containerWidth = ref(0)
  const viewportHeight = ref(0)
  const scrollTop = ref(0)

  const isLoadingInitial = ref(true)
  const isLoadingNext = ref(false)
  const error = ref('')

  const pagesLoaded = ref<PageToken[]>([])
  const internalItems = ref<MasonryItemBase[]>([])
  const controlledItemsMirror = ref<MasonryItemBase[]>([])
  const nextPage = ref<PageToken | null>(pageProp.value)
  const backfillBuffer = ref<MasonryItemBase[]>([])

  const isResumeMode = ref(false)
  const backfillStats = shallowRef<BackfillStats>({
    enabled: false,
    isBackfillActive: false,
    isRequestInFlight: false,
    page: pageProp.value,
    next: pageProp.value,
    progress: {
      collected: 0,
      target: 0,
    },
    cooldownMsRemaining: 0,
    cooldownMsTotal: 2000,
    pageSize: 20,
    bufferSize: 0,
    lastBatch: null,
    totals: {
      pagesFetched: 0,
      itemsFetchedFromNetwork: 0,
    },
  })

  const isItemsControlled = computed(() => options.props.items !== undefined)
  const itemsState = computed({
    get() {
      return isItemsControlled.value ? controlledItemsMirror.value : internalItems.value
    },
    set(next: MasonryItemBase[]) {
      if (isItemsControlled.value) {
        controlledItemsMirror.value = next
        options.emitUpdateItems(next)
      } else {
        internalItems.value = next
      }
    },
  })

  let resizeObserver: ResizeObserver | undefined
  let feedGeneration = 0
  let backfillCancelToken = 0
  let loadNextInFlight: Promise<void> | null = null
  let loadFirstInFlight: Promise<void> | null = null
  let nextOriginalIndex = 0
  let lastPrefetchScrollTop = 0
  let lastPrefetchScrollHeight = 0
  let suppressPrefetchUntilScrollDown = false

  const removedPoolById = new Map<string, MasonryItemBase>()
  const removalHistory: string[][] = []

  async function getContentWithRetry(pageToken: PageToken, generation: number) {
    let retry = 0

    while (true) {
      if (generation !== feedGeneration) throw abortError()

      try {
        return await options.props.getContent(pageToken)
      } catch (err) {
        if (generation !== feedGeneration) throw abortError()
        if (retry >= MAX_GETCONTENT_RETRIES) throw err
        retry += 1
        await sleep(retry * BASE_RETRY_DELAY_MS)
      }
    }
  }

  async function restoreItems(itemsToRestore: MasonryItemBase[]) {
    if (!itemsToRestore.length) return

    suppressPrefetchUntilScrollDown = true
    options.markEnterFromTop(itemsToRestore)

    const oldPosById = options.snapshotVisiblePositions()
    itemsState.value = insertItemsByOriginalIndex(itemsState.value, itemsToRestore)
    await nextTick()
    options.playFlipMoveAnimation(oldPosById)
  }

  function toId(itemOrId: string | MasonryItemBase | null | undefined): string | null {
    if (!itemOrId) return null
    return typeof itemOrId === 'string' ? itemOrId : itemOrId.id
  }

  async function restore(itemsOrIds: string | MasonryItemBase | Array<string | MasonryItemBase>) {
    const raw = Array.isArray(itemsOrIds) ? itemsOrIds : [itemsOrIds]
    const ids = raw.map(toId).filter(Boolean) as string[]
    if (!ids.length) return

    const items: MasonryItemBase[] = []
    for (const itemId of ids) {
      const item = removedPoolById.get(itemId)
      if (item) items.push(item)
    }
    if (!items.length) return

    await restoreItems(items)

    for (const item of items) {
      if (item?.id) removedPoolById.delete(item.id)
    }
  }

  async function undo() {
    const last = removalHistory.pop()
    if (!last?.length) return

    const items: MasonryItemBase[] = []
    for (const itemId of last) {
      const item = removedPoolById.get(itemId)
      if (item) items.push(item)
    }
    if (!items.length) return

    await restoreItems(items)

    for (const item of items) {
      if (item?.id) removedPoolById.delete(item.id)
    }
  }

  function forget(itemsOrIds: string | MasonryItemBase | Array<string | MasonryItemBase>) {
    const raw = Array.isArray(itemsOrIds) ? itemsOrIds : [itemsOrIds]
    const ids = raw.map(toId).filter(Boolean) as string[]
    if (!ids.length) return

    const idSet = new Set(ids)
    for (const itemId of idSet) {
      removedPoolById.delete(itemId)
    }

    for (let index = removalHistory.length - 1; index >= 0; index -= 1) {
      const batch = removalHistory[index]
      const nextBatch = batch.filter((itemId) => !idSet.has(itemId))
      if (nextBatch.length) removalHistory[index] = nextBatch
      else removalHistory.splice(index, 1)
    }
  }

  async function loadDefaultPage(pageToLoad: PageToken) {
    const result = await getContentWithRetry(pageToLoad, feedGeneration)
    nextOriginalIndex = assignOriginalIndices(result.items, nextOriginalIndex)
    options.markEnterFromTop(result.items)
    return { items: result.items, nextPage: result.nextPage }
  }

  const backfillLoader = createBackfillBatchLoader<MasonryItemBase, PageToken>({
    getContent: (pageToken) => getContentWithRetry(pageToken, feedGeneration),
    markEnterFromLeft: options.markEnterFromTop,
    buffer: backfillBuffer,
    stats: backfillStats as unknown as typeof backfillStats & {
      value: BackfillStatsShape<PageToken>
    },
    isEnabled: () => options.props.mode === 'backfill',
    getPageSize: () => pageSizeProp.value,
    getRequestDelayMs: () => backfillDelayProp.value,
    getCancelToken: () => backfillCancelToken,
  })

  async function remove(itemsOrIds: string | MasonryItemBase | Array<string | MasonryItemBase>) {
    const raw = Array.isArray(itemsOrIds) ? itemsOrIds : [itemsOrIds]
    const ids = raw.map(toId).filter(Boolean) as string[]
    if (!ids.length) return

    const removeSet = new Set(ids)
    const removedItems: MasonryItemBase[] = []
    const batchIds: string[] = []

    for (const itemId of removeSet) {
      const index = options.layoutIndexById.value.get(itemId)
      if (index == null) continue
      const item = itemsState.value[index]
      if (!item) continue
      removedPoolById.set(itemId, item)
      batchIds.push(itemId)
      removedItems.push(item)
    }

    if (batchIds.length) {
      removalHistory.push(batchIds)
      suppressPrefetchUntilScrollDown = true
    }

    const oldPosById = options.snapshotVisiblePositions()
    const cardWidth = options.columnWidth.value
    const viewportBottomY = scrollTop.value + viewportHeight.value
    const clones: LeavingClone[] = []

    for (const itemId of removeSet) {
      const index = options.layoutIndexById.value.get(itemId)
      if (index == null) continue

      const item = itemsState.value[index]
      if (!item) continue

      const position = options.layoutPositions.value[index] ?? { x: 0, y: 0 }
      const height = options.layoutHeights.value[index] ?? cardWidth
      const leaveBaseY = Math.max(position.y, viewportBottomY)
      clones.push({
        id: itemId,
        item,
        fromX: position.x,
        fromY: position.y,
        toY: leaveBaseY + Math.max(0, height),
        width: cardWidth,
        height,
        leaving: true,
      })
    }

    options.queueLeavingClones(clones)

    itemsState.value = itemsState.value.filter((item) => {
      const itemId = item?.id
      return !itemId || !removeSet.has(itemId)
    })

    await nextTick()
    options.playFlipMoveAnimation(oldPosById, removeSet)

    if (removedItems.length) options.emitRemoved({ items: removedItems, ids: batchIds })
  }

  const removeItem = remove

  function cancel() {
    feedGeneration += 1
    backfillCancelToken += 1
    loadNextInFlight = null
    loadFirstInFlight = null
    isLoadingInitial.value = false
    isLoadingNext.value = false
  }

  function syncViewportMeasures(el: HTMLElement) {
    containerWidth.value = getMeasuredContainerWidth(el, options.gapX.value)
    viewportHeight.value = el.clientHeight
  }

  function maybeLoadMoreOnScroll() {
    const el = options.scrollViewportRef.value
    if (!el) return

    const nextScrollTop = el.scrollTop
    const nextViewportHeight = el.clientHeight
    const nextScrollHeight = el.scrollHeight

    scrollTop.value = nextScrollTop
    viewportHeight.value = nextViewportHeight

    const prevScrollTop = lastPrefetchScrollTop
    const prevScrollHeight = lastPrefetchScrollHeight
    const userScrolledDown = nextScrollTop > prevScrollTop
    const contentShrank = prevScrollHeight > 0 && nextScrollHeight < prevScrollHeight

    lastPrefetchScrollTop = nextScrollTop
    lastPrefetchScrollHeight = nextScrollHeight

    if (suppressPrefetchUntilScrollDown) {
      if (!userScrolledDown) return
      suppressPrefetchUntilScrollDown = false
    }

    if (contentShrank && !userScrolledDown) return

    const distanceFromBottom = nextScrollHeight - (nextScrollTop + nextViewportHeight)
    if (distanceFromBottom <= prefetchThresholdPx.value) {
      void loadNextPage()
    }
  }

  function setupResizeObserver() {
    if (typeof ResizeObserver === 'undefined') return

    resizeObserver = new ResizeObserver(() => {
      const el = options.scrollViewportRef.value
      if (!el) return
      syncViewportMeasures(el)
    })
  }

  function connectViewport() {
    const el = options.scrollViewportRef.value
    if (!el) return
    syncViewportMeasures(el)
    scrollTop.value = el.scrollTop
    lastPrefetchScrollTop = el.scrollTop
    lastPrefetchScrollHeight = el.scrollHeight
    resizeObserver?.observe(el)
  }

  function resetRuntimeState() {
    feedGeneration += 1
    backfillCancelToken += 1
    loadNextInFlight = null
    loadFirstInFlight = null
    lastPrefetchScrollTop = 0
    lastPrefetchScrollHeight = 0
    suppressPrefetchUntilScrollDown = false
    nextOriginalIndex = 0
    removedPoolById.clear()
    removalHistory.length = 0
    pagesLoaded.value = []
    nextPage.value = null
    backfillBuffer.value = []
    backfillStats.value = makeInitialBackfillStats({
      mode: options.props.mode,
      page: pageProp.value,
      backfillRequestDelayMs: backfillDelayProp.value,
      pageSize: pageSizeProp.value,
    })
    isLoadingInitial.value = true
    isLoadingNext.value = false
    error.value = ''
    options.resetMotionState()
  }

  function resetFeedState(startPage: PageToken) {
    resetRuntimeState()
    itemsState.value = []
    nextPage.value = startPage
  }

  function applyResumeState(restoredPages?: MasonryRestoredPages) {
    resetRuntimeState()
    pagesLoaded.value = restoredPages ? normalizeRestoredPagesLoaded(restoredPages) : []
    nextPage.value = pageProp.value
    isLoadingInitial.value = false
    nextOriginalIndex = syncNextOriginalIndexFromItems(itemsState.value)
    nextOriginalIndex = assignOriginalIndices(itemsState.value, nextOriginalIndex)
  }

  async function loadFirstPage(startPage: PageToken) {
    if (loadFirstInFlight) return loadFirstInFlight

    const generation = feedGeneration
    let promise: Promise<void> | null = null

    promise = (async () => {
      try {
        if (options.props.mode === 'backfill') {
          const result = await backfillLoader.loadBackfillBatch(startPage)
          if (generation !== feedGeneration) return
          pagesLoaded.value = result.pages.length ? result.pages : [startPage]
          nextOriginalIndex = assignOriginalIndices(result.batchItems, nextOriginalIndex)
          itemsState.value = result.batchItems
          nextPage.value = result.nextPage
        } else {
          const result = await loadDefaultPage(startPage)
          if (generation !== feedGeneration) return
          pagesLoaded.value = [startPage]
          itemsState.value = result.items
          nextPage.value = result.nextPage
        }
      } catch (err) {
        if (generation !== feedGeneration) return
        if (isAbortError(err)) return
        error.value = err instanceof Error ? err.message : String(err)
      } finally {
        if (generation === feedGeneration) isLoadingInitial.value = false
        if (loadFirstInFlight === promise) loadFirstInFlight = null
      }
    })()

    loadFirstInFlight = promise
    return promise
  }

  async function loadNextPage() {
    if (loadNextInFlight) return loadNextInFlight
    if (isLoadingInitial.value || isLoadingNext.value) return
    if (options.props.mode !== 'backfill' && nextPage.value == null) return
    if (options.props.mode === 'backfill' && nextPage.value == null && backfillBuffer.value.length === 0) {
      return
    }

    const generation = feedGeneration
    let promise: Promise<void> | null = null

    promise = (async () => {
      try {
        isLoadingNext.value = true
        error.value = ''

        if (options.props.mode === 'backfill') {
          const result = await backfillLoader.loadBackfillBatch(nextPage.value)
          if (generation !== feedGeneration) return
          if (result.pages.length) {
            pagesLoaded.value = [...pagesLoaded.value, ...result.pages]
          }
          nextOriginalIndex = assignOriginalIndices(result.batchItems, nextOriginalIndex)
          itemsState.value = [...itemsState.value, ...result.batchItems]
          nextPage.value = result.nextPage
          return
        }

        const pageToLoad = nextPage.value
        if (pageToLoad == null) return

        const result = await loadDefaultPage(pageToLoad)
        if (generation !== feedGeneration) return
        pagesLoaded.value = [...pagesLoaded.value, pageToLoad]
        itemsState.value = [...itemsState.value, ...result.items]
        nextPage.value = result.nextPage
      } catch (err) {
        if (generation !== feedGeneration) return
        if (isAbortError(err)) return
        error.value = err instanceof Error ? err.message : String(err)
      } finally {
        if (generation === feedGeneration) isLoadingNext.value = false
        if (loadNextInFlight === promise) loadNextInFlight = null
      }
    })()

    loadNextInFlight = promise
    return promise
  }

  watch(
    () => options.props.items,
    (next) => {
      if (!isItemsControlled.value) return
      controlledItemsMirror.value = Array.isArray(next) ? next : []
    },
    { immediate: true }
  )

  watch(
    () => options.props.page,
    async (newPage) => {
      const nextStartPage = newPage ?? pageProp.value
      if (isResumeMode.value) {
        nextPage.value = nextStartPage
        return
      }

      resetFeedState(nextStartPage)
      await loadFirstPage(nextStartPage)
    }
  )

  watch(
    () => options.props.restoredPages,
    (next) => {
      if (!next) return
      isResumeMode.value = true
      applyResumeState(next)
    }
  )

  watch(options.gapX, () => {
    const el = options.scrollViewportRef.value
    if (!el) return
    containerWidth.value = getMeasuredContainerWidth(el, options.gapX.value)
  })

  onMounted(async () => {
    setupResizeObserver()
    connectViewport()

    if (options.props.restoredPages != null) {
      isResumeMode.value = true
      applyResumeState(options.props.restoredPages)
      return
    }

    if (isItemsControlled.value && itemsState.value.length > 0) {
      isResumeMode.value = true
      applyResumeState()
      return
    }

    isResumeMode.value = false
    resetFeedState(pageProp.value)
    await loadFirstPage(pageProp.value)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
  })

  return {
    containerWidth,
    viewportHeight,
    scrollTop,
    isLoadingInitial,
    isLoadingNext,
    error,
    itemsState,
    pagesLoaded,
    nextPage,
    backfillBuffer,
    backfillStats,
    isResumeMode,
    remove,
    removeItem,
    restore,
    undo,
    forget,
    loadNextPage,
    cancel,
    maybeLoadMoreOnScroll,
  }
}
