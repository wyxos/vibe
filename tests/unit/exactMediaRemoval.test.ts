import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeMediaAsset,
} from '@/index'

function asset(id: string): VibeMediaAsset {
  return {
    src: `https://example.com/${id}.jpg`,
    preview: {
      height: 600,
      src: `https://example.com/${id}-preview.jpg`,
      width: 450,
    },
    height: 1_200,
    width: 900,
  }
}

function item(postId: number, children: string[] = []): VibeItem {
  return {
    ...asset(`${postId}-primary`),
    items: children.map(asset),
    postId,
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

describe('exact media removal', () => {
  let instance: VibeInstance | null = null
  let target: HTMLDivElement

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(800)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(function scrollTo(this: HTMLElement, options: ScrollToOptions) {
        this.scrollTop = Number(options.top ?? 0)
      }),
    })
  })

  afterEach(() => {
    instance?.destroy()
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([
    { expectedIndex: '0', expectedSrc: '1-middle.jpg', mediaIndex: 0, moves: 0 },
    { expectedIndex: '1', expectedSrc: '1-last.jpg', mediaIndex: 1, moves: 1 },
    { expectedIndex: '0', expectedSrc: '1-primary.jpg', mediaIndex: 2, moves: 2 },
  ])('cycles after removing active media %#', async ({
    expectedIndex,
    expectedSrc,
    mediaIndex,
    moves,
  }) => {
    instance = createVibe({
      initialPage: { items: [item(1, ['1-middle', '1-last'])], next: null },
      layout: 'reel',
      target,
    })
    await instance.mount()
    for (let index = 0; index < moves; index += 1) {
      instance.nextReelMediaItem()
      await flushPromises()
    }
    await flushPromises()

    const removal = instance.removeMedia({ mediaIndex, postId: 1 })
    await flushPromises()

    expect(removal?.mediaIndex).toBe(mediaIndex)
    expect(target.querySelector('.reel-feed')?.getAttribute('data-active-media-index'))
      .toBe(expectedIndex)
    const current = instance.getState().items[0]!
    const sources = [current.src, ...current.items.map(({ src }) => src)]
    expect(sources.some((src) => src.endsWith(expectedSrc))).toBe(true)
  })

  it('uses the native media slide before committing animated exact-media removal', async () => {
    instance = createVibe({
      initialPage: { items: [item(1, ['1-middle', '1-last'])], next: null },
      layout: 'reel',
      target,
    })
    await instance.mount()

    const removalPromise = instance.removeMediaAnimated?.({ mediaIndex: 0, postId: 1 })
    await flushPromises()
    expect(removalPromise).toBeDefined()
    expect(instance.getState().items[0]?.items).toHaveLength(2)
    expect(target.querySelector('.reel-feed')?.getAttribute('data-active-media-index'))
      .toBe('1')

    const removal = await removalPromise
    await flushPromises()
    expect(removal?.mediaIndex).toBe(0)
    expect(instance.getState().items[0]?.items).toHaveLength(1)
    expect(target.querySelector('.reel-feed')?.getAttribute('data-active-media-index'))
      .toBe('0')
    expect(target.querySelector<HTMLImageElement>('.reel-item .media-preview')?.src)
      .toContain('1-middle')
  })

  it('preserves a different visible post when non-active media is removed', async () => {
    instance = createVibe({
      initialPage: { items: [item(1), item(2, ['2-child'])], next: null },
      layout: 'reel',
      target,
    })
    await instance.mount()
    expect(instance.nextReelPost()).toBe(true)
    await flushPromises()

    instance.removeMedia({ mediaIndex: 0, postId: 1 })

    expect(instance.getState().activeReelPostId).toBe(2)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([2])
  })

  it('advances to the next loaded post without closing reel mode', async () => {
    instance = createVibe({
      initialPage: { items: [item(1), item(2)], next: null },
      layout: 'reel',
      target,
    })
    await instance.mount()

    instance.removeMedia({ mediaIndex: 0, postId: 1 })
    await flushPromises()

    expect(instance.getState().activeReelPostId).toBe(2)
    expect(instance.getState().layout).toBe('reel')
    expect(instance.getState().reelForward.status).toBe('idle')
  })

  it('keeps the reel and information sheet mounted while loading forward', async () => {
    const nextPage = deferred<{ items: VibeItem[]; next: null }>()
    const Sheet = defineComponent({
      props: { item: { type: Object, required: true } },
      setup: (props) => () => h('p', `Sheet ${String((props.item as VibeItem).postId)}`),
    })
    instance = createVibe({
      initialPage: { items: [item(1)], next: 'next' },
      layout: 'reel',
      loadPage: () => nextPage.promise,
      reelInfoSheet: { component: Sheet, enabled: true },
      target,
    })
    await instance.mount()

    instance.removeMedia({ mediaIndex: 0, postId: 1 })
    await flushPromises()

    expect(instance.getState().reelForward.status).toBe('loading')
    expect(target.textContent).toContain('Loading the next media')
    expect(target.querySelector('[data-test="reel-info-sheet"]')).not.toBeNull()
    expect(target.textContent).toContain('Sheet 1')

    nextPage.resolve({ items: [item(2)], next: null })
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(2)
    expect(instance.getState().reelForward.status).toBe('idle')
  })

  it('restores pending media as active without overriding a loaded replacement', async () => {
    const nextPage = deferred<{ items: VibeItem[]; next: null }>()
    instance = createVibe({
      initialPage: { items: [item(1)], next: 'next' },
      layout: 'reel',
      loadPage: () => nextPage.promise,
      target,
    })
    await instance.mount()

    const pendingRemoval = instance.removeMedia({ mediaIndex: 0, postId: 1 })!
    expect(instance.restoreMediaRemoval(pendingRemoval)).toBe(true)
    expect(instance.getState().activeReelPostId).toBe(1)
    nextPage.resolve({ items: [item(2)], next: null })
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(1)

    const loadedRemoval = instance.removeMedia({ mediaIndex: 0, postId: 1 })!
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(2)
    expect(instance.restoreMediaRemoval(loadedRemoval)).toBe(true)
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(2)
    expect(target.querySelector('.reel-feed')?.getAttribute('data-active-post-id')).toBe('2')
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
  })

  it('shows recoverable error and exhaustion states', async () => {
    const loadPage = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ items: [item(2)], next: null })
    instance = createVibe({
      initialPage: { items: [item(1)], next: 'next' },
      layout: 'reel',
      loadPage,
      target,
    })
    await instance.mount()

    instance.removeMedia({ mediaIndex: 0, postId: 1 })
    await flushPromises()
    expect(instance.getState().reelForward.status).toBe('error')
    expect(target.textContent).toContain('Unable to load the next media')

    await instance.retryReelForward()
    expect(instance.getState().activeReelPostId).toBe(2)

    instance.removeMedia({ mediaIndex: 0, postId: 2 })
    await flushPromises()
    expect(instance.getState().reelForward.status).toBe('end')
    expect(target.textContent).toContain('reached the end')
  })
})
