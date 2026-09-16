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

describe('createVibe state notifications', () => {
  let instance: VibeInstance | null = null

  afterEach(() => {
    instance?.destroy()
    instance = null
  })

  it('notifies consumers as the instance state changes', async () => {
    const target = document.createElement('div')
    const onStateChange = vi.fn()
    const loadPage = vi.fn().mockResolvedValue({
      items: [item(1)],
      next: null,
      total: 1,
    })
    instance = createVibe({ target, loadPage, onStateChange })

    expect(onStateChange).toHaveBeenCalledOnce()
    expect(onStateChange.mock.lastCall?.[0]).toMatchObject({
      isLoading: true,
      items: [],
      lifecycle: 'loading',
    })

    await instance.mount()
    await flushPromises()

    expect(onStateChange.mock.lastCall?.[0]).toMatchObject({
      error: null,
      isLoading: false,
      items: [expect.objectContaining({ postId: 1 })],
      lifecycle: 'loaded',
      total: 1,
    })
    expect(instance.getState().lifecycle).toBe('loaded')
  })

  it('notifies nested auto-scroll and in-place media edits without copying item contents', async () => {
    const target = document.createElement('div')
    const onStateChange = vi.fn()
    instance = createVibe({
      initialPage: {
        items: [{
          ...item(1),
          items: [{
            src: 'https://example.com/1-extra.jpg',
            preview: {
              src: 'https://example.com/1-extra-preview.jpg',
              width: 450,
              height: 600,
            },
            width: 900,
            height: 1200,
          }],
        }],
        next: null,
        total: 1,
      },
      loadPage: vi.fn(),
      onStateChange,
      target,
    })

    instance.setAutoScroll(true)
    await flushPromises()
    expect(onStateChange.mock.lastCall?.[0]).toMatchObject({
      autoScroll: expect.objectContaining({ enabled: true, paused: false }),
    })

    instance.pauseAutoScroll()
    await flushPromises()
    expect(onStateChange.mock.lastCall?.[0]).toMatchObject({
      autoScroll: expect.objectContaining({ paused: true }),
    })

    const beforeMedia = onStateChange.mock.calls.length
    const removal = instance.removeMedia({ mediaIndex: 1, postId: 1 })
    await flushPromises()
    expect(removal).not.toBeNull()
    expect(onStateChange.mock.calls.length).toBeGreaterThan(beforeMedia)
    expect(onStateChange.mock.lastCall?.[0].items[0]).toMatchObject({ postId: 1 })

    const beforeNested = onStateChange.mock.calls.length
    const current = instance.getState().items[0]!
    current.width = 42
    await flushPromises()
    expect(onStateChange).toHaveBeenCalledTimes(beforeNested)
  })

  it('reuses notification item snapshots until the collection changes', async () => {
    const target = document.createElement('div')
    const states: Parameters<NonNullable<Parameters<typeof createVibe>[0]['onStateChange']>>[0][] = []
    instance = createVibe({
      initialPage: { items: [item(1)], next: 'next' },
      loadPage: vi.fn().mockResolvedValue({ items: [item(2)], next: null }),
      onStateChange: (state) => states.push(state),
      target,
    })
    const initialItems = states.at(-1)!.items
    const firstPublicItems = instance.getState().items

    instance.setTotal(10)
    await flushPromises()
    expect(states.at(-1)!.items).toBe(initialItems)
    expect(instance.getState().items).not.toBe(firstPublicItems)

    await instance.loadNext()
    await flushPromises()
    expect(states.at(-1)!.items).not.toBe(initialItems)
    expect(states.at(-1)!.items.map(({ postId }) => postId)).toEqual([1, 2])
  })

  it('exposes pagination failures through the public lifecycle', async () => {
    const target = document.createElement('div')
    const onStateChange = vi.fn()
    let rejectNextPage: (reason: Error) => void = () => {}
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'next' })
      .mockImplementationOnce(() => new Promise((_resolve, reject) => {
        rejectNextPage = reject
      }))
    instance = createVibe({ target, loadPage, onStateChange })

    await instance.mount()
    await flushPromises()
    expect(instance.getState().lifecycle).toBe('loaded')

    const loadNextPromise = instance.loadNext()
    await flushPromises()
    expect(onStateChange.mock.lastCall?.[0]).toMatchObject({
      isLoadingMore: true,
      lifecycle: 'loading',
    })

    rejectNextPage(new Error('offline'))
    await loadNextPromise
    await flushPromises()
    expect(instance.getState()).toMatchObject({
      lifecycle: 'error',
      nextPageError: expect.any(Error),
    })
  })
})
