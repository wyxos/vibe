import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createVibe,
  type VibeInstance,
  type VibeItem,
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

function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  return {
    promise: new Promise<T>((accept) => { resolve = accept }),
    resolve,
  }
}

describe('item removal and restoration', () => {
  let instance: VibeInstance | null = null
  let target: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    target = document.createElement('div')
    document.body.append(target)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(2_000)
  })

  afterEach(() => {
    instance?.destroy()
    target.remove()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('reverses the entry motion, removes multiple items, and restores their indexes', async () => {
    instance = createVibe({
      target,
      initialPage: {
        items: [item(1), item(2), item(3), item(4)],
        next: null,
      },
    })
    await instance.mount()

    const removal = instance.removeItems([4, 2, 2])
    await flushPromises()

    const secondCard = target.querySelector<HTMLElement>('[data-post-id="2"]')!
    const thirdCard = target.querySelector<HTMLElement>('[data-post-id="3"]')!
    const fourthCard = target.querySelector<HTMLElement>('[data-post-id="4"]')!
    const thirdCardTarget = thirdCard.style.transform
    expect(secondCard.classList.contains('media-card--leaving')).toBe(true)
    expect(fourthCard.classList.contains('media-card--leaving')).toBe(true)
    expect(secondCard.style.transform).not.toBe('translate3d(0px, 0px, 0)')
    expect(thirdCardTarget).toBe('translate3d(253px, 0px, 0)')
    expect(secondCard.getAttribute('aria-hidden')).toBe('true')

    await vi.advanceTimersByTimeAsync(455)
    const placements = await removal
    expect(placements.map(({ index, item: removedItem }) => [
      index,
      removedItem.postId,
    ])).toEqual([[1, 2], [3, 4]])
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 3])
    expect(target.querySelector<HTMLElement>('[data-post-id="3"]')?.style.transform)
      .toBe(thirdCardTarget)

    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    instance.restoreItems(placements)
    await flushPromises()

    expect(instance.getState().items.map(({ postId }) => postId))
      .toEqual([1, 2, 3, 4])
    expect(target.querySelector('[data-post-id="2"]')
      ?.classList.contains('media-card--entering')).toBe(true)
    expect(target.querySelector('[data-post-id="4"]')
      ?.classList.contains('media-card--entering')).toBe(true)
  })

  it('rejects invalid restore indexes without changing the field', async () => {
    instance = createVibe({
      target,
      initialPage: { items: [item(1)], next: null },
    })
    await instance.mount()

    expect(() => instance?.restoreItems([{ index: -1, item: item(2) }]))
      .toThrow('Vibe item restore indexes must be non-negative integers.')
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1])
  })

  it('restores specific removal transactions in their original order', async () => {
    instance = createVibe({
      target,
      initialPage: {
        items: [item(1), item(2), item(3), item(4)],
        next: null,
      },
    })
    await instance.mount()

    const firstRemovalPromise = instance.removeItems([2])
    await vi.advanceTimersByTimeAsync(455)
    const firstRemoval = await firstRemovalPromise

    const secondRemovalPromise = instance.removeItems([3])
    await vi.advanceTimersByTimeAsync(455)
    const secondRemoval = await secondRemovalPromise

    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 4])
    expect(instance.restoreRemoval(firstRemoval)).toBe(true)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 4])
    expect(instance.restoreRemoval(secondRemoval)).toBe(true)
    expect(instance.getState().items.map(({ postId }) => postId))
      .toEqual([1, 2, 3, 4])
    expect(instance.restoreRemoval(firstRemoval)).toBe(false)
  })

  it('keeps a masonry reel open and advances to the next loaded item', async () => {
    instance = createVibe({
      target,
      initialPage: { items: [item(1), item(2)], next: null },
    })
    await instance.mount()

    target.querySelector<HTMLElement>('[data-post-id="1"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()
    expect(target.querySelector('.vibe-reel-overlay')).not.toBeNull()

    const removalPromise = instance.removeItems([1])
    await vi.advanceTimersByTimeAsync(455)
    await removalPromise
    await flushPromises()

    expect(instance.getState().activeReelPostId).toBe(2)
    expect(instance.getState().reelOrigin).toBe('masonry')
    expect(instance.getState().reelForward.status).toBe('idle')
    expect(target.querySelector('.vibe-reel-overlay')).not.toBeNull()
  })

  it('loads the first item from the next page after removing the last loaded reel item', async () => {
    const nextPage = deferred<{ items: VibeItem[]; next: null }>()
    instance = createVibe({
      target,
      initialPage: { items: [item(1), item(2)], next: 'next' },
      loadPage: () => nextPage.promise,
    })
    await instance.mount()

    target.querySelector<HTMLElement>('[data-post-id="1"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()
    expect(instance.nextReelPost()).toBe(true)
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(2)
    const removalPromise = instance.removeItems([2])
    await vi.advanceTimersByTimeAsync(455)
    await removalPromise
    await flushPromises()

    expect(instance.getState().reelForward.status).toBe('loading')
    expect(instance.getState().activeReelPostId).toBe(2)
    expect(target.querySelector('.vibe-reel-overlay')).not.toBeNull()
    expect(target.textContent).toContain('Loading the next media')

    nextPage.resolve({ items: [item(3)], next: null })
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(3)
    expect(instance.getState().reelForward.status).toBe('idle')
    expect(target.querySelector('.vibe-reel-overlay')).not.toBeNull()
  })

  it('restores a pending active item without moving away from a loaded replacement', async () => {
    const nextPage = deferred<{ items: VibeItem[]; next: null }>()
    instance = createVibe({
      target,
      initialPage: { items: [item(1)], next: 'next' },
      loadPage: () => nextPage.promise,
    })
    await instance.mount()

    target.querySelector<HTMLElement>('[data-post-id="1"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()
    const pendingRemovalPromise = instance.removeItems([1])
    await vi.advanceTimersByTimeAsync(455)
    const pendingRemoval = await pendingRemovalPromise
    expect(instance.restoreRemoval(pendingRemoval)).toBe(true)
    expect(instance.getState().activeReelPostId).toBe(1)

    nextPage.resolve({ items: [item(2)], next: null })
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(1)

    const loadedRemovalPromise = instance.removeItems([1])
    await vi.advanceTimersByTimeAsync(455)
    const loadedRemoval = await loadedRemovalPromise
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(2)
    expect(instance.restoreRemoval(loadedRemoval)).toBe(true)
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(2)
    expect(target.querySelector('.reel-feed')?.getAttribute('data-active-post-id')).toBe('2')
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
  })

  it('bounds latest-removal undo without invalidating returned transactions', async () => {
    instance = createVibe({
      target,
      initialPage: {
        items: [item(1), item(2), item(3), item(4)],
        next: null,
      },
      removalHistoryLimit: 1,
    })
    await instance.mount()

    const firstRemovalPromise = instance.removeItems([2])
    await vi.advanceTimersByTimeAsync(455)
    const firstRemoval = await firstRemovalPromise

    const secondRemovalPromise = instance.removeItems([3])
    await vi.advanceTimersByTimeAsync(455)
    const secondRemoval = await secondRemovalPromise

    expect(instance.undoLastRemoval()).toBe(secondRemoval)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 3, 4])
    expect(instance.undoLastRemoval()).toBeNull()
    expect(instance.restoreRemoval(firstRemoval)).toBe(true)
    expect(instance.getState().items.map(({ postId }) => postId))
      .toEqual([1, 2, 3, 4])
  })

  it('clears removal history when the field is reloaded', async () => {
    instance = createVibe({
      target,
      initialPage: {
        items: [item(1), item(2)],
        next: null,
      },
      loadPage: async () => ({
        items: [item(1), item(2)],
        next: null,
      }),
    })
    await instance.mount()

    const removalPromise = instance.removeItems([2])
    await vi.advanceTimersByTimeAsync(455)
    const removal = await removalPromise

    await instance.reload()

    expect(instance.undoLastRemoval()).toBeNull()
    expect(instance.restoreRemoval(removal)).toBe(false)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
  })

  it('validates the removal history limit', () => {
    expect(() => createVibe({
      target,
      initialPage: { items: [item(1)], next: null },
      removalHistoryLimit: 1.5,
    })).toThrow('Vibe removalHistoryLimit must be a non-negative integer.')
  })
})
