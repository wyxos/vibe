import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'

import ReelFeed from '@/components/ReelFeed.vue'

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

function mediaAsset(name: string) {
  return {
    src: `https://example.com/${name}.jpg`,
    preview: {
      src: `https://example.com/${name}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
  }
}

function props() {
  return {
    hasNext: false,
    infiniteScroll: true,
    isLoadingMore: false,
    items: Array.from({ length: 10 }, (_, index) => feedItem(index + 10)),
    mediaIndices: new Map(),
    nextPageError: false,
    previewStates: new Map(),
    total: null,
  }
}

describe('ReelFeed', () => {
  let viewportHeight = 500
  const resizeCallbacks: ResizeObserverCallback[] = []

  beforeEach(() => {
    viewportHeight = 500
    resizeCallbacks.length = 0
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(() => viewportHeight)
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback)
      }

      disconnect(): void {}
      observe(): void {}
      unobserve(): void {}
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses viewport rows and virtualizes around the active item', async () => {
    const wrapper = mount(ReelFeed, { props: props() })
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.reel-track').attributes('style'))
      .toContain('grid-template-rows: repeat(10, 100cqh)')
    expect(wrapper.findAll('.reel-item')).toHaveLength(3)
    expect(wrapper.get('.gallery-shell').attributes('data-active-post-id')).toBe('10')

    const gallery = wrapper.get('.gallery-shell')
    Object.defineProperty(gallery.element, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 2500,
    })
    await gallery.trigger('scroll')

    expect(gallery.attributes('data-active-post-id')).toBe('15')
    expect(wrapper.findAll('.reel-item')).toHaveLength(5)
    expect(wrapper.find('[data-post-id="10"]').exists()).toBe(false)
    expect(wrapper.get('[data-post-id="15"]').attributes('style')).toContain('grid-row: 6')
  })

  it('starts on a requested post', async () => {
    const wrapper = mount(ReelFeed, {
      props: { ...props(), initialPostId: 15 },
    })
    await wrapper.vm.$nextTick()

    const gallery = wrapper.get('.gallery-shell')
    expect(gallery.attributes('data-active-post-id')).toBe('15')
    expect((gallery.element as HTMLElement).scrollTop).toBe(2500)
    expect(wrapper.get('[data-post-id="15"]').attributes('style')).toContain('grid-row: 6')
  })

  it('uses previews by default and originals when requested', async () => {
    const previewWrapper = mount(ReelFeed, { props: props() })
    const originalWrapper = mount(ReelFeed, {
      props: { ...props(), mediaSource: 'original' },
    })
    await Promise.all([
      previewWrapper.vm.$nextTick(),
      originalWrapper.vm.$nextTick(),
    ])

    expect(previewWrapper.get('[data-post-id="10"] img').attributes('src'))
      .toBe('https://example.com/10-preview.jpg')
    expect(originalWrapper.get('[data-post-id="10"] img').attributes('src'))
      .toBe('https://example.com/10.jpg')
  })

  it('keeps one header and footer stationary while active context changes', async () => {
    const Region = markRaw(defineComponent({
      props: ['index', 'item', 'mediaIndex'],
      setup(regionProps) {
        return () => h(
          'span',
          `${regionProps.index}:${regionProps.item.postId}:${regionProps.mediaIndex}`,
        )
      },
    }))
    const groupedSecondItem = {
      ...feedItem(11),
      items: [mediaAsset('11-a'), mediaAsset('11-b')],
    }
    const wrapper = mount(ReelFeed, {
      props: {
        ...props(),
        cardFooter: { component: Region, height: 48 },
        cardHeader: { component: Region, height: 40 },
        items: [feedItem(10), groupedSecondItem],
      },
    })
    await wrapper.vm.$nextTick()

    const header = wrapper.get('.media-card-header')
    const footer = wrapper.get('.media-card-footer')
    const headerElement = header.element
    const footerElement = footer.element
    const gallery = wrapper.get('.reel-feed')
    expect(wrapper.findAll('.media-card-header')).toHaveLength(1)
    expect(wrapper.findAll('.media-card-footer')).toHaveLength(1)
    expect(gallery.find('.media-card-header').exists()).toBe(false)
    expect(gallery.find('.media-card-footer').exists()).toBe(false)
    expect(header.text()).toBe('0:10:0')

    Object.defineProperty(gallery.element, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 500,
    })
    await gallery.trigger('scroll')

    expect(wrapper.get('.media-card-header').element).toBe(headerElement)
    expect(wrapper.get('.media-card-footer').element).toBe(footerElement)
    expect(wrapper.get('.media-card-header').text()).toBe('1:11:0')

    await wrapper.setProps({ mediaIndices: new Map([[11, 2]]) })
    expect(wrapper.get('.media-card-header').text()).toBe('1:11:2')
  })

  it('keeps grouped media horizontal while vertical scrolling advances posts', async () => {
    const groupedItem = {
      ...feedItem(10),
      items: [mediaAsset('10-a'), mediaAsset('10-b')],
    }
    const wrapper = mount(ReelFeed, {
      props: {
        ...props(),
        items: [groupedItem, feedItem(11)],
        mediaIndices: new Map([[10, 1]]),
      },
    })
    await wrapper.vm.$nextTick()

    const gallery = wrapper.get('.gallery-shell')
    expect(wrapper.get('.reel-track').attributes('style'))
      .toContain('grid-template-rows: repeat(2, 100cqh)')
    expect(gallery.attributes('data-active-post-id')).toBe('10')
    expect(gallery.attributes('data-active-media-index')).toBe('1')
    expect(wrapper.get('[data-post-id="10"] img').attributes('src'))
      .toBe('https://example.com/10-a-preview.jpg')

    Object.defineProperty(gallery.element, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 500,
    })
    await gallery.trigger('scroll')
    expect(gallery.attributes('data-active-post-id')).toBe('11')
    expect(gallery.attributes('data-active-media-index')).toBe('0')
  })

  it('keeps the active post anchored through transient rotation sizes', async () => {
    const wrapper = mount(ReelFeed, { props: props() })
    await wrapper.vm.$nextTick()
    const gallery = wrapper.get('.gallery-shell')
    Object.defineProperty(gallery.element, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 1000,
    })
    await gallery.trigger('scroll')

    expect(gallery.attributes('data-active-post-id')).toBe('12')

    window.dispatchEvent(new Event('resize'))
    expect(gallery.attributes()).toHaveProperty('data-resizing')
    viewportHeight = 700
    resizeCallbacks[0]?.([], {} as ResizeObserver)
    await gallery.trigger('scroll')

    expect((gallery.element as HTMLElement).scrollTop).toBe(1400)
    expect(gallery.attributes('data-active-post-id')).toBe('12')

    viewportHeight = 300
    resizeCallbacks[0]?.([], {} as ResizeObserver)
    await gallery.trigger('scroll')

    expect((gallery.element as HTMLElement).scrollTop).toBe(600)
    expect(gallery.attributes('data-active-post-id')).toBe('12')
    expect(wrapper.get('[data-post-id="12"]').attributes('style')).toContain('grid-row: 3')
  })
})
