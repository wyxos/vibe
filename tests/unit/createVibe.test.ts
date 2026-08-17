import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import {
  createVibe,
  type VibeCardRegionProps,
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

function videoItem(postId: number): VibeItem {
  const base = item(postId)

  return {
    ...base,
    src: `https://example.com/${postId}.mp4`,
    preview: {
      ...base.preview,
      src: `https://example.com/${postId}-preview.mp4`,
    },
  }
}

function groupedItem(postId: number): VibeItem {
  const base = item(postId)

  return {
    ...base,
    items: [
      {
        ...base,
        src: `https://example.com/${postId}-a.jpg`,
        preview: {
          ...base.preview,
          src: `https://example.com/${postId}-a-preview.jpg`,
        },
      },
      {
        ...base,
        src: `https://example.com/${postId}-b.jpg`,
        preview: {
          ...base.preview,
          src: `https://example.com/${postId}-b-preview.jpg`,
        },
      },
    ],
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

  it('requires positive deterministic card region heights', () => {
    const Region = defineComponent(() => () => h('span'))

    expect(() => createVibe({
      cardHeader: { component: Region, height: 0 },
      target,
      initialPage: { items: [item(1)], next: null },
    })).toThrow('Vibe cardHeader height must be a positive number.')
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

  it('checks the terminal cursor again from the end-of-feed CTA', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'cursor-2' })
      .mockResolvedValueOnce({ items: [item(2)], next: null })
      .mockResolvedValueOnce({ items: [item(2), item(3)], next: 'cursor-3' })
    const instance = track(createVibe({ target, loadPage }))
    await instance.mount()
    await instance.loadNext()
    await flushPromises()
    expect(target.textContent).toContain("You've reached the end.")
    target.querySelector<HTMLElement>('[data-test="retry-end"]')!.click()
    await flushPromises()
    expect(loadPage).toHaveBeenCalledTimes(3)
    expect(loadPage.mock.calls[2]?.[0].cursor).toBe('cursor-2')
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3])
    expect(instance.getState().next).toBe('cursor-3')
  })

  it('supports static initial data and runtime layout changes', async () => {
    const instance = track(createVibe({
      target,
      initialPage: { items: [item(1), item(2)], next: null, total: 2 },
      infiniteScroll: false,
    }))
    await instance.mount()

    expect(target.querySelector('[data-layout-mode="masonry"]')).not.toBeNull()
    expect(target.querySelector('[data-test="retry-end"]')).toBeNull()
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

  it('owns responsive layout selection while allowing forced overrides', async () => {
    let screenWidth = 430
    let screenHeight = 932
    let viewportWidth = 430
    let viewportHeight = 932
    vi.spyOn(window.screen, 'width', 'get').mockImplementation(() => screenWidth)
    vi.spyOn(window.screen, 'height', 'get').mockImplementation(() => screenHeight)
    vi.spyOn(document.documentElement, 'clientWidth', 'get')
      .mockImplementation(() => viewportWidth)
    vi.spyOn(document.documentElement, 'clientHeight', 'get')
      .mockImplementation(() => viewportHeight)
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    const instance = track(createVibe({
      target,
      layout: 'responsive',
      initialPage: { items: [item(1)], next: null },
    }))

    await instance.mount()
    await flushPromises()
    expect(instance.getState().layout).toBe('reel')
    expect(target.querySelector('[data-layout-mode="reel"]')).not.toBeNull()

    instance.setLayout('masonry')
    await flushPromises()
    expect(instance.getState().layout).toBe('masonry')

    instance.setLayout('responsive')
    await flushPromises()
    expect(instance.getState().layout).toBe('reel')

    screenWidth = 820
    screenHeight = 1180
    viewportWidth = 820
    viewportHeight = 1180
    window.dispatchEvent(new Event('resize'))
    await flushPromises()
    expect(instance.getState().layout).toBe('masonry')
  })

  it('mounts custom card header and footer components without activating the card', async () => {
    const CardHeader = defineComponent({
      props: [
        'index',
        'item',
        'layout',
        'loadedCount',
        'mediaCount',
        'mediaIndex',
        'mediaItem',
        'mediaSource',
        'total',
      ],
      setup(props) {
        return () => h(
          'button',
          { 'data-test': 'custom-header', type: 'button' },
          `${(props as unknown as VibeCardRegionProps).item.postId}`
          + `:${props.layout}:${props.mediaSource}`
          + `:${props.index}:${props.loadedCount}:${props.total}`
          + `:${props.mediaIndex}:${props.mediaCount}`,
        )
      },
    })
    const CardFooter = defineComponent({
      props: ['item'],
      setup(props) {
        return () => h(
          'span',
          { 'data-test': 'custom-footer' },
          `footer:${(props.item as VibeItem).postId}`,
        )
      },
    })
    const instance = track(createVibe({
      cardFooter: { component: CardFooter, height: 52 },
      cardHeader: { component: CardHeader, height: 40 },
      target,
      initialPage: { items: [item(1), item(2)], next: null, total: 8 },
    }))

    await instance.mount()
    await flushPromises()

    const headers = target.querySelectorAll<HTMLElement>('[data-test="custom-header"]')
    const header = headers[0]!
    expect(header.textContent).toBe('1:masonry:preview:0:2:8:0:1')
    expect(headers[1]?.textContent).toBe('2:masonry:preview:1:2:8:0:1')
    expect(target.querySelector('[data-test="custom-footer"]')?.textContent).toBe('footer:1')
    expect(header.parentElement?.style.height).toBe('40px')
    expect(target.querySelector<HTMLElement>('.media-card-footer')?.style.height).toBe('52px')

    header.click()
    await flushPromises()
    expect(target.querySelector('.vibe-reel-overlay')).toBeNull()

    target.querySelector<HTMLElement>('[aria-label="Open post 1"]')!.click()
    await flushPromises()
    expect(target.querySelector('.vibe-reel-overlay [data-test="custom-header"]')
      ?.textContent).toBe('1:reel:original:0:2:8:0:1')
  })

  it('shares a looping grouped-media selection between masonry and reel', async () => {
    const instance = track(createVibe({
      target,
      initialPage: { items: [groupedItem(1)], next: null },
    }))
    await instance.mount()
    await flushPromises()

    const next = target.querySelector<HTMLElement>('[aria-label="Next media for post 1"]')!
    next.click()
    await flushPromises()
    expect(target.querySelector<HTMLElement>('[data-post-id="1"] img')?.getAttribute('src'))
      .toBe('https://example.com/1-a-preview.jpg')

    target.querySelector<HTMLElement>('[data-post-id="1"]')!.dispatchEvent(new MouseEvent(
      'click',
      { bubbles: true, detail: 1 },
    ))
    await flushPromises()
    const reel = target.querySelector<HTMLElement>('.vibe-reel-overlay .reel-feed')!
    expect(reel.dataset.activeMediaIndex).toBe('1')
    expect(target.querySelector<HTMLElement>(
      '.vibe-reel-overlay [data-media-index="1"] img',
    )?.getAttribute('src')).toBe('https://example.com/1-a.jpg')

    target.querySelector<HTMLElement>(
      '.vibe-reel-overlay [data-media-index="1"] .media-card-media',
    )!.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaX: 100,
      deltaY: 0,
    }))
    await flushPromises()
    expect(reel.dataset.activeMediaIndex).toBe('2')

    target.querySelector<HTMLElement>(
      '.vibe-reel-overlay [data-media-index="2"] [aria-label="Next media for post 1"]',
    )!.click()
    await flushPromises()
    expect(reel.dataset.activeMediaIndex).toBe('0')

    target.querySelector<HTMLElement>(
      '.vibe-reel-overlay [data-media-index="0"] [aria-label="Previous media for post 1"]',
    )!.click()
    await flushPromises()
    expect(reel.dataset.activeMediaIndex).toBe('2')

    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      cancelable: true,
    }))
    await flushPromises()
    expect(reel.dataset.activeMediaIndex).toBe('0')

    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      cancelable: true,
    }))
    await flushPromises()
    expect(reel.dataset.activeMediaIndex).toBe('2')
  })

  it('toggles reel video playback from the media and custom control', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const instance = track(createVibe({
      target,
      layout: 'reel',
      initialPage: { items: [videoItem(1)], next: null },
    }))

    await instance.mount()
    await flushPromises()
    const video = target.querySelector<HTMLVideoElement>('video')!
    video.dispatchEvent(new Event('loadedmetadata'))
    await flushPromises()

    video.click()
    expect(play).toHaveBeenCalledOnce()
    video.dispatchEvent(new Event('playing'))
    await flushPromises()

    const pauseControl = target.querySelector<HTMLElement>('[aria-label="Pause video"]')!
    expect(pauseControl).not.toBeNull()
    pauseControl.click()
    expect(pause).toHaveBeenCalledOnce()
    video.dispatchEvent(new Event('pause'))
    await flushPromises()
    expect(target.querySelector('[aria-label="Play video"]')).not.toBeNull()
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
    clickedCard.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      detail: 1,
    }))
    await flushPromises()

    expect(instance.getState()).toMatchObject({
      activeReelPostId: 2,
      layout: 'masonry',
      reelOrigin: 'masonry',
    })
    const overlay = target.querySelector<HTMLElement>('.vibe-reel-overlay')!
    expect(overlay).not.toBeNull()
    expect(overlay.hasAttribute('style')).toBe(false)
    expect(target.querySelector('.masonry-feed')).toBe(masonry)
    expect(masonry.scrollTop).toBe(180)
    expect(target.querySelector('.reel-feed')?.getAttribute('data-active-post-id')).toBe('2')
    expect(target.querySelector<HTMLElement>('.vibe-reel-overlay [data-post-id="2"] img')
      ?.getAttribute('src')).toBe('https://example.com/2.jpg')

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
    expect(clickedCard.classList).toContain('media-card-focus-silent')
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
