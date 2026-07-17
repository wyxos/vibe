import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createVibe, type VibeInstance, type VibeItem } from '@/index'

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

describe('load-more lock', () => {
  let instance: VibeInstance | null = null

  afterEach(() => {
    instance?.destroy()
    instance = null
    vi.restoreAllMocks()
  })

  it('blocks direct pagination until the instance is unlocked', async () => {
    const loadPage = vi.fn().mockResolvedValue({
      items: [item(2)],
      next: null,
    })
    instance = createVibe({
      target: document.createElement('div'),
      infiniteScroll: false,
      initialPage: { items: [item(1)], next: 'page-2' },
      loadPage,
    })
    await instance.mount()

    instance.setLoadMoreLocked(true)
    await instance.loadNext()

    expect(loadPage).not.toHaveBeenCalled()
    expect(instance.getState().loadMoreLocked).toBe(true)

    instance.setLoadMoreLocked(false)
    await instance.loadNext()

    expect(loadPage).toHaveBeenCalledOnce()
    expect(loadPage.mock.calls[0]?.[0].cursor).toBe('page-2')
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
  })

  it('rechecks the bottom boundary as soon as infinite loading is unlocked', async () => {
    const target = document.createElement('div')
    const loadPage = vi.fn().mockResolvedValue({
      items: [item(2)],
      next: null,
    })
    instance = createVibe({
      target,
      initialPage: { items: [item(1)], next: 'page-2' },
      loadPage,
    })
    await instance.mount()
    const gallery = target.querySelector<HTMLElement>('.gallery-shell')!
    Object.defineProperties(gallery, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 300, writable: true },
    })

    instance.setLoadMoreLocked(false)
    await flushPromises()
    expect(loadPage).not.toHaveBeenCalled()

    instance.setLoadMoreLocked(true)
    gallery.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(loadPage).not.toHaveBeenCalled()

    instance.setLoadMoreLocked(false)
    await flushPromises()

    expect(loadPage).toHaveBeenCalledOnce()
    expect(loadPage.mock.calls[0]?.[0].cursor).toBe('page-2')
  })

  it('allows an active request to finish and keeps reload independent', async () => {
    let resolvePage: (page: { items: VibeItem[], next: null }) => void = () => {}
    const loadPage = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolvePage = resolve }))
      .mockResolvedValueOnce({ items: [item(3)], next: null })
    instance = createVibe({
      target: document.createElement('div'),
      infiniteScroll: false,
      initialPage: { items: [item(1)], next: 'page-2' },
      loadPage,
    })
    await instance.mount()

    const pending = instance.loadNext()
    instance.setLoadMoreLocked(true)
    resolvePage({ items: [item(2)], next: null })
    await pending

    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])

    await instance.reload()
    expect(loadPage.mock.calls[1]?.[0].cursor).toBeNull()
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([3])
    expect(instance.getState().loadMoreLocked).toBe(true)
  })
})
