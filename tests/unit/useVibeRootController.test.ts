import { createApp, defineComponent, h, nextTick, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { VibeViewerItem } from '@/components/vibeViewer'

import type { VibeRootProps } from '@/components/vibe-root/useVibeRootDataSource'

const dataSourceMock = createDataSourceMock()

vi.mock('@/components/vibe-root/useVibeRootDataSource', () => ({
  useVibeRootDataSource: () => ({
    activeIndex: dataSourceMock.activeIndex,
    canRetryInitialLoad: dataSourceMock.canRetryInitialLoad,
    commitPendingAppend: dataSourceMock.commitPendingAppend,
    errorMessage: dataSourceMock.errorMessage,
    hasNextPage: dataSourceMock.hasNextPage,
    hasPreviousPage: dataSourceMock.hasPreviousPage,
    isAutoMode: dataSourceMock.isAutoMode,
    items: dataSourceMock.items,
    loading: dataSourceMock.loading,
    paginationDetail: dataSourceMock.paginationDetail,
    pendingAppendItems: dataSourceMock.pendingAppendItems,
    prefetchNextPage: dataSourceMock.prefetchNextPage,
    prefetchPreviousPage: dataSourceMock.prefetchPreviousPage,
    removedCount: dataSourceMock.removedCount,
    retryInitialLoad: dataSourceMock.retryInitialLoad,
    setActiveIndex: dataSourceMock.setActiveIndex,
    setAutoPrefetchEnabled: dataSourceMock.setAutoPrefetchEnabled,
  }),
}))

function createDataSourceMock() {
  const activeIndex = ref(0)
  const canRetryInitialLoad = ref(false)
  const commitPendingAppend = vi.fn(async () => {})
  const errorMessage = ref<string | null>(null)
  const hasNextPage = ref(false)
  const hasPreviousPage = ref(false)
  const isAutoMode = ref(false)
  const items = ref<VibeViewerItem[]>([])
  const loading = ref(false)
  const paginationDetail = ref<string | null>(null)
  const pendingAppendItems = ref<VibeViewerItem[]>([])
  const prefetchNextPage = vi.fn(async () => {})
  const prefetchPreviousPage = vi.fn(async () => {})
  const removedCount = ref(0)
  const retryInitialLoad = vi.fn(async () => {})
  const setActiveIndex = vi.fn((nextIndex: number) => {
    activeIndex.value = nextIndex
  })
  const setAutoPrefetchEnabled = vi.fn()

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
    removedCount,
    retryInitialLoad,
    setActiveIndex,
    setAutoPrefetchEnabled,
  }
}

import { useVibeRootController } from '@/components/vibe-root/useVibeRootController'

describe('useVibeRootController', () => {
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

async function mountController(initialProps: Partial<VibeRootProps> = { items: [] }) {
  let api!: ReturnType<typeof useVibeRootController>

  const props = reactive({
    items: [],
    ...initialProps,
  }) as Readonly<VibeRootProps>

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useVibeRootController(props, vi.fn())
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
  dataSourceMock.errorMessage.value = null
  dataSourceMock.hasNextPage.value = false
  dataSourceMock.hasPreviousPage.value = false
  dataSourceMock.isAutoMode.value = false
  dataSourceMock.items.value = []
  dataSourceMock.loading.value = false
  dataSourceMock.paginationDetail.value = null
  dataSourceMock.pendingAppendItems.value = []
  dataSourceMock.prefetchNextPage.mockClear()
  dataSourceMock.prefetchPreviousPage.mockClear()
  dataSourceMock.removedCount.value = 0
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
