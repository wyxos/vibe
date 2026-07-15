import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('createVibe', () => {
  const instances: VibeInstance[] = []
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
    instances.splice(0).forEach((instance) => instance.destroy())
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function track(instance: VibeInstance): VibeInstance {
    instances.push(instance)
    return instance
  }

  it('requires either a loader or an initial page', () => {
    expect(() => createVibe({ target })).toThrow(
      'Vibe requires either initialPage or loadPage.',
    )
  })

  it('loads the initial page with a null cursor and renders it', async () => {
    const loadPage = vi.fn().mockResolvedValue({
      items: [item(1)],
      next: 'cursor-2',
      total: 2,
    })
    const instance = track(createVibe({ target, loadPage }))

    const mountPromise = instance.mount()
    expect(target.textContent).toContain('Loading media…')
    await mountPromise
    await flushPromises()

    expect(loadPage).toHaveBeenCalledOnce()
    expect(loadPage.mock.calls[0]?.[0].cursor).toBeNull()
    expect(loadPage.mock.calls[0]?.[0].signal).toBeInstanceOf(AbortSignal)
    expect(target.querySelector('[data-post-id="1"]')).not.toBeNull()
    expect(instance.getState()).toMatchObject({
      error: null,
      isLoading: false,
      next: 'cursor-2',
      total: 2,
    })
  })

  it('loads the next cursor once and removes duplicate post IDs', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'cursor-2', total: 3 })
      .mockResolvedValueOnce({ items: [item(1), item(2)], next: null, total: 3 })
    const instance = track(createVibe({ target, loadPage }))
    await instance.mount()

    await Promise.all([instance.loadNext(), instance.loadNext()])

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(loadPage.mock.calls[1]?.[0].cursor).toBe('cursor-2')
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(instance.getState().next).toBeNull()
  })

  it('supports static initial data and runtime layout changes', async () => {
    const instance = track(createVibe({
      target,
      initialPage: { items: [item(1), item(2)], next: null, total: 2 },
      infiniteScroll: false,
    }))
    await instance.mount()

    expect(target.querySelector('[data-layout-mode="masonry"]')).not.toBeNull()
    expect(instance.getState().infiniteScroll).toBe(false)

    instance.setLayout('reel')
    instance.setInfiniteScroll(true)
    await flushPromises()

    expect(target.querySelector('[data-layout-mode="reel"]')).not.toBeNull()
    expect(instance.getState()).toMatchObject({
      activeReelPostId: 1,
      infiniteScroll: true,
      layout: 'reel',
      reelOrigin: null,
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(target.querySelector('[data-layout-mode="reel"]')).not.toBeNull()
  })

  it('keeps masonry mounted and restores it after a masonry-origin reel', async () => {
    const instance = track(createVibe({
      target,
      initialPage: { items: [item(1), item(2), item(3)], next: null },
    }))
    await instance.mount()
    await flushPromises()

    const masonry = target.querySelector<HTMLElement>('.masonry-feed')!
    masonry.scrollTop = 180
    const clickedCard = target.querySelector<HTMLElement>('[data-post-id="2"]')!
    clickedCard.click()
    await flushPromises()

    expect(instance.getState()).toMatchObject({
      activeReelPostId: 2,
      layout: 'masonry',
      reelOrigin: 'masonry',
    })
    expect(target.querySelector('.vibe-reel-overlay')).not.toBeNull()
    expect(target.querySelector('.masonry-feed')).toBe(masonry)
    expect(masonry.scrollTop).toBe(180)
    expect(target.querySelector('.reel-feed')?.getAttribute('data-active-post-id')).toBe('2')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(instance.getState()).toMatchObject({
      activeReelPostId: null,
      layout: 'masonry',
      reelOrigin: null,
    })
    expect(target.querySelector('.vibe-reel-overlay')).toBeNull()
    expect(target.querySelector('.masonry-feed')).toBe(masonry)
    expect(masonry.scrollTop).toBe(180)
    expect(document.activeElement).toBe(clickedCard)
  })

  it('surfaces an initial error and can reload', async () => {
    const loadPage = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ items: [item(2)], next: null })
    const instance = track(createVibe({ target, loadPage }))

    await instance.mount()
    expect(target.textContent).toContain('Unable to load media.')
    expect(instance.getState().error).toBeInstanceOf(Error)

    await instance.reload()
    await flushPromises()

    expect(instance.getState().error).toBeNull()
    expect(target.querySelector('[data-post-id="2"]')).not.toBeNull()
  })

  it('aborts an in-flight request when destroyed', async () => {
    let requestSignal: AbortSignal | null = null
    const loadPage = vi.fn(({ signal }: { signal: AbortSignal }) => {
      requestSignal = signal

      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })
    const instance = track(createVibe({ target, loadPage }))
    const mountPromise = instance.mount()
    await flushPromises()

    instance.destroy()
    await mountPromise

    expect(requestSignal?.aborted).toBe(true)
    expect(target.childElementCount).toBe(0)
  })
})
