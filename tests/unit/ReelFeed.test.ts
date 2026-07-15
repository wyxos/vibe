import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

function props() {
  return {
    hasNext: false,
    infiniteScroll: true,
    isLoadingMore: false,
    items: Array.from({ length: 10 }, (_, index) => feedItem(index + 10)),
    nextPageError: false,
    previewStates: new Map(),
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
