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

describe('feed refresh boundaries', () => {
  let instance: VibeInstance | null = null

  afterEach(() => {
    instance?.destroy()
    instance = null
  })

  it('refreshes a restored feed from its continuation cursor', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 'page-3', total: 3 })
    instance = createVibe({
      target: document.createElement('div'),
      initialPage: { items: [item(1)], next: 'page-2', total: 3 },
      loadPage,
    })
    await instance.mount()

    await instance.refresh()

    expect(loadPage.mock.calls[0]?.[0]).toMatchObject({ cursor: 'page-2' })
    expect(instance.getState()).toMatchObject({
      items: [expect.objectContaining({ postId: 2 })],
      next: 'page-3',
      total: 3,
    })
  })

  it('uses the continuation cursor, falls back at the end, and keeps reload initial', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 'page-3', total: 3 })
      .mockResolvedValueOnce({ items: [item(3)], next: null, total: 3 })
      .mockResolvedValueOnce({ items: [item(30)], next: null, total: 3 })
      .mockResolvedValueOnce({ items: [item(10)], next: 'page-2-new', total: 4 })
    instance = createVibe({
      target: document.createElement('div'),
      infiniteScroll: false,
      initialPage: { items: [item(1)], next: 'page-2', total: 3 },
      loadPage,
    })
    await instance.mount()

    await instance.loadNext()
    expect(loadPage.mock.calls[0]?.[0]).toMatchObject({ cursor: 'page-2' })
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])

    await instance.refresh()
    expect(loadPage.mock.calls[1]?.[0]).toMatchObject({ cursor: 'page-3' })
    expect(instance.getState()).toMatchObject({
      items: [expect.objectContaining({ postId: 3 })],
      next: null,
      total: 3,
    })

    await instance.refresh()
    expect(loadPage.mock.calls[2]?.[0]).toMatchObject({ cursor: 'page-3' })
    expect(instance.getState().items[0]?.postId).toBe(30)

    await instance.reload()
    expect(loadPage.mock.calls[3]?.[0]).toMatchObject({ cursor: null })
    expect(instance.getState()).toMatchObject({
      items: [expect.objectContaining({ postId: 10 })],
      next: 'page-2-new',
      total: 4,
    })
  })

  it('requires a page loader to refresh', async () => {
    instance = createVibe({
      target: document.createElement('div'),
      initialPage: { items: [item(1)], next: null },
    })

    await expect(instance.refresh()).rejects.toThrow(
      'Vibe cannot refresh without loadPage.',
    )
  })
})
