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
    vi.useRealTimers()
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

  it('pauses frontend autofill after the accepted provider page', async () => {
    let resolvePage: (page: { items: VibeItem[], next: string }) => void = () => {}
    const loadPage = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolvePage = resolve }))
      .mockResolvedValueOnce({ items: [item(3), item(4)], next: null })
    instance = createVibe({
      autofill: { delayStepMs: 0, strategy: 'frontend', pageSize: 3 },
      infiniteScroll: false,
      initialPage: { items: [item(1), item(10), item(11)], next: 'page-2' },
      loadPage,
      target: document.createElement('div'),
    })
    await instance.mount()

    const pending = instance.loadNext()
    await flushPromises()
    instance.setLoadMoreLocked(true)
    resolvePage({ items: [item(2)], next: 'page-3' })
    await pending

    expect(loadPage).toHaveBeenCalledOnce()
    expect(instance.getState()).toMatchObject({
      loadMoreLocked: true,
      next: 'page-3',
      autofill: { status: 'paused' },
    })
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 10, 11, 2])

    instance.setLoadMoreLocked(false)
    await flushPromises()
    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(instance.getState().autofill).toMatchObject({
      received: 3,
      requests: 2,
      status: 'complete',
    })
  })

  it('cancels an active page immediately without engaging the lock', async () => {
    let requestSignal: AbortSignal | null = null
    const loadPage = vi.fn(({ signal }: { signal: AbortSignal }) => {
      requestSignal = signal
      return new Promise(() => undefined)
    })
    instance = createVibe({
      infiniteScroll: false,
      initialPage: { items: [item(1)], next: 'page-2' },
      loadPage,
      target: document.createElement('div'),
    })
    await instance.mount()

    void instance.loadNext()
    await flushPromises()
    await instance.cancelLoading()

    expect(requestSignal?.aborted).toBe(true)
    expect(instance.getState()).toMatchObject({
      isLoadingMore: false,
      loadMoreLocked: false,
      next: 'page-2',
    })
  })

  it('preserves completed autofill pages and their cursor when cancelled', async () => {
    const requests: unknown[] = []
    const loadPage = vi.fn(({ cursor, signal }: { cursor: unknown; signal: AbortSignal }) => {
      requests.push(cursor)
      if (cursor === 'page-2') {
        return Promise.resolve({ items: [item(2)], next: 'page-3' })
      }
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })
    instance = createVibe({
      autofill: { strategy: 'frontend', pageSize: 3 },
      infiniteScroll: false,
      initialPage: { items: [item(1), item(10), item(11)], next: 'page-2' },
      loadPage,
      target: document.createElement('div'),
    })
    await instance.mount()

    const loading = instance.loadNext()
    await flushPromises()
    await instance.cancelLoading()
    await loading

    expect(requests).toEqual(['page-2'])
    expect(instance.getState()).toMatchObject({
      autofill: { received: 1, requests: 1, status: 'cancelled' },
      loadMoreLocked: false,
      next: 'page-3',
    })
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 10, 11, 2])
  })

  it('locks during a delayed boundary without issuing the next request', async () => {
    vi.useFakeTimers()
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 'page-3' })
      .mockResolvedValueOnce({ items: [item(3), item(4)], next: null })
    instance = createVibe({
      autofill: { delayMaxMs: 1_000, delayStepMs: 1_000, pageSize: 3, strategy: 'frontend' },
      infiniteScroll: false,
      initialPage: { items: [item(1), item(10), item(11)], next: 'page-2' },
      loadPage,
      target: document.createElement('div'),
    })
    await instance.mount()

    const loading = instance.loadNext()
    await flushPromises()
    expect(loadPage).toHaveBeenCalledOnce()
    instance.setLoadMoreLocked(true)
    await vi.advanceTimersByTimeAsync(1_000)
    await loading

    expect(loadPage).toHaveBeenCalledOnce()
    expect(instance.getState().autofill.status).toBe('paused')

    instance.setLoadMoreLocked(false)
    await flushPromises()
    await vi.advanceTimersByTimeAsync(1_000)
    await flushPromises()
    expect(loadPage).toHaveBeenCalledTimes(2)
  })
})
