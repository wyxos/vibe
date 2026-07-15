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

function props(items = [feedItem(1)]) {
  return {
    enteringPostIds: new Set(items.map((item) => item.postId)),
    entryDelays: new Map(items.map((item, index) => [item.postId, index * 35])),
    hasNext: false,
    infiniteScroll: true,
    isLoadingMore: false,
    items,
    nextPageError: false,
    previewStates: new Map(),
  }
}

describe('MasonryFeed', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
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
      .toBe('translate3d(0, 0px, 0)')
  })
})
