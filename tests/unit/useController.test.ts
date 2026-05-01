import { createApp, defineComponent, h, nextTick, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { VibeViewerItem } from '@/components/viewer'

import type { VibeProps } from '@/components/viewer-core/useDataSource'

const dataSourceMock = createDataSourceMock()

vi.mock('@/components/viewer-core/useDataSource', () => ({
  useDataSource: () => ({
    activeIndex: dataSourceMock.activeIndex,
    canRetryInitialLoad: dataSourceMock.canRetryInitialLoad,
    cancelFill: dataSourceMock.cancelFill,
    commitPendingAppend: dataSourceMock.commitPendingAppend,
    currentCursor: dataSourceMock.currentCursor,
    errorMessage: dataSourceMock.errorMessage,
    fillCollectedCount: dataSourceMock.fillCollectedCount,
    fillCompletedCalls: dataSourceMock.fillCompletedCalls,
    fillCursor: dataSourceMock.fillCursor,
    fillDelayRemainingMs: dataSourceMock.fillDelayRemainingMs,
    fillLoadedCount: dataSourceMock.fillLoadedCount,
    fillMode: dataSourceMock.fillMode,
    fillProgress: dataSourceMock.fillProgress,
    fillTargetCalls: dataSourceMock.fillTargetCalls,
    fillTargetCount: dataSourceMock.fillTargetCount,
    fillTotalCount: dataSourceMock.fillTotalCount,
    hasNextPage: dataSourceMock.hasNextPage,
    hasPreviousPage: dataSourceMock.hasPreviousPage,
    isPageLoadingLocked: dataSourceMock.isPageLoadingLocked,
    items: dataSourceMock.items,
    lockPageLoading: dataSourceMock.lockPageLoading,
    loading: dataSourceMock.loading,
    nextCursor: dataSourceMock.nextCursor,
    paginationDetail: dataSourceMock.paginationDetail,
    pendingAppendItems: dataSourceMock.pendingAppendItems,
    phase: dataSourceMock.phase,
    prefetchNextPage: dataSourceMock.prefetchNextPage,
    prefetchPreviousPage: dataSourceMock.prefetchPreviousPage,
    previousCursor: dataSourceMock.previousCursor,
    removedCount: dataSourceMock.removedCount,
    removedIds: dataSourceMock.removedIds,
    getRemovedIds: dataSourceMock.getRemovedIds,
    retryInitialLoad: dataSourceMock.retryInitialLoad,
    setActiveIndex: dataSourceMock.setActiveIndex,
    setAutoPrefetchEnabled: dataSourceMock.setAutoPrefetchEnabled,
    unlockPageLoading: dataSourceMock.unlockPageLoading,
  }),
}))

function createDataSourceMock() {
  const activeIndex = ref(0)
  const canRetryInitialLoad = ref(false)
  const cancelFill = vi.fn()
  const commitPendingAppend = vi.fn(async () => {})
  const currentCursor = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  const fillCollectedCount = ref<number | null>(null)
  const fillCompletedCalls = ref(0)
  const fillCursor = ref<string | null>(null)
  const fillDelayRemainingMs = ref<number | null>(null)
  const fillLoadedCount = ref(0)
  const fillMode = ref<'count' | 'cursor' | 'end' | 'idle'>('idle')
  const fillProgress = ref<number | null>(null)
  const fillTargetCalls = ref<number | null>(null)
  const fillTargetCount = ref<number | null>(null)
  const fillTotalCount = ref<number | null>(null)
  const hasNextPage = ref(false)
  const hasPreviousPage = ref(false)
  const isPageLoadingLocked = ref(false)
  const items = ref<VibeViewerItem[]>([])
  const lockPageLoading = vi.fn(() => {
    isPageLoadingLocked.value = true
  })
  const loading = ref(false)
  const nextCursor = ref<string | null>(null)
  const paginationDetail = ref<string | null>(null)
  const pendingAppendItems = ref<VibeViewerItem[]>([])
  const phase = ref<'failed' | 'filling' | 'idle' | 'initializing' | 'loading' | 'refreshing'>('idle')
  const prefetchNextPage = vi.fn(async () => {})
  const prefetchPreviousPage = vi.fn(async () => {})
  const previousCursor = ref<string | null>(null)
  const removedCount = ref(0)
  const removedIds = ref<string[]>([])
  const getRemovedIds = vi.fn(() => removedIds.value)
  const retryInitialLoad = vi.fn(async () => {})
  const setActiveIndex = vi.fn((nextIndex: number) => {
    activeIndex.value = nextIndex
  })
  const setAutoPrefetchEnabled = vi.fn()
  const unlockPageLoading = vi.fn(() => {
    isPageLoadingLocked.value = false
  })

  return {
    activeIndex,
    canRetryInitialLoad,
    cancelFill,
    commitPendingAppend,
    currentCursor,
    errorMessage,
    fillCollectedCount,
    fillCompletedCalls,
    fillCursor,
    fillDelayRemainingMs,
    fillLoadedCount,
    fillMode,
    fillProgress,
    fillTargetCalls,
    fillTargetCount,
    fillTotalCount,
    hasNextPage,
    hasPreviousPage,
    isPageLoadingLocked,
    items,
    lockPageLoading,
    loading,
    nextCursor,
    paginationDetail,
    pendingAppendItems,
    phase,
    prefetchNextPage,
    prefetchPreviousPage,
    previousCursor,
    removedCount,
    removedIds,
    getRemovedIds,
    retryInitialLoad,
    setActiveIndex,
    setAutoPrefetchEnabled,
    unlockPageLoading,
  }
}

import { useController } from '@/components/viewer-core/useController'

describe('useController', () => {
  beforeEach(() => {
    resetDataSourceMock()
    setViewportWidth(1024)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults desktop to list mode, opens fullscreen, and returns to the list', async () => {
    setViewportWidth(1_280)

    const controller = await mountController()

    expect(controller.api.surfaceMode.value).toBe('list')
    expect(controller.api.showBackToList.value).toBe(false)
    expect(dataSourceMock.setAutoPrefetchEnabled).toHaveBeenLastCalledWith(false)

    controller.api.openFullscreen(3)
    await controller.flush()

    expect(dataSourceMock.setActiveIndex).toHaveBeenCalledWith(3)
    expect(controller.api.surfaceMode.value).toBe('fullscreen')
    expect(controller.api.showBackToList.value).toBe(true)
    expect(dataSourceMock.setAutoPrefetchEnabled).toHaveBeenLastCalledWith(true)

    controller.api.returnToList()
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('list')
    expect(controller.api.showBackToList.value).toBe(false)

    controller.unmount()
  })

  it('mirrors removal state into status.removedIds', async () => {
    const controller = await mountController()

    expect(controller.api.status.removedIds).toEqual([])

    dataSourceMock.removedIds.value = ['item-2', 'item-5']
    dataSourceMock.removedCount.value = 2
    await controller.flush()

    expect(controller.api.status.removedIds).toEqual(['item-2', 'item-5'])

    dataSourceMock.removedIds.value = []
    dataSourceMock.removedCount.value = 0
    await controller.flush()

    expect(controller.api.status.removedIds).toEqual([])

    controller.unmount()
  })

  it('mirrors the active fill cursor into status while refilling', async () => {
    const controller = await mountController()

    expect(controller.api.status.fillCursor).toBeNull()

    dataSourceMock.phase.value = 'filling'
    dataSourceMock.fillCursor.value = 'page-2'
    dataSourceMock.fillCollectedCount.value = 20
    dataSourceMock.fillCompletedCalls.value = 1
    dataSourceMock.fillLoadedCount.value = 50
    dataSourceMock.fillMode.value = 'count'
    dataSourceMock.fillProgress.value = 0.5
    dataSourceMock.fillTargetCalls.value = 2
    dataSourceMock.fillTargetCount.value = 25
    dataSourceMock.fillTotalCount.value = 100
    await controller.flush()

    expect(controller.api.status.fillCursor).toBe('page-2')
    expect(controller.api.status.fillCompletedCalls).toBe(1)
    expect(controller.api.status.fillLoadedCount).toBe(50)
    expect(controller.api.status.fillMode).toBe('count')
    expect(controller.api.status.fillProgress).toBe(0.5)
    expect(controller.api.status.fillTargetCalls).toBe(2)
    expect(controller.api.status.fillTotalCount).toBe(100)

    dataSourceMock.phase.value = 'idle'
    dataSourceMock.fillCursor.value = null
    dataSourceMock.fillCollectedCount.value = null
    dataSourceMock.fillTargetCount.value = null
    dataSourceMock.fillMode.value = 'idle'
    await controller.flush()

    expect(controller.api.status.fillCursor).toBeNull()
    expect(controller.api.status.fillMode).toBe('idle')

    controller.unmount()
  })

  it('exposes page-loading lock controls and mirrors their state into status', async () => {
    const controller = await mountController()

    expect(controller.api.status.pageLoadingLocked).toBe(false)

    controller.api.lockPageLoading()
    await controller.flush()

    expect(dataSourceMock.lockPageLoading).toHaveBeenCalledTimes(1)
    expect(controller.api.status.pageLoadingLocked).toBe(true)

    controller.api.unlockPageLoading()
    await controller.flush()

    expect(dataSourceMock.unlockPageLoading).toHaveBeenCalledTimes(1)
    expect(controller.api.status.pageLoadingLocked).toBe(false)

    controller.unmount()
  })

  it('mirrors list boundary load progress into status', async () => {
    const controller = await mountController()

    expect(controller.api.status.nextBoundaryLoadProgress).toBe(0)
    expect(controller.api.status.previousBoundaryLoadProgress).toBe(0)

    controller.api.setBoundaryLoadProgress({
      nextBoundaryLoadProgress: 0.4,
      previousBoundaryLoadProgress: 0.7,
    })
    await controller.flush()

    expect(controller.api.status.nextBoundaryLoadProgress).toBe(0.4)
    expect(controller.api.status.previousBoundaryLoadProgress).toBe(0.7)

    controller.api.setBoundaryLoadProgress({
      nextBoundaryLoadProgress: 4,
      previousBoundaryLoadProgress: -2,
    })
    await controller.flush()

    expect(controller.api.status.nextBoundaryLoadProgress).toBe(1)
    expect(controller.api.status.previousBoundaryLoadProgress).toBe(0)

    controller.unmount()
  })

  it('forces fullscreen on mobile and restores list state when the viewport grows back to desktop', async () => {
    setViewportWidth(768)

    const controller = await mountController()

    expect(controller.api.surfaceMode.value).toBe('fullscreen')
    expect(controller.api.showBackToList.value).toBe(false)
    expect(dataSourceMock.setAutoPrefetchEnabled).toHaveBeenLastCalledWith(true)

    controller.api.returnToList()
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('fullscreen')

    setViewportWidth(1_280)
    window.dispatchEvent(new Event('resize'))
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('list')

    controller.unmount()
  })

  it('commits pending fullscreen appends when the desktop surface opens fullscreen', async () => {
    setViewportWidth(1_280)

    const controller = await mountController()
    dataSourceMock.pendingAppendItems.value = [createItem('pending-append')]
    dataSourceMock.commitPendingAppend.mockClear()

    controller.api.openFullscreen(1)
    await controller.flush()

    expect(dataSourceMock.commitPendingAppend).toHaveBeenCalledTimes(1)

    controller.unmount()
  })

  it('syncs a controlled surfaceMode prop and emits mode changes from internal transitions', async () => {
    setViewportWidth(1_280)

    const controller = await mountController({
      surfaceMode: 'fullscreen',
    })

    expect(controller.api.surfaceMode.value).toBe('fullscreen')

    controller.props.surfaceMode = 'list'
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('list')

    controller.api.openFullscreen(1)
    await controller.flush()

    expect(controller.emittedSurfaceModes).toContain('fullscreen')

    controller.unmount()
  })

  it('returns desktop fullscreen to list mode when Escape is pressed', async () => {
    setViewportWidth(1_280)

    const controller = await mountController()

    controller.api.openFullscreen(2)
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('fullscreen')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('list')

    controller.unmount()
  })
})

async function mountController(initialProps: Partial<VibeProps> = {}) {
  let api!: ReturnType<typeof useController>
  const emittedSurfaceModes: Array<'fullscreen' | 'list'> = []

  const props = reactive({
    resolve: vi.fn(async () => ({ items: [], nextPage: null })),
    ...initialProps,
  }) as VibeProps

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useController(props as Readonly<VibeProps>, ((event: 'update:activeIndex' | 'update:surfaceMode', value: number | 'fullscreen' | 'list') => {
        if (event === 'update:surfaceMode' && typeof value === 'string') {
          emittedSurfaceModes.push(value)
        }
      }) as never)
      return () => h('div')
    },
  }))

  app.mount(container)
  await flush()

  return {
    api,
    emittedSurfaceModes,
    props,
    flush,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

function createItem(id: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    title: id,
    url: `https://example.com/${id}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${id}-preview.jpg`,
      width: 320,
      height: 180,
    },
  }
}

