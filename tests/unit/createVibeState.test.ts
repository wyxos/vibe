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
