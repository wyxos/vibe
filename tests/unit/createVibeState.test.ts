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
