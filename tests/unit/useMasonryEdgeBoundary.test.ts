import { createApp, defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useEdgeBoundary, type VibeMasonryEdgeDirection } from '@/components/viewer-core/useEdgeBoundary'

describe('useEdgeBoundary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('locks a boundary request through load completion and animation cooldown', async () => {
    const boundary = await mountEdgeBoundary('top', () => 400)

    boundary.state.atBoundary.value = false
    boundary.api.syncBoundary()
    boundary.state.atBoundary.value = true
    boundary.api.syncBoundary()

    boundary.api.maybeRequestPage()
    expect(boundary.state.requestPage.value).toHaveBeenCalledTimes(1)

    boundary.api.onLoadingChange(false)
    boundary.api.maybeRequestPage()
    expect(boundary.state.requestPage.value).toHaveBeenCalledTimes(1)

    boundary.state.atBoundary.value = false
    boundary.api.syncBoundary()
    boundary.state.atBoundary.value = true
    boundary.api.syncBoundary()
    boundary.api.maybeRequestPage()
    expect(boundary.state.requestPage.value).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_000)

    boundary.state.atBoundary.value = false
    boundary.api.syncBoundary()
    boundary.state.atBoundary.value = true
    boundary.api.syncBoundary()
    boundary.api.maybeRequestPage()
    expect(boundary.state.requestPage.value).toHaveBeenCalledTimes(2)

    boundary.api.onItemsMutated(25)
    boundary.api.maybeRequestPage()
    expect(boundary.state.requestPage.value).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(399)
    boundary.state.atBoundary.value = false
    boundary.api.syncBoundary()
    boundary.state.atBoundary.value = true
    boundary.api.syncBoundary()
    boundary.api.maybeRequestPage()
    expect(boundary.state.requestPage.value).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)

    boundary.state.atBoundary.value = false
    boundary.api.syncBoundary()
    boundary.state.atBoundary.value = true
    boundary.api.syncBoundary()
    boundary.api.maybeRequestPage()
    expect(boundary.state.requestPage.value).toHaveBeenCalledTimes(3)

    boundary.unmount()
  })

  it('only registers matching wheel intent at the boundary', async () => {
    const boundary = await mountEdgeBoundary('bottom')

    boundary.state.atBoundary.value = true
    boundary.api.syncBoundary()

    boundary.api.onWheel(createWheelEvent(-64))
    boundary.api.maybeRequestPage()
    expect(boundary.state.requestPage.value).toHaveBeenCalledTimes(0)

    boundary.api.onWheel(createWheelEvent(64))
    boundary.api.maybeRequestPage()
    expect(boundary.state.requestPage.value).toHaveBeenCalledTimes(1)

    boundary.unmount()
  })
})

async function mountEdgeBoundary(
  direction: VibeMasonryEdgeDirection,
  getAnimationLockMs: (addedItemCount: number) => number = () => 250,
) {
  const state = {
    atBoundary: ref(false),
    hasPage: ref(true),
    loading: ref(false),
    requestPage: ref(vi.fn(() => undefined)),
  }

  let api!: ReturnType<typeof useEdgeBoundary>

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useEdgeBoundary({
        direction,
        getAnimationLockMs,
        hasPage: state.hasPage,
        isAtBoundary: () => state.atBoundary.value,
        loading: state.loading,
        requestPage: state.requestPage as Ref<(() => void | Promise<void>) | null>,
      })

      return () => h('div')
    },
  }))

  app.mount(container)
  await flush()

  return {
    api,
    state,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

function createWheelEvent(deltaY: number) {
  return {
    deltaX: 0,
    deltaY,
    preventDefault: vi.fn(),
    target: document.createElement('div'),
  } as WheelEvent
}

async function flush() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
