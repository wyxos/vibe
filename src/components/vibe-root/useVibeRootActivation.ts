import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

export function useVibeRootActivation(options: {
  enabled: Ref<boolean>
  onDisable: () => void
  onEnable: () => Promise<void> | void
  onKeydown: (event: KeyboardEvent) => void
  onResize: () => void
}) {
  let hasWindowListeners = false

  watch(
    options.enabled,
    async (enabled) => {
      syncWindowListeners(enabled)

      if (enabled) {
        options.onResize()
        await options.onEnable()
        return
      }

      options.onDisable()
    },
    {
      immediate: true,
    },
  )

  onMounted(() => {
    options.onResize()
    if (options.enabled.value) {
      void options.onEnable()
    }
  })

  onBeforeUnmount(() => {
    syncWindowListeners(false)
    options.onDisable()
  })

  function syncWindowListeners(enabled: boolean) {
    if (enabled && !hasWindowListeners) {
      window.addEventListener('resize', options.onResize)
      window.addEventListener('keydown', options.onKeydown)
      hasWindowListeners = true
      return
    }

    if (!enabled && hasWindowListeners) {
      window.removeEventListener('resize', options.onResize)
      window.removeEventListener('keydown', options.onKeydown)
      hasWindowListeners = false
    }
  }
}
