import { createApp, defineComponent, h, nextTick, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { VibeViewerItem } from '@/components/viewer'

import type { VibeProps } from '@/components/viewer-core/useDataSource'

const dataSourceMock = createDataSourceMock()

vi.mock('@/components/viewer-core/useDataSource', () => ({
  useDataSource: () => ({
    activeIndex: dataSourceMock.activeIndex,
    canRetryInitialLoad: dataSourceMock.canRetryInitialLoad,
    commitPendingAppend: dataSourceMock.commitPendingAppend,
    currentCursor: dataSourceMock.currentCursor,
    errorMessage: dataSourceMock.errorMessage,
    fillCollectedCount: dataSourceMock.fillCollectedCount,
    fillDelayRemainingMs: dataSourceMock.fillDelayRemainingMs,
    fillTargetCount: dataSourceMock.fillTargetCount,
    hasNextPage: dataSourceMock.hasNextPage,
    hasPreviousPage: dataSourceMock.hasPreviousPage,
    items: dataSourceMock.items,
    loading: dataSourceMock.loading,
    mode: dataSourceMock.mode,
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
  }),
}))

function createDataSourceMock() {
  const activeIndex = ref(0)
  const canRetryInitialLoad = ref(false)
  const commitPendingAppend = vi.fn(async () => {})
  const currentCursor = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  const fillCollectedCount = ref<number | null>(null)
  const fillDelayRemainingMs = ref<number | null>(null)
  const fillTargetCount = ref<number | null>(null)
  const hasNextPage = ref(false)
  const hasPreviousPage = ref(false)
  const items = ref<VibeViewerItem[]>([])
  const loading = ref(false)
  const mode = ref<'dynamic' | 'static'>('dynamic')
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

  it('defaults desktop to list mode, opens fullscreen, and returns to the list with a restore token bump', async () => {
    setViewportWidth(1_280)

    const controller = await mountController()

    expect(controller.api.surfaceMode.value).toBe('list')
    expect(controller.api.showBackToList.value).toBe(false)
    expect(controller.api.listRestoreToken.value).toBe(1)
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
    expect(controller.api.listRestoreToken.value).toBe(2)

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

  it('forces fullscreen on mobile and restores list state when the viewport grows back to desktop', async () => {
    setViewportWidth(768)

    const controller = await mountController()

    expect(controller.api.surfaceMode.value).toBe('fullscreen')
    expect(controller.api.showBackToList.value).toBe(false)
    expect(dataSourceMock.setAutoPrefetchEnabled).toHaveBeenLastCalledWith(true)

    controller.api.returnToList()
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('fullscreen')
    expect(controller.api.listRestoreToken.value).toBe(0)

    setViewportWidth(1_280)
    window.dispatchEvent(new Event('resize'))
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('list')
    expect(controller.api.listRestoreToken.value).toBe(1)

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

  it('returns desktop fullscreen to list mode when Escape is pressed', async () => {
    setViewportWidth(1_280)

    const controller = await mountController()

    controller.api.openFullscreen(2)
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('fullscreen')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await controller.flush()

    expect(controller.api.surfaceMode.value).toBe('list')
    expect(controller.api.listRestoreToken.value).toBe(2)

    controller.unmount()
  })
})

async function mountController(initialProps: Partial<VibeProps> = {}) {
  let api!: ReturnType<typeof useController>

  const props = reactive({
    resolve: vi.fn(async () => ({ items: [], nextPage: null })),
    ...initialProps,
  }) as Readonly<VibeProps>

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useController(props, vi.fn())
      return () => h('div')
    },
  }))

  app.mount(container)
  await flush()

  return {
    api,
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
  dataSourceMock.commitPendingAppend.mockClear()
  dataSourceMock.currentCursor.value = null
  dataSourceMock.errorMessage.value = null
  dataSourceMock.fillCollectedCount.value = null
  dataSourceMock.fillDelayRemainingMs.value = null
  dataSourceMock.fillTargetCount.value = null
  dataSourceMock.hasNextPage.value = false
  dataSourceMock.hasPreviousPage.value = false
  dataSourceMock.items.value = []
  dataSourceMock.loading.value = false
  dataSourceMock.mode.value = 'dynamic'
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
