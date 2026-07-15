import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeReelRouteContext,
} from '@/index'

function item(postId: number): VibeItem {
  return {
    postId,
    src: `https://example.com/${postId}.jpg`,
    preview: {
      src: `https://example.com/${postId}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
    items: [],
  }
}

describe('createVibe routing', () => {
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
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('pushes the first reel URL, replaces it while swiping, and restores the feed URL', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/feed', name: 'feed', component: { render: () => null } },
        {
          path: '/feed/file/:fileId',
          name: 'file',
          component: { render: () => null },
        },
      ],
    })
    await router.push('/feed')
    await router.isReady()
    const reelRoute = vi.fn(({ item: activeItem }: VibeReelRouteContext) => ({
      name: 'file',
      params: { fileId: String(activeItem.postId) },
    }))

    instance = createVibe({
      target,
      initialPage: { items: [item(1), item(2)], next: null, total: 8 },
      routing: {
        router,
        feed: { name: 'feed' },
        reel: reelRoute,
      },
    })
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="1"]')!.click()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/feed/file/1')
    expect(reelRoute).toHaveBeenLastCalledWith(expect.objectContaining({
      index: 0,
      loadedCount: 2,
      origin: 'masonry',
      total: 8,
    }))

    const reel = target.querySelector<HTMLElement>('.reel-feed')!
    await new Promise((resolve) => setTimeout(resolve, 150))
    reel.scrollTop = 500
    reel.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/feed/file/2')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/feed')
  })
})
