import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import MasonryFeed from '@/components/MasonryFeed.vue'

function feedItem(postId: number) {
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

function groupedFeedItem(postId: number) {
  const base = feedItem(postId)

  return {
    ...base,
    items: [
      { ...base, src: `https://example.com/${postId}-a.jpg` },
      { ...base, src: `https://example.com/${postId}-b.jpg` },
    ],
  }
}

function props(items = [feedItem(1)]) {
  return {
    canRetryEnd: false,
    enteringPostIds: new Set(items.map((item) => item.postId)),
    entryDelays: new Map(items.map((item, index) => [item.postId, index * 35])),
    hasNext: false,
    infiniteScroll: true,
    isLoadingMore: false,
    items,
    loadMoreLocked: false,
    mediaIndices: new Map(),
    nextPageError: false,
    previewStates: new Map(),
    total: null,
  }
}

function dispatchPointerEvent(
  element: Element,
  type: string,
  { clientY, pointerId }: { clientY: number, pointerId: number },
) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    clientY: { value: clientY },
    pointerId: { value: pointerId },
  })
  element.dispatchEvent(event)
}

describe('MasonryFeed', () => {
  let galleryClientHeight = 500
  let galleryScrollHeight = 2000

  beforeEach(() => {
    galleryClientHeight = 500
    galleryScrollHeight = 2000
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(() => galleryClientHeight)
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.classList.contains('gallery-shell') ? galleryScrollHeight : 500
      })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('virtualizes a large absolute-positioned layout', async () => {
    const items = Array.from({ length: 5000 }, (_, index) => feedItem(index + 1))
    const wrapper = mount(MasonryFeed, { props: props(items) })
    await wrapper.vm.$nextTick()

    const masonry = wrapper.get('.masonry')
    expect(wrapper.findAll('.masonry-item').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.masonry-item').length).toBeLessThan(100)
    expect(Number.parseFloat((masonry.element as HTMLElement).style.height)).toBeGreaterThan(500)
    expect(wrapper.find('[data-post-id="1"]').exists()).toBe(true)

    const gallery = wrapper.get('.gallery-shell')
    Object.defineProperty(gallery.element, 'scrollTop', {
      configurable: true,
      value: 5000,
    })
    await gallery.trigger('scroll')

    expect(wrapper.find('[data-post-id="1"]').exists()).toBe(false)
    expect(wrapper.findAll('.masonry-item').length).toBeLessThan(100)
  })

  it('supports an opt-in capped overscan without changing the default window', async () => {
    const items = Array.from({ length: 5000 }, (_, index) => feedItem(index + 1))
    const defaultWrapper = mount(MasonryFeed, { props: props(items) })
    const cappedWrapper = mount(MasonryFeed, {
      props: {
        ...props(items),
        masonry: {
          overscan: {
            maximumPx: 100,
            minimumPx: 100,
            viewportMultiplier: 0,
          },
        },
      },
    })
    await defaultWrapper.vm.$nextTick()
    await cappedWrapper.vm.$nextTick()

    const defaultCount = defaultWrapper.findAll('.masonry-item').length
    const cappedCount = cappedWrapper.findAll('.masonry-item').length
    expect(cappedCount).toBeGreaterThan(0)
    expect(cappedCount).toBeLessThan(defaultCount)
    expect(cappedWrapper.find('[data-post-id="1"]').exists()).toBe(true)
  })

  it('renders a fixed overlay thumb from native scroll geometry', async () => {
    const wrapper = mount(MasonryFeed, { props: props([feedItem(1), feedItem(2)]) })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const scrollbar = wrapper.get('.gallery-scrollbar')
    const thumb = wrapper.get('.gallery-scrollbar-thumb')
    const gallery = wrapper.get('.gallery-shell')
    expect(scrollbar.classes()).toContain('gallery-scrollbar--visible')
    expect(thumb.attributes('role')).toBe('scrollbar')
    expect(thumb.attributes('aria-controls')).toBe(gallery.attributes('id'))
    expect((thumb.element as HTMLElement).style.height).toBe('125px')

    gallery.element.scrollTop = 750
    await gallery.trigger('scroll')

    expect((thumb.element as HTMLElement).style.transform)
      .toBe('translate3d(0, 187.5px, 0)')
    expect(scrollbar.classes()).toContain('gallery-scrollbar--interacting')
  })

  it('supports keyboard and pointer thumb scrolling', async () => {
    const wrapper = mount(MasonryFeed, { props: props([feedItem(1), feedItem(2)]) })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    const gallery = wrapper.get('.gallery-shell')
    const thumb = wrapper.get('.gallery-scrollbar-thumb')

    await thumb.trigger('keydown', { key: 'PageDown' })
    expect(gallery.element.scrollTop).toBe(500)

    dispatchPointerEvent(thumb.element, 'pointerdown', { clientY: 100, pointerId: 7 })
    dispatchPointerEvent(thumb.element, 'pointermove', { clientY: 200, pointerId: 7 })
    await wrapper.vm.$nextTick()
    expect(gallery.element.scrollTop).toBe(900)
    expect(wrapper.get('.gallery-scrollbar').classes())
      .toContain('gallery-scrollbar--dragging')

    dispatchPointerEvent(thumb.element, 'pointerup', { clientY: 200, pointerId: 7 })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.gallery-scrollbar').classes())
      .not.toContain('gallery-scrollbar--dragging')
  })

  it('updates thumb size after append and removes it from suspended focus order', async () => {
    const initialItems = [feedItem(1), feedItem(2)]
    const wrapper = mount(MasonryFeed, { props: props(initialItems) })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    const thumb = wrapper.get('.gallery-scrollbar-thumb')
    expect((thumb.element as HTMLElement).style.height).toBe('125px')

    galleryScrollHeight = 4000
    await wrapper.setProps({
      items: Array.from({ length: 12 }, (_, index) => feedItem(index + 1)),
      suspended: true,
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect((thumb.element as HTMLElement).style.height).toBe('62.5px')
    expect(thumb.attributes('tabindex')).toBe('-1')
    expect(wrapper.get('.gallery-scrollbar').attributes('aria-hidden')).toBe('true')
  })

  it('stagger-rises entering items from below the masonry', async () => {
    const items = [feedItem(10), feedItem(11), feedItem(12)]
    const wrapper = mount(MasonryFeed, { props: props(items) })
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.masonry-item')
    expect(cards.map((card) => (
      (card.element as HTMLElement).style.getPropertyValue('--masonry-entry-delay')
    ))).toEqual(['0ms', '35ms', '70ms'])

    const masonryHeight = Number.parseFloat(
      (wrapper.get('.masonry').element as HTMLElement).style.height,
    )
    const firstCard = cards[0]!
    const offset = Number.parseFloat(
      (firstCard.element as HTMLElement).style.transform.match(/, ([\d.]+)px,/)?.[1] ?? '0',
    )
    expect(firstCard.classes()).toContain('media-card--entering')
    expect(offset).toBeGreaterThan(masonryHeight)

    await wrapper.setProps({ enteringPostIds: new Set<number>() })
    expect((firstCard.element as HTMLElement).style.transform)
      .toBe('translate3d(0px, 0px, 0)')
  })

  it('moves retained items while removed items reverse their entry motion', async () => {
    const items = [feedItem(1), feedItem(2), feedItem(3)]
    const wrapper = mount(MasonryFeed, {
      props: {
        ...props(items),
        enteringPostIds: new Set<number>(),
        masonry: {
          overscan: {
            maximumPx: 1_000,
            minimumPx: 600,
            viewportMultiplier: 0.5,
          },
        },
      },
    })
    await wrapper.vm.$nextTick()

    const leavingCard = wrapper.get('[data-post-id="1"]')
    const retainedCard = wrapper.get('[data-post-id="2"]')
    const leavingStart = (leavingCard.element as HTMLElement).style.transform
    const retainedStart = (retainedCard.element as HTMLElement).style.transform
    const masonryHeight = (wrapper.get('.masonry').element as HTMLElement)
      .style.height

    await wrapper.setProps({
      leavingPostIds: new Set([1]),
      removalDelays: new Map([[1, 0]]),
    })

    expect((leavingCard.element as HTMLElement).style.transform)
      .not.toBe(leavingStart)
    expect((retainedCard.element as HTMLElement).style.transform)
      .not.toBe(retainedStart)
    expect((retainedCard.element as HTMLElement).style.transform)
      .toBe('translate3d(0px, 0px, 0)')
    expect((wrapper.get('.masonry').element as HTMLElement).style.height)
      .toBe(masonryHeight)
  })

  it('activates an item by pointer or keyboard', async () => {
    const wrapper = mount(MasonryFeed, { props: props([feedItem(8)]) })
    await wrapper.vm.$nextTick()
    const card = wrapper.get('[data-post-id="8"]')

    expect(card.attributes('role')).toBe('button')
    expect(card.attributes('tabindex')).toBe('0')

    card.element.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      detail: 1,
    }))
    await wrapper.vm.$nextTick()
    await card.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('activate')).toEqual([
      [8, 'pointer'],
      [8, 'keyboard'],
    ])
  })

  it('cycles grouped media in both directions and loops at the edges', async () => {
    const item = groupedFeedItem(8)
    const wrapper = mount(MasonryFeed, { props: props([item]) })
    await wrapper.vm.$nextTick()

    const next = wrapper.get('[aria-label="Next media for post 8"]')
    const previous = wrapper.get('[aria-label="Previous media for post 8"]')
    expect(wrapper.get('.media-carousel-controls').classes())
      .not.toContain('media-carousel-controls--persistent')

    await next.trigger('click')
    expect(wrapper.emitted('mediaChange')?.at(-1)).toEqual([8, 1])

    await wrapper.setProps({ mediaIndices: new Map([[8, 2]]) })
    await next.trigger('click')
    expect(wrapper.emitted('mediaChange')?.at(-1)).toEqual([8, 0])

    await wrapper.setProps({ mediaIndices: new Map([[8, 0]]) })
    await previous.trigger('click')
    expect(wrapper.emitted('mediaChange')?.at(-1)).toEqual([8, 2])
  })

  it('offers a terminal retry when the loader can check for more', async () => {
    const wrapper = mount(MasonryFeed, {
      props: { ...props(), canRetryEnd: true },
    })

    expect(wrapper.get('.end-feed').text()).toContain("You've reached the end.")
    await wrapper.get('[data-test="retry-end"]').trigger('click')
    expect(wrapper.emitted('retryEnd')).toEqual([[]])
  })

  it('hides manual loading when an infinite feed can scroll', async () => {
    const wrapper = mount(MasonryFeed, {
      props: {
        ...props(),
        hasNext: true,
      },
    })
    const gallery = wrapper.get('.gallery-shell')
    gallery.element.scrollTop = 1800

    expect(wrapper.find('[data-test="load-more"]').exists()).toBe(false)
    await gallery.trigger('scroll')
    expect(wrapper.emitted('loadMore')).toEqual([[]])
  })

  it('offers manual loading when an infinite feed is too short to scroll', async () => {
    galleryClientHeight = 1_000
    const wrapper = mount(MasonryFeed, {
      props: {
        ...props(),
        hasNext: true,
      },
    })
    await wrapper.vm.$nextTick()

    const button = wrapper.get('[data-test="load-more"]')
    expect(button.text()).toBe('Load more')
    await button.trigger('click')
    expect(wrapper.emitted('loadMore')).toEqual([[]])

    await wrapper.setProps({
      items: Array.from({ length: 8 }, (_, index) => feedItem(index + 1)),
    })
    expect(wrapper.find('[data-test="load-more"]').exists()).toBe(false)
  })

  it('anchors loading controls over the masonry viewport', () => {
    const wrapper = mount(MasonryFeed, {
      props: {
        ...props(),
        hasNext: true,
        isLoadingMore: true,
      },
    })

    expect(wrapper.get('.masonry-feed-status-overlay').find('.load-more-status').text())
      .toBe('Loading more…')
  })

  it('disables manual and infinite pagination while loading more is locked', async () => {
    const wrapper = mount(MasonryFeed, {
      props: {
        ...props(),
        hasNext: true,
        infiniteScroll: false,
        loadMoreLocked: true,
      },
    })
    const gallery = wrapper.get('.gallery-shell')
    gallery.element.scrollTop = 1800

    await gallery.trigger('scroll')
    expect(wrapper.emitted('loadMore')).toBeUndefined()

    const button = wrapper.get('[data-test="load-more"]')
    expect(button.text()).toBe('Loading paused')
    expect(button.attributes()).toHaveProperty('disabled')
    await button.trigger('click')
    expect(wrapper.emitted('loadMore')).toBeUndefined()

    await wrapper.setProps({ infiniteScroll: false, loadMoreLocked: false })
    await wrapper.get('[data-test="load-more"]').trigger('click')
    expect(wrapper.emitted('loadMore')).toEqual([[]])
  })
})