function resetDataSourceMock() {
  dataSourceMock.activeIndex.value = 0
  dataSourceMock.canRetryInitialLoad.value = false
  dataSourceMock.cancelFill.mockClear()
  dataSourceMock.commitPendingAppend.mockClear()
  dataSourceMock.currentCursor.value = null
  dataSourceMock.errorMessage.value = null
  dataSourceMock.fillCollectedCount.value = null
  dataSourceMock.fillCompletedCalls.value = 0
  dataSourceMock.fillCursor.value = null
  dataSourceMock.fillDelayRemainingMs.value = null
  dataSourceMock.fillLoadedCount.value = 0
  dataSourceMock.fillMode.value = 'idle'
  dataSourceMock.fillProgress.value = null
  dataSourceMock.fillTargetCalls.value = null
  dataSourceMock.fillTargetCount.value = null
  dataSourceMock.fillTotalCount.value = null
  dataSourceMock.hasNextPage.value = false
  dataSourceMock.hasPreviousPage.value = false
  dataSourceMock.isPageLoadingLocked.value = false
  dataSourceMock.items.value = []
  dataSourceMock.lockPageLoading.mockClear()
  dataSourceMock.loading.value = false
  dataSourceMock.nextCursor.value = null
  dataSourceMock.paginationDetail.value = null
  dataSourceMock.pendingAppendItems.value = []
  dataSourceMock.phase.value = 'idle'
  dataSourceMock.prefetchNextPage.mockClear()
  dataSourceMock.prefetchPreviousPage.mockClear()
  dataSourceMock.previousCursor.value = null
  dataSourceMock.removedCount.value = 0
  dataSourceMock.removedIds.value = []
  dataSourceMock.retryInitialLoad.mockClear()
  dataSourceMock.setActiveIndex.mockClear()
  dataSourceMock.setAutoPrefetchEnabled.mockClear()
  dataSourceMock.unlockPageLoading.mockClear()
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  })
}

async function flush() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
