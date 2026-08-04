import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createVibe, type VibeInstance, type VibeItem } from '@/index'

function item(postId: number, grouped = false): VibeItem {
  const media = {
    height: 1200,
    mediaId: `${postId}:primary`,
    preview: { height: 600, src: `/${postId}-preview.jpg`, width: 450 },
    src: `/${postId}.jpg`,
    width: 900,
  }
  return {
    ...media,
    items: grouped ? [{ ...media, mediaId: `${postId}:secondary`, src: `/${postId}-item.jpg` }] : [],
    postId,
  }
}

describe('reel runtime controls', () => {
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

  it('controls media items and posts in a base reel', async () => {
    const instance = track(createVibe({
      target,
      layout: 'reel',
      initialPage: { items: [item(1, true), item(2), item(3)], next: null },
    }))
    expect(instance.nextReelMediaItem()).toBe(false)
    expect(instance.nextReelPost()).toBe(false)
    await instance.mount()
    await flushPromises()

    const reel = target.querySelector<HTMLElement>('.reel-feed')!
    expect(instance.previousReelPost()).toBe(false)
    expect(instance.nextReelMediaItem()).toBe(true)
    await flushPromises()
    expect(reel.dataset.activeMediaIndex).toBe('1')
    expect(instance.previousReelMediaItem()).toBe(true)
    await flushPromises()
    expect(reel.dataset.activeMediaIndex).toBe('0')

    expect(instance.nextReelPost()).toBe(true)
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(2)
    expect(reel.dataset.activePostId).toBe('2')
    expect(instance.nextReelMediaItem()).toBe(false)
    expect(instance.previousReelPost()).toBe(true)
    expect(instance.nextReelPost()).toBe(true)
    expect(instance.nextReelPost()).toBe(true)
    expect(instance.nextReelPost()).toBe(false)
    await flushPromises()
    expect(reel.dataset.activePostId).toBe('3')
  })

  it('navigates to an exact loaded post and stable media identity', async () => {
    const instance = track(createVibe({
      target,
      layout: 'reel',
      initialPage: { items: [item(1, true), item(2), item(3, true)], next: null },
    }))

    expect(instance.navigateToReelItem({ mediaId: '3:secondary', postId: 3 }))
      .toBe('reel-inactive')
    await instance.mount()
    await flushPromises()

    expect(instance.navigateToReelItem({ mediaId: 'missing', postId: 3 }))
      .toBe('not-found')
    expect(instance.navigateToReelItem({ mediaId: '3:secondary', postId: 99 }))
      .toBe('not-found')
    expect(instance.navigateToReelItem({ mediaId: '3:secondary', postId: 3 }))
      .toBe('navigated')
    await flushPromises()

    const reel = target.querySelector<HTMLElement>('.reel-feed')!
    expect(instance.getState().activeReelPostId).toBe(3)
    expect(reel.dataset.activePostId).toBe('3')
    expect(reel.dataset.activeMediaIndex).toBe('1')
    expect(instance.navigateToReelItem({ mediaId: '3:secondary', postId: 3 }))
      .toBe('navigated')
  })

  it('controls a masonry-origin reel and no-ops in the masonry feed', async () => {
    const instance = track(createVibe({
      target,
      initialPage: { items: [item(1, true), item(2)], next: null },
    }))
    await instance.mount()
    await flushPromises()
    expect(instance.nextReelMediaItem()).toBe(false)
    expect(instance.nextReelPost()).toBe(false)

    target.querySelector<HTMLElement>('[data-post-id="1"]')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    )
    await flushPromises()
    expect(instance.nextReelMediaItem()).toBe(true)
    expect(instance.nextReelPost()).toBe(true)
    await flushPromises()

    const reel = target.querySelector<HTMLElement>('.vibe-reel-overlay .reel-feed')!
    expect(reel.dataset.activeMediaIndex).toBe('0')
    expect(reel.dataset.activePostId).toBe('2')
    expect(instance.getState().activeReelPostId).toBe(2)
  })
})
