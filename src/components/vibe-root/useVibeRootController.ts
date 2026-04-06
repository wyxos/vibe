import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useVibeRootDataSource, type VibeRootEmit, type VibeRootProps } from './useVibeRootDataSource'

export const DESKTOP_BREAKPOINT_PX = 1024

type VibeDesktopSurface = 'fullscreen' | 'list'

export function useVibeRootController(props: Readonly<VibeRootProps>, emit: VibeRootEmit) {
  const dataSource = useVibeRootDataSource(props, emit)
  const viewportWidth = ref(0)
  const desktopSurface = ref<VibeDesktopSurface>('list')
  const listRestoreToken = ref(0)

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

  onMounted(() => {
    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth)
  })

  onBeforeUnmount(() => {
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
    surfaceMode,
  }
}
