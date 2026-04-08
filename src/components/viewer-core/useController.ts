import { computed, onBeforeUnmount, onMounted, reactive, readonly, ref, watch, watchEffect } from 'vue'

import { isEditableTarget } from './dom'
import type { VibeStatus } from './removalState'
import { useDataSource, type VibeEmit, type VibeProps } from './useDataSource'

export const DESKTOP_BREAKPOINT_PX = 1024

type VibeDesktopSurface = 'fullscreen' | 'list'

export function useController(props: Readonly<VibeProps>, emit: VibeEmit) {
  const dataSource = useDataSource(props, emit)
  const viewportWidth = ref(0)
  const desktopSurface = ref<VibeDesktopSurface>('list')
  const listRestoreToken = ref(0)
  const status = reactive<VibeStatus>({
    activeIndex: 0,
    currentCursor: null,
    errorMessage: null,
    fillCollectedCount: null,
    fillTargetCount: null,
    hasNextPage: false,
    hasPreviousPage: false,
    isAutoMode: false,
    itemCount: 0,
    loadState: 'loaded',
    mode: null,
    nextCursor: null,
    phase: 'idle',
    previousCursor: null,
    removedCount: 0,
    surfaceMode: 'list',
  })

  const isDesktop = computed(() => viewportWidth.value >= DESKTOP_BREAKPOINT_PX)
  const surfaceMode = computed<VibeDesktopSurface>(() => isDesktop.value ? desktopSurface.value : 'fullscreen')
  const showBackToList = computed(() => isDesktop.value && surfaceMode.value === 'fullscreen')

  watch(
    isDesktop,
    (nextIsDesktop, previousIsDesktop) => {
      if (nextIsDesktop && !previousIsDesktop && desktopSurface.value === 'list') {
        listRestoreToken.value += 1
      }
    },
  )

  watch(
    [surfaceMode, () => dataSource.pendingAppendItems.value.length],
    ([nextSurfaceMode, pendingAppendCount]) => {
      if (nextSurfaceMode === 'list' || pendingAppendCount <= 0) {
        return
      }

      void dataSource.commitPendingAppend()
    },
  )

  watch(
    surfaceMode,
    (nextSurfaceMode) => {
      dataSource.setAutoPrefetchEnabled(nextSurfaceMode === 'fullscreen')
    },
    {
      immediate: true,
    },
  )

  watchEffect(() => {
    status.activeIndex = dataSource.activeIndex.value
    status.currentCursor = dataSource.currentCursor.value
    status.errorMessage = dataSource.errorMessage.value
    status.fillCollectedCount = dataSource.fillCollectedCount.value
    status.fillTargetCount = dataSource.fillTargetCount.value
    status.hasNextPage = dataSource.hasNextPage.value
    status.hasPreviousPage = dataSource.hasPreviousPage.value
    status.isAutoMode = dataSource.isAutoMode.value
    status.itemCount = dataSource.items.value.length
    status.loadState = dataSource.loading.value
      ? 'loading'
      : (dataSource.errorMessage.value ? 'failed' : 'loaded')
    status.mode = dataSource.mode.value
    status.nextCursor = dataSource.nextCursor.value
    status.phase = dataSource.phase.value
    status.previousCursor = dataSource.previousCursor.value
    status.removedCount = dataSource.removedCount.value
    status.surfaceMode = surfaceMode.value
  })

  onMounted(() => {
    updateViewportWidth()
    window.addEventListener('keydown', onWindowKeydown)
    window.addEventListener('resize', updateViewportWidth)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onWindowKeydown)
    window.removeEventListener('resize', updateViewportWidth)
  })

  function openFullscreen(index: number) {
    dataSource.setActiveIndex(index)

    if (isDesktop.value) {
      desktopSurface.value = 'fullscreen'
    }
  }

  function returnToList() {
    if (!isDesktop.value) {
      return
    }

    desktopSurface.value = 'list'
    listRestoreToken.value += 1
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (
      event.defaultPrevented
      || event.key !== 'Escape'
      || !isDesktop.value
      || surfaceMode.value !== 'fullscreen'
      || isEditableTarget(event.target)
    ) {
      return
    }

    event.preventDefault()
    returnToList()
  }

  function updateViewportWidth() {
    viewportWidth.value = window.innerWidth || 0
  }

  return {
    ...dataSource,
    isDesktop,
    listRestoreToken,
    openFullscreen,
    returnToList,
    showBackToList,
    status: readonly(status),
    surfaceMode,
  }
}
