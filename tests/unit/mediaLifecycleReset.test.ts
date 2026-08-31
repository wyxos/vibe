import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeMediaLifecycleContext,
} from '@/index'

function item(postId: number): VibeItem {
  return {
    height: 1200,
    items: [],
    postId,
    preview: { height: 600, src: `/${postId}-preview.jpg`, width: 450 },
    src: `/${postId}.jpg`,
    width: 900,
  }
}

describe('media lifecycle feed visits', () => {
  let instance: VibeInstance | null = null
  let target: HTMLDivElement

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })

  afterEach(() => {
    instance?.destroy()
    instance = null
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function loadImage(postId: number): void {
    target.querySelector<HTMLImageElement>(`[data-post-id="${postId}"] img`)!
      .dispatchEvent(new Event('load'))
  }

  it('starts a new lifecycle visit when the current feed is refreshed', async () => {
    const onMediaFullyVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const onMediaVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    instance = createVibe({
      infiniteScroll: false,
      initialPage: { current: 'page-1', items: [item(1)], next: null },
      loadPage: vi.fn().mockResolvedValue({ current: 'page-1', items: [item(1)], next: null }),
      onMediaFullyVisible,
      onMediaVisible,
      target,
    })
    await instance.mount()
    await flushPromises()

    loadImage(1)
    await flushPromises()
    expect(onMediaFullyVisible).toHaveBeenCalledOnce()
    expect(onMediaVisible).toHaveBeenCalledOnce()

    await instance.refresh()
    await flushPromises()
    expect(onMediaFullyVisible).toHaveBeenCalledOnce()
    expect(onMediaVisible).toHaveBeenCalledOnce()

    loadImage(1)
    await flushPromises()
    expect(onMediaFullyVisible).toHaveBeenCalledTimes(2)
    expect(onMediaVisible).toHaveBeenCalledTimes(2)
  })

  it('starts a new lifecycle visit when the initial feed is reloaded', async () => {
    const onMediaFullyVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const onMediaVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    instance = createVibe({
      infiniteScroll: false,
      initialPage: { items: [item(1)], next: null },
      loadPage: vi.fn().mockResolvedValue({ items: [item(1)], next: null }),
      onMediaFullyVisible,
      onMediaVisible,
      target,
    })
    await instance.mount()
    await flushPromises()

    loadImage(1)
    await flushPromises()
    expect(onMediaFullyVisible).toHaveBeenCalledOnce()
    expect(onMediaVisible).toHaveBeenCalledOnce()

    await instance.reload()
    await flushPromises()
    expect(onMediaFullyVisible).toHaveBeenCalledOnce()
    expect(onMediaVisible).toHaveBeenCalledOnce()

    loadImage(1)
    await flushPromises()
    expect(onMediaFullyVisible).toHaveBeenCalledTimes(2)
    expect(onMediaVisible).toHaveBeenCalledTimes(2)
  })

  it('keeps lifecycle deduplication while loading the next page', async () => {
    const onMediaFullyVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const onMediaVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    instance = createVibe({
      infiniteScroll: false,
      initialPage: { items: [item(1)], next: 'page-2' },
      loadPage: vi.fn().mockResolvedValue({ items: [item(2)], next: null }),
      onMediaFullyVisible,
      onMediaVisible,
      target,
    })
    await instance.mount()
    await flushPromises()

    loadImage(1)
    await flushPromises()
    await instance.loadNext()
    await flushPromises()
    loadImage(1)
    loadImage(2)
    await flushPromises()

    expect(onMediaFullyVisible.mock.calls.map(([context]) => context.postId))
      .toEqual([1, 2])
    expect(onMediaVisible.mock.calls.map(([context]) => context.postId))
      .toEqual([1, 2])
  })
})
