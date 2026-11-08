import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createVibe, type VibeInstance, type VibeItem } from '@/index'
import ReelPreviews from '@/components/ReelPreviews.vue'

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
    let frameTime = performance.now()
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(frameTime += 1000 / 60)
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

  it('keeps previews and a load action at the end when automatic loading is off', async () => {
    const loadPage = vi.fn(async () => ({ items: [item(3)], next: null }))
    const instance = track(createVibe({
      target, layout: 'reel', infiniteScroll: false, reelPreviews: true,
      initialPage: { items: [item(1), item(2)], next: 1 }, loadPage,
    }))
    const rail = () => target.querySelector('.reel-previews')!
    const previewIds = () => [...rail().querySelectorAll('[data-preview-post-id]')]
      .map((element) => element.getAttribute('data-preview-post-id'))
    await instance.mount()
    await flushPromises()
    expect(previewIds()).toEqual(['2'])
    expect(instance.nextReelPost()).toBe(true)
    await flushPromises()
    expect(previewIds()).toEqual([])
    expect(rail().classList.contains('reel-previews--empty')).toBe(false)
    expect(rail().textContent).toContain('Load more')
    rail().querySelector<HTMLButtonElement>('[aria-label="Previous previews"]')!.click()
    await flushPromises()
    expect(previewIds()).toEqual(['1', '2'])
    expect(instance.getState().activeReelPostId).toBe(2)
    rail().querySelector<HTMLButtonElement>('[aria-label="Next previews"]')!.click()
    await flushPromises()
    expect(loadPage).not.toHaveBeenCalled()
    ;[...rail().querySelectorAll('button')].find(button => button.textContent === 'Load more')!.click()
    await flushPromises()
    expect(loadPage).toHaveBeenCalledTimes(1)
    expect(previewIds()).toEqual(['3'])
    expect(rail().textContent).toContain('End of feed')
    expect(instance.getState().activeReelPostId).toBe(2)
    instance.setReelPreviews(false)
    await flushPromises()
    expect(rail()).toBeNull()
  })

  it('advances upcoming previews after clicking a later preview', async () => {
    const instance = track(createVibe({
      target, layout: 'reel', infiniteScroll: false, reelPreviews: true,
      initialPage: { items: Array.from({ length: 10 }, (_, index) => item(index + 1)), next: null },
    }))
    await instance.mount()
    await flushPromises()
    target.querySelector<HTMLButtonElement>('[aria-label="Open upcoming item 4"]')!.click()
    await flushPromises()
    expect(instance.getState().activeReelPostId).toBe(5)
    expect([...target.querySelectorAll('[data-preview-post-id]')].map(node => node.getAttribute('data-preview-post-id')))
      .toEqual(['6', '7', '8', '9'])
    expect(target.querySelector('.reel-preview-card[aria-current]')).toBeNull()
  })

  it('shows loading, retry and locked states on the last browsed preview page', async () => {
    const instance = track(createVibe({ target, initialPage: { items: [], next: null } }))
    const state = { ...instance.getState(), next: 1, infiniteScroll: false }
    const wrapper = mount(ReelPreviews, { props: {
      items: Array.from({ length: 6 }, (_, index) => item(index + 1)), activeIndex: 0, state,
    } })
    try {
      expect(wrapper.find('.reel-preview-boundary').exists()).toBe(false)
      await wrapper.get('[aria-label="Next previews"]').trigger('click')
      expect(wrapper.get('.reel-preview-boundary').text()).toBe('Load more')
      await wrapper.setProps({ state: { ...state, isLoadingMore: true, loadMoreLocked: true } })
      expect(wrapper.get('[role="status"]').text()).toBe('Loading previews…')
      expect(wrapper.find('.reel-preview-spinner').exists()).toBe(true)
      expect(wrapper.find('.reel-preview-boundary button').exists()).toBe(false)
      await wrapper.setProps({ state: { ...state, nextPageError: true } })
      await wrapper.get('.reel-preview-boundary button').trigger('click')
      expect(wrapper.emitted('loadMore')).toHaveLength(1)
      expect(wrapper.get('.reel-preview-boundary button').text()).toBe('Retry')
      await wrapper.setProps({ state: { ...state, loadMoreLocked: true } })
      expect(wrapper.find('.reel-preview-boundary').exists()).toBe(false)
    } finally { wrapper.unmount() }
  })

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
