import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import { useEdgeBoundary } from '@/components/viewer-core/useEdgeBoundary'

describe('useEdgeBoundary', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not register a fresh intent from boundary re-entry caused only by layout mutation', async () => {
    vi.useFakeTimers()

    const boundaryActive = ref(false)
    const hasPage = ref(true)
    const loading = ref(false)
    const requestPage = vi.fn()

    const mounted = await mountUseEdgeBoundary({
      getAnimationLockMs: () => 10,
      hasPage,
      isAtBoundary: () => boundaryActive.value,
      loading,
      requestPage: ref(requestPage),
    })

    boundaryActive.value = false
    mounted.api.syncBoundary()

    boundaryActive.value = true
    mounted.api.syncBoundary()
    mounted.api.maybeRequestPage()

    expect(requestPage).toHaveBeenCalledTimes(1)

    mounted.api.onItemsMutated(1)

    boundaryActive.value = false
    mounted.api.syncBoundary()
    boundaryActive.value = true
    mounted.api.syncBoundary()

    await vi.advanceTimersByTimeAsync(10)
    mounted.api.maybeRequestPage()

    expect(requestPage).toHaveBeenCalledTimes(1)

    mounted.api.onWheel(new WheelEvent('wheel', {
      deltaY: 180,
    }))
    mounted.api.maybeRequestPage()

    expect(requestPage).toHaveBeenCalledTimes(2)

    mounted.unmount()
  })
})

async function mountUseEdgeBoundary(options: Parameters<typeof useEdgeBoundary>[0]) {
  let api!: ReturnType<typeof useEdgeBoundary>
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useEdgeBoundary(options)
      return () => h('div')
    },
  }))

  app.mount(container)
  await nextTick()

  return {
    api,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}
