import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeMediaLifecycleContext,
} from '@/index'

function item(postId: number, grouped = false): VibeItem {
  const primary = {
    height: 1200,
    mediaId: `${postId}:primary`,
    preview: { height: 600, src: `/${postId}-preview.jpg`, width: 450 },
    src: `/${postId}.jpg`,
    width: 900,
  }
  return {
    ...primary,
    items: grouped
      ? [{ ...primary, mediaId: `${postId}:secondary`, src: `/${postId}-nested.jpg` }]
      : [],
    postId,
  }
}

describe('media lifecycle callbacks', () => {
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

  it('reports durable identity and placement when masonry media becomes ready', async () => {
    const items = [item(1, true), item(2)]
    const onMediaReady = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items, next: null },
      onMediaReady,
      target,
    }))
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="1"] img')!
      .dispatchEvent(new Event('load'))

    expect(onMediaReady).toHaveBeenCalledOnce()
    expect(onMediaReady.mock.calls[0]?.[0]).toMatchObject({
      item: items[0],
      layout: 'masonry',
      media: items[0],
      mediaId: '1:primary',
      mediaIndex: 0,
      origin: null,
      postId: 1,
      postIndex: 0,
    })
  })

  it('does not report readiness before a successful media load', async () => {
    const onMediaReady = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items: [item(1)], next: null },
      onMediaReady,
      target,
    }))
    await instance.mount()
    await flushPromises()

    const image = target.querySelector<HTMLElement>('[data-post-id="1"] img')!
    image.dispatchEvent(new Event('error'))

    expect(onMediaReady).not.toHaveBeenCalled()
  })

  it('reports loaded masonry media only after it enters the real viewport', async () => {
    const onMediaReady = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const onMediaVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: {
        items: [item(1), item(2), item(3), item(4), item(5), item(6)],
        next: null,
      },
      onMediaReady,
      onMediaVisible,
      target,
    }))
    await instance.mount()
    await flushPromises()

    const offscreenImage = target.querySelector<HTMLElement>('[data-post-id="5"] img')!
    offscreenImage.dispatchEvent(new Event('load'))
    await flushPromises()

    expect(onMediaReady).toHaveBeenCalledOnce()
    expect(onMediaVisible).not.toHaveBeenCalled()

    const gallery = target.querySelector<HTMLElement>('.masonry-feed')!
    gallery.scrollTop = 650
    gallery.dispatchEvent(new Event('scroll'))
    await flushPromises()

    expect(onMediaVisible).toHaveBeenCalledOnce()
    expect(onMediaVisible.mock.calls[0]?.[0]).toMatchObject({
      layout: 'masonry',
      phoneMode: false,
      postId: 5,
    })
  })

  it('never reports failed media as visible', async () => {
    const onMediaVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items: [item(1)], next: null },
      onMediaVisible,
      target,
    }))
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="1"] img')!
      .dispatchEvent(new Event('error'))
    await flushPromises()

    expect(onMediaVisible).not.toHaveBeenCalled()
  })

  it('reports only fully-visible lifecycle for ready active reel media', async () => {
    const onMediaFullyVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const onMediaVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items: [item(1), item(2)], next: null },
      layout: 'reel',
      onMediaFullyVisible,
      onMediaVisible,
      target,
    }))
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="2"] img')!
      .dispatchEvent(new Event('load'))
    await flushPromises()
    expect(onMediaFullyVisible).not.toHaveBeenCalled()
    expect(onMediaVisible).not.toHaveBeenCalled()

    expect(instance.nextReelPost()).toBe(true)
    await flushPromises()
    expect(onMediaFullyVisible).toHaveBeenCalledOnce()
    expect(onMediaFullyVisible.mock.calls[0]?.[0]).toMatchObject({
      layout: 'reel',
      phoneMode: false,
      postId: 2,
    })
    expect(onMediaVisible).not.toHaveBeenCalled()
  })

  it('keeps a forced masonry feed in phone mode and reports that context', async () => {
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(390)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(844)
    const onMediaVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items: [item(1)], next: null },
      layout: 'masonry',
      onMediaVisible,
      target,
    }))
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="1"] img')!
      .dispatchEvent(new Event('load'))
    await flushPromises()

    expect(instance.getState()).toMatchObject({ layout: 'masonry', phoneMode: true })
    expect(onMediaVisible.mock.calls[0]?.[0]).toMatchObject({
      layout: 'masonry',
      phoneMode: true,
      postId: 1,
    })
  })

  it('reports phone mode for fully-visible media in a phone reel', async () => {
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(390)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(844)
    const onMediaFullyVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const mobileItem = {
      ...item(1),
      mobile: { height: 800, src: '/1-mobile.jpg', width: 600 },
    }
    const instance = track(createVibe({
      initialPage: { items: [mobileItem], next: null },
      layout: 'reel',
      onMediaFullyVisible,
      target,
    }))
    await instance.mount()
    await flushPromises()

    const renderedMedia = target.querySelector<HTMLImageElement>('[data-post-id="1"] img')!
    expect(renderedMedia.getAttribute('src')).toBe('/1-mobile.jpg')
    expect(instance.getState()).toMatchObject({
      layout: 'reel',
      phoneMode: true,
    })
    renderedMedia
      .dispatchEvent(new Event('load'))
    await flushPromises()

    expect(onMediaFullyVisible.mock.calls[0]?.[0]).toMatchObject({
      layout: 'reel',
      phoneMode: true,
      postId: 1,
    })
  })

  it('reports masonry visibility only once across viewport re-entry', async () => {
    const onMediaFullyVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const onMediaVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: {
        items: Array.from({ length: 12 }, (_, index) => item(index + 1)),
        next: null,
      },
      onMediaFullyVisible,
      onMediaVisible,
      target,
    }))
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="1"] img')!
      .dispatchEvent(new Event('load'))
    await flushPromises()
    expect(onMediaFullyVisible).toHaveBeenCalledOnce()
    expect(onMediaVisible).toHaveBeenCalledOnce()

    const gallery = target.querySelector<HTMLElement>('.masonry-feed')!
    gallery.scrollTop = 2_000
    gallery.dispatchEvent(new Event('scroll'))
    await flushPromises()
    gallery.scrollTop = 0
    gallery.dispatchEvent(new Event('scroll'))
    await flushPromises()

    expect(onMediaFullyVisible).toHaveBeenCalledOnce()
    expect(onMediaVisible).toHaveBeenCalledOnce()
  })

  it('reports fully-visible masonry media after readiness', async () => {
    const onMediaFullyVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items: [item(1)], next: null },
      onMediaFullyVisible,
      target,
    }))
    await instance.mount()
    await flushPromises()

    expect(onMediaFullyVisible).not.toHaveBeenCalled()
    target.querySelector<HTMLElement>('[data-post-id="1"] img')!
      .dispatchEvent(new Event('load'))
    await flushPromises()

    expect(onMediaFullyVisible).toHaveBeenCalledOnce()
    expect(onMediaFullyVisible.mock.calls[0]?.[0]).toMatchObject({
      layout: 'masonry',
      mediaId: '1:primary',
      mediaIndex: 0,
      postId: 1,
    })
  })

  it('deduplicates fully-visible grouped media by media index', async () => {
    const onMediaFullyVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items: [item(1, true)], next: null },
      onMediaFullyVisible,
      target,
    }))
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="1"] img')!
      .dispatchEvent(new Event('load'))
    await flushPromises()
    target.querySelector<HTMLButtonElement>(
      '[aria-label="Next media for post 1"]',
    )!.click()
    await flushPromises()
    target.querySelector<HTMLElement>('[data-post-id="1"] img')!
      .dispatchEvent(new Event('load'))
    await flushPromises()

    expect(onMediaFullyVisible.mock.calls.map(([context]) => context.mediaIndex))
      .toEqual([0, 1])
  })

  it('reports the same media once in masonry and once in reel', async () => {
    const onMediaFullyVisible = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items: [item(1)], next: null },
      onMediaFullyVisible,
      target,
    }))
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="1"] img')!
      .dispatchEvent(new Event('load'))
    await flushPromises()
    target.querySelector<HTMLElement>('[data-post-id="1"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await flushPromises()
    target.querySelector<HTMLElement>(
      '.vibe-reel-overlay [data-post-id="1"] img',
    )!.dispatchEvent(new Event('load'))
    await flushPromises()

    expect(onMediaFullyVisible.mock.calls.map(([context]) => context.layout))
      .toEqual(['masonry', 'reel'])
  })

  it('reports parent, nested, and single-item selections in a base reel', async () => {
    const items = [item(1, true), item(2)]
    const onReelMediaChange = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items, next: null },
      layout: 'reel',
      onReelMediaChange,
      target,
    }))
    await instance.mount()
    await flushPromises()

    expect(instance.nextReelMediaItem()).toBe(true)
    await flushPromises()
    expect(instance.nextReelPost()).toBe(true)
    await flushPromises()

    expect(onReelMediaChange.mock.calls.map(([context]) => ({
      mediaId: context.mediaId,
      mediaIndex: context.mediaIndex,
      origin: context.origin,
      postId: context.postId,
      postIndex: context.postIndex,
    }))).toEqual([
      { mediaId: '1:primary', mediaIndex: 0, origin: 'reel', postId: 1, postIndex: 0 },
      { mediaId: '1:secondary', mediaIndex: 1, origin: 'reel', postId: 1, postIndex: 0 },
      { mediaId: '2:primary', mediaIndex: 0, origin: 'reel', postId: 2, postIndex: 1 },
    ])
    expect(onReelMediaChange.mock.calls.at(-1)?.[0]).toMatchObject({
      item: items[1],
      layout: 'reel',
      media: items[1],
    })
  })

  it('preserves masonry origin for viewer changes and readiness', async () => {
    const onMediaReady = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const onReelMediaChange = vi.fn<(context: VibeMediaLifecycleContext) => void>()
    const instance = track(createVibe({
      initialPage: { items: [item(1, true), item(2)], next: null },
      onMediaReady,
      onReelMediaChange,
      target,
    }))
    await instance.mount()
    await flushPromises()

    target.querySelector<HTMLElement>('[data-post-id="1"]')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()
    expect(instance.nextReelMediaItem()).toBe(true)
    await flushPromises()
    target.querySelector<HTMLElement>(
      '.vibe-reel-overlay [data-post-id="1"] img',
    )!.dispatchEvent(new Event('load'))

    expect(onReelMediaChange.mock.calls.map(([context]) => [
      context.mediaId,
      context.origin,
    ])).toEqual([
      ['1:primary', 'masonry'],
      ['1:secondary', 'masonry'],
    ])
    expect(onMediaReady.mock.calls.at(-1)?.[0]).toMatchObject({
      layout: 'reel',
      mediaId: '1:secondary',
      mediaIndex: 1,
      origin: 'masonry',
      postId: 1,
    })
  })
})
