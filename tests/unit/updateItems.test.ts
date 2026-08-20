import { afterEach, describe, expect, it, vi } from 'vitest'

import { createVibe, type VibeInstance, type VibeItem } from '@/index'
import { applyItemUpdates } from '@/core/updateItems'

function item(postId: VibeItem['postId'], suffix = ''): VibeItem {
  return {
    postId,
    src: `https://example.com/${postId}${suffix}.jpg`,
    preview: {
      src: `https://example.com/${postId}${suffix}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
    items: [],
  }
}

function groupedItem(postId: number): VibeItem {
  return {
    ...item(postId),
    items: [
      {
        src: `https://example.com/${postId}-a.jpg`,
        preview: { src: `https://example.com/${postId}-a-preview.jpg`, width: 450, height: 600 },
        width: 900,
        height: 1200,
      },
      {
        src: `https://example.com/${postId}-b.jpg`,
        preview: { src: `https://example.com/${postId}-b-preview.jpg`, width: 450, height: 600 },
        width: 900,
        height: 1200,
      },
    ],
  }
}

describe('updateItems', () => {
  let instance: VibeInstance | null = null

  afterEach(() => {
    instance?.destroy()
    instance = null
  })

  it('replaces a loaded item without refreshing the feed', async () => {
    const loadPage = vi.fn()
    instance = createVibe({
      target: document.createElement('div'),
      initialPage: {
        items: [item(1), item(2)],
        next: 'page-2',
        total: 4,
      },
      loadPage,
    })
    await instance.mount()

    const updated = instance.updateItems([item(2, '-local')])

    expect(updated).toEqual([2])
    expect(loadPage).not.toHaveBeenCalled()
    expect(instance.getState()).toMatchObject({
      items: [
        expect.objectContaining({ postId: 1, src: 'https://example.com/1.jpg' }),
        expect.objectContaining({
          postId: 2,
          src: 'https://example.com/2-local.jpg',
          preview: expect.objectContaining({ src: 'https://example.com/2-local-preview.jpg' }),
        }),
      ],
      next: 'page-2',
      total: 4,
    })
  })

  it('matches string and numeric post ids and ignores unknown items', async () => {
    instance = createVibe({
      target: document.createElement('div'),
      initialPage: { items: [item(9), item(8)], next: null, total: 2 },
    })
    await instance.mount()

    const updated = instance.updateItems([item('9', '-ready'), item(4, '-missing')])

    expect(updated).toEqual([9])
    expect(instance.getState().items.map(({ postId, src }) => ({ postId, src }))).toEqual([
      { postId: 9, src: 'https://example.com/9-ready.jpg' },
      { postId: 8, src: 'https://example.com/8.jpg' },
    ])
  })

  it('keeps the later replacement when the same post is supplied twice', async () => {
    instance = createVibe({
      target: document.createElement('div'),
      initialPage: { items: [item(3)], next: null },
    })
    await instance.mount()

    instance.updateItems([item(3, '-first'), item(3, '-second')])

    expect(instance.getState().items[0]).toMatchObject({
      postId: 3,
      src: 'https://example.com/3-second.jpg',
    })
  })

  it('clamps the stored media index and updates a matching reel-forward item', () => {
    const current = groupedItem(5)
    const replacement = item(5, '-local')
    const state = {
      items: [current],
      mediaIndices: new Map([[5, 2]]),
      reelForwardItem: current,
    }

    const updated = applyItemUpdates(state as never, [replacement])

    expect(updated).toEqual([5])
    expect(state.mediaIndices.get(5)).toBe(0)
    expect(state.items[0]).toMatchObject({ src: 'https://example.com/5-local.jpg' })
    expect(state.reelForwardItem).toBe(state.items[0])
  })
})
