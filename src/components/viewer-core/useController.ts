import { computed, onBeforeUnmount, onMounted, reactive, readonly, ref, watch, watchEffect } from 'vue'

import { isEditableTarget } from './dom'
import type { VibeStatus, VibeSurfaceMode } from './removalState'
import { useDataSource, type VibeEmit, type VibeProps } from './useDataSource'

export const DESKTOP_BREAKPOINT_PX = 1024

export function useController(props: Readonly<VibeProps>, emit: VibeEmit) {
  const dataSource = useDataSource(props, emit)
  const listBoundaryLoadProgress = reactive({
    nextBoundaryLoadProgress: 0,
    previousBoundaryLoadProgress: 0,
  })
  const viewportWidth = ref(0)
  const desktopSurface = ref<VibeSurfaceMode>('list')
  const status = reactive<VibeStatus>({
    activeIndex: 0,
    currentCursor: null,
    errorMessage: null,
    fillCollectedCount: null,
    fillCompletedCalls: 0,
    fillCursor: null,
    fillDelayRemainingMs: null,
    fillLoadedCount: 0,
    fillMode: 'idle',
    fillProgress: null,
    fillTargetCalls: null,
    fillTargetCount: null,
    fillTotalCount: null,
    hasNextPage: false,
    hasPreviousPage: false,
    itemCount: 0,
    itemsRevision: 0,
    loadState: 'loaded',
    nextBoundaryLoadProgress: 0,
    nextCursor: null,
    pageLoadingLocked: false,
    phase: 'idle',
    previousBoundaryLoadProgress: 0,
    previousCursor: null,
    removedCount: 0,
    removedIds: [],
    removedRevision: 0,
    surfaceMode: 'list',
  })

  const isDesktop = computed(() => viewportWidth.value >= DESKTOP_BREAKPOINT_PX)
  const itemsRevision = ref(0)
  const removedRevision = ref(0)
  const surfaceMode = computed<VibeSurfaceMode>(() => isDesktop.value ? desktopSurface.value : 'fullscreen')
  const showBackToList = computed(() => isDesktop.value && surfaceMode.value === 'fullscreen')

  watch(
    isDesktop,
    (nextIsDesktop) => {
      if (nextIsDesktop) {
        syncControlledSurfaceMode()
      }
    },
  )

  watch(
    () => props.surfaceMode,
    () => {
      syncControlledSurfaceMode()
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
    [
      () => dataSource.items.value.length,
      () => dataSource.loading.value,
      () => dataSource.hasNextPage.value,
      () => dataSource.pendingAppendItems.value.length,
    ],
    ([nextItemCount, nextLoading, nextHasNextPage, pendingAppendCount]) => {
      if (!isDesktop.value || nextItemCount > 0 || desktopSurface.value === 'list') {
        return
      }

      if (nextLoading || nextHasNextPage || pendingAppendCount > 0) {
        return
      }

      desktopSurface.value = 'list'
      emit('update:surfaceMode', 'list')
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

  watch(
    () => dataSource.items.value,
    (items) => {
      itemsRevision.value += 1
      status.itemCount = items.length
      status.itemsRevision = itemsRevision.value
    },
    { immediate: true },
  )

  watch(
    () => dataSource.getRemovedIds(),
    (removedIds) => {
      removedRevision.value += 1
      status.removedCount = dataSource.removedCount.value
      status.removedIds = removedIds
      status.removedRevision = removedRevision.value
    },
    { immediate: true },
  )

  watchEffect(() => {
    status.activeIndex = dataSource.activeIndex.value
    status.currentCursor = dataSource.currentCursor.value
    status.errorMessage = dataSource.errorMessage.value
    status.fillCollectedCount = dataSource.fillCollectedCount.value
    status.fillCompletedCalls = dataSource.fillCompletedCalls.value
    status.fillCursor = dataSource.fillCursor.value
    status.fillDelayRemainingMs = dataSource.fillDelayRemainingMs.value
    status.fillLoadedCount = dataSource.fillLoadedCount.value
    status.fillMode = dataSource.fillMode.value
    status.fillProgress = dataSource.fillProgress.value
    status.fillTargetCalls = dataSource.fillTargetCalls.value
    status.fillTargetCount = dataSource.fillTargetCount.value
    status.fillTotalCount = dataSource.fillTotalCount.value
    status.hasNextPage = dataSource.hasNextPage.value
    status.hasPreviousPage = dataSource.hasPreviousPage.value
    status.loadState = dataSource.loading.value
      ? 'loading'
      : (dataSource.errorMessage.value ? 'failed' : 'loaded')
    status.nextBoundaryLoadProgress = listBoundaryLoadProgress.nextBoundaryLoadProgress
    status.nextCursor = dataSource.nextCursor.value
    status.pageLoadingLocked = dataSource.isPageLoadingLocked.value
    status.phase = dataSource.phase.value
    status.previousBoundaryLoadProgress = listBoundaryLoadProgress.previousBoundaryLoadProgress
    status.previousCursor = dataSource.previousCursor.value
    status.surfaceMode = surfaceMode.value
  })

  onMounted(() => {
    updateViewportWidth()
    syncControlledSurfaceMode()
    window.addEventListener('keydown', onWindowKeydown)
    window.addEventListener('resize', updateViewportWidth)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onWindowKeydown)
    window.removeEventListener('resize', updateViewportWidth)
  })

  function openFullscreen(index: number) {
    dataSource.setActiveIndex(index)

    if (isDesktop.value && desktopSurface.value !== 'fullscreen') {
      desktopSurface.value = 'fullscreen'
      emit('update:surfaceMode', 'fullscreen')
    }
  }

  function returnToList() {
    if (!isDesktop.value || desktopSurface.value === 'list') {
      return
    }

    desktopSurface.value = 'list'
    emit('update:surfaceMode', 'list')
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

  function syncControlledSurfaceMode() {
    if (!isDesktop.value || !props.surfaceMode || props.surfaceMode === desktopSurface.value) {
      return
    }

    desktopSurface.value = props.surfaceMode
  }

  function setBoundaryLoadProgress(value: {
    nextBoundaryLoadProgress: number
    previousBoundaryLoadProgress: number
  }) {
    listBoundaryLoadProgress.nextBoundaryLoadProgress = clamp(value.nextBoundaryLoadProgress)
    listBoundaryLoadProgress.previousBoundaryLoadProgress = clamp(value.previousBoundaryLoadProgress)
  }

  return {
    ...dataSource,
    cancel: dataSource.cancel,
    isDesktop,
    lockPageLoading: dataSource.lockPageLoading,
    loadNext: dataSource.loadNext,
    loadPrevious: dataSource.loadPrevious,
    openFullscreen,
    returnToList,
    retry: dataSource.retry,
    setBoundaryLoadProgress,
    showBackToList,
    status: readonly(status),
    surfaceMode,
    unlockPageLoading: dataSource.unlockPageLoading,
  }
}

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1)
}
