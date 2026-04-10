import { computed, onBeforeUnmount, onMounted, reactive, readonly, ref, watch, watchEffect } from 'vue'

import { isEditableTarget } from './dom'
import type { VibeStatus, VibeSurfaceMode } from './removalState'
import { useDataSource, type VibeEmit, type VibeProps } from './useDataSource'

export const DESKTOP_BREAKPOINT_PX = 1024

type VibeDesktopSurface = VibeSurfaceMode
type VibeControllerEmit = VibeEmit & ((event: 'update:surfaceMode', value: VibeSurfaceMode) => void)

export function useController(props: Readonly<VibeProps>, emit: VibeControllerEmit) {
  const dataSource = useDataSource(props, emit)
  const viewportWidth = ref(0)
  const desktopSurface = ref<VibeDesktopSurface>('list')
  const listRestoreToken = ref(0)
  const status = reactive<VibeStatus>({
    activeIndex: 0,
    currentCursor: null,
    errorMessage: null,
    fillCollectedCount: null,
    fillDelayRemainingMs: null,
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
  const isSurfaceModeControlled = computed(() => props.surfaceMode === 'fullscreen' || props.surfaceMode === 'list')
  const surfaceMode = computed<VibeDesktopSurface>(() => isDesktop.value ? (props.surfaceMode ?? desktopSurface.value) : 'fullscreen')
  const showBackToList = computed(() => isDesktop.value && surfaceMode.value === 'fullscreen')

  watch(
    () => props.surfaceMode,
    (nextSurfaceMode, previousSurfaceMode) => {
      if (!nextSurfaceMode) {
        return
      }

      desktopSurface.value = nextSurfaceMode

      if (
        isDesktop.value
        && previousSurfaceMode === 'fullscreen'
        && nextSurfaceMode === 'list'
      ) {
        listRestoreToken.value += 1
      }
    },
    {
      immediate: true,
    },
  )

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
    status.fillDelayRemainingMs = dataSource.fillDelayRemainingMs.value
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
      setDesktopSurface('fullscreen')
    }
  }

  function returnToList() {
    if (!isDesktop.value) {
      return
    }

    if (isSurfaceModeControlled.value) {
      if (surfaceMode.value !== 'list') {
        emit('update:surfaceMode', 'list')
      }
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

  function setDesktopSurface(nextSurfaceMode: VibeDesktopSurface) {
    if (isSurfaceModeControlled.value) {
      if (props.surfaceMode !== nextSurfaceMode) {
        emit('update:surfaceMode', nextSurfaceMode)
      }
      return
    }

    desktopSurface.value = nextSurfaceMode
  }

  return {
    ...dataSource,
    cancel: dataSource.cancel,
    isDesktop,
    listRestoreToken,
    loadNext: dataSource.loadNext,
    loadPrevious: dataSource.loadPrevious,
    openFullscreen,
    returnToList,
    retry: dataSource.retry,
    showBackToList,
    status: readonly(status),
    surfaceMode,
  }
}
