import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { VibeViewerItem } from '@/components/vibeViewer'

const controllerState = createControllerState()

vi.mock('@/components/vibe-root/useVibeRootController', () => ({
  useVibeRootController: () => controllerState,
}))

vi.mock('@/components/VibeFullscreenSurface.vue', () => ({
  default: {
    template: '<div data-testid="stub-fullscreen-surface" />',
  },
}))

vi.mock('@/components/VibeListSurface.vue', () => ({
  default: {
    template: '<div data-testid="stub-list-surface" />',
  },
}))

import VibeRoot from '@/components/VibeRoot.vue'

describe('VibeRoot feedback states', () => {
  beforeEach(() => {
    resetControllerState()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a retry button for an empty failed initial load', async () => {
    controllerState.canRetryInitialLoad.value = true
    controllerState.errorMessage.value = 'Temporary failure'
    controllerState.items.value = []

    const wrapper = mount(VibeRoot, {
      props: {
        getItems: vi.fn(),
      },
    })

    const retryButton = wrapper.get('button')

    expect(retryButton.text()).toBe('Retry')

    await retryButton.trigger('click')

    expect(controllerState.retryInitialLoad).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('shows a non-blocking warning banner when items are still visible', () => {
    controllerState.canRetryInitialLoad.value = false
    controllerState.errorMessage.value = 'Temporary failure'
    controllerState.items.value = [createItem('warning-image')]

    const wrapper = mount(VibeRoot, {
      props: {
        items: controllerState.items.value,
      },
    })

    expect(wrapper.text()).toContain('Temporary failure')
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('[data-testid="stub-fullscreen-surface"]').exists()).toBe(true)

    wrapper.unmount()
  })
})

function createControllerState() {
  const activeIndex = ref(0)
  const canRetryInitialLoad = ref(false)
  const commitPendingAppend = vi.fn(async () => {})
  const errorMessage = ref<string | null>(null)
  const hasNextPage = ref(false)
  const hasPreviousPage = ref(false)
  const isAutoMode = ref(false)
  const isDesktop = ref(false)
  const items = ref<VibeViewerItem[]>([])
  const listRestoreToken = ref(0)
  const loading = ref(false)
  const paginationDetail = ref<string | null>(null)
  const pendingAppendItems = ref<VibeViewerItem[]>([])
  const prefetchNextPage = vi.fn(async () => {})
  const prefetchPreviousPage = vi.fn(async () => {})
  const retryInitialLoad = vi.fn(async () => {})
  const setActiveIndex = vi.fn()
  const setAutoPrefetchEnabled = vi.fn()
  const showBackToList = ref(false)
  const surfaceMode = computed(() => 'fullscreen' as const)

  return {
    activeIndex,
    canRetryInitialLoad,
    commitPendingAppend,
    errorMessage,
    hasNextPage,
    hasPreviousPage,
    isAutoMode,
    isDesktop,
    items,
    listRestoreToken,
    loading,
    openFullscreen: vi.fn(),
    paginationDetail,
    pendingAppendItems,
    prefetchNextPage,
    prefetchPreviousPage,
    returnToList: vi.fn(),
    retryInitialLoad,
    setActiveIndex,
    setAutoPrefetchEnabled,
    showBackToList,
    surfaceMode,
  }
}

function resetControllerState() {
  controllerState.activeIndex.value = 0
  controllerState.canRetryInitialLoad.value = false
  controllerState.commitPendingAppend.mockClear()
  controllerState.errorMessage.value = null
  controllerState.hasNextPage.value = false
  controllerState.hasPreviousPage.value = false
  controllerState.isAutoMode.value = false
  controllerState.isDesktop.value = false
  controllerState.items.value = []
  controllerState.listRestoreToken.value = 0
  controllerState.loading.value = false
  controllerState.openFullscreen.mockClear()
  controllerState.paginationDetail.value = null
  controllerState.pendingAppendItems.value = []
  controllerState.prefetchNextPage.mockClear()
  controllerState.prefetchPreviousPage.mockClear()
  controllerState.returnToList.mockClear()
  controllerState.retryInitialLoad.mockClear()
  controllerState.setActiveIndex.mockClear()
  controllerState.setAutoPrefetchEnabled.mockClear()
  controllerState.showBackToList.value = false
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
