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

function timedMediaItem(postId: number, extension: 'mp3' | 'mp4') {
  return {
    ...feedItem(postId),
    src: `https://example.com/${postId}.${extension}`,
    preview: {
      ...feedItem(postId).preview,
      src: `https://example.com/${postId}-preview.${extension}`,
    },
  }
}

function props() {
  return {
    canRetryEnd: false,
    hasNext: false,
    infiniteScroll: true,
    isLoadingMore: false,
    items: Array.from({ length: 10 }, (_, index) => feedItem(index + 10)),
    loadMoreLocked: false,
    mediaIndices: new Map(),
    nextPageError: false,
    previewStates: new Map(),
    reelAutoAdvance: {
      enabled: false,
      includePostItems: false,
      intervalMs: 5_000,
    },
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

  it('preserves gesture scrolling when the active post is echoed by the parent', async () => {
    const items = [feedItem(10), feedItem(11), feedItem(12)]
    const wrapper = mount(ReelFeed, {
      props: { ...props(), items },
    })
    await wrapper.vm.$nextTick()

    const gallery = wrapper.get('.gallery-shell')
    const galleryElement = gallery.element as HTMLElement
    Object.defineProperty(galleryElement, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 300,
    })
    await gallery.trigger('scroll')
    await wrapper.setProps({ initialPostId: 11 })
    await wrapper.vm.$nextTick()

    expect(gallery.attributes('data-active-post-id')).toBe('11')
    expect(gallery.attributes()).not.toHaveProperty('data-resizing')
    expect(galleryElement.scrollTop).toBe(300)

    galleryElement.scrollTop = 200
    await gallery.trigger('scroll')
    await wrapper.setProps({ initialPostId: 10 })
    await wrapper.vm.$nextTick()

    expect(gallery.attributes('data-active-post-id')).toBe('10')
    expect(gallery.attributes()).not.toHaveProperty('data-resizing')
    expect(galleryElement.scrollTop).toBe(200)

    galleryElement.scrollTop = 300
    await gallery.trigger('scroll')
    await wrapper.setProps({ initialPostId: 11 })
    await wrapper.vm.$nextTick()

    await wrapper.setProps({ items: items.slice(1) })
    await wrapper.vm.$nextTick()

    expect(gallery.attributes('data-active-post-id')).toBe('11')
    expect(galleryElement.scrollTop).toBe(0)
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
        cardFooter: {
          background: 'transparent',
          component: Region,
          height: 48,
        },
        cardHeader: {
          background: 'transparent',
          component: Region,
          height: 40,
        },
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
    expect(header.classes()).toContain('media-card-region--transparent')
    expect(footer.classes()).toContain('media-card-region--transparent')
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

  it('offers a terminal retry when the loader can check for more', async () => {
    const wrapper = mount(ReelFeed, {
      props: { ...props(), canRetryEnd: true },
    })

    expect(wrapper.get('.end-feed').text()).toContain("You've reached the end.")
    await wrapper.get('[data-test="retry-end"]').trigger('click')
    expect(wrapper.emitted('retryEnd')).toEqual([[]])
  })

  it('keeps the terminal retry disabled while loading more is locked', async () => {
    const wrapper = mount(ReelFeed, {
      props: {
        ...props(),
        canRetryEnd: true,
        loadMoreLocked: true,
      },
    })
    const retry = wrapper.get('[data-test="retry-end"]')

    expect(retry.attributes()).toHaveProperty('disabled')
    await retry.trigger('click')
    expect(wrapper.emitted('retryEnd')).toBeUndefined()
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

  it('advances vertically after the countdown and excludes post items by default', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const groupedItem = {
      ...feedItem(10),
      items: [mediaAsset('10-a'), mediaAsset('10-b')],
    }
    const wrapper = mount(ReelFeed, {
      props: {
        ...props(),
        items: [groupedItem, feedItem(11)],
        previewStates: new Map([['10:0', 'ready']]),
        reelAutoAdvance: {
          enabled: true,
          includePostItems: false,
          intervalMs: 2_000,
        },
      },
    })
    await wrapper.vm.$nextTick()

    const countdown = wrapper.get('[data-test="reel-auto-advance"]')
    expect(countdown.attributes('aria-label')).toBe('Auto advance to the next post in 2s')
    await countdown.get('.reel-auto-advance-progress').trigger('animationend')

    expect(wrapper.get('.gallery-shell').attributes('data-active-post-id')).toBe('11')
    expect(wrapper.emitted('mediaChange')).toBeUndefined()
  })

  it.each([
    ['audio', 'mp3'],
    ['video', 'mp4'],
  ] as const)('waits for active %s completion instead of the countdown', async (_, extension) => {
    const wrapper = mount(ReelFeed, {
      props: {
        ...props(),
        items: [timedMediaItem(10, extension), feedItem(11)],
        previewStates: new Map([['10:0', 'ready']]),
        reelAutoAdvance: {
          enabled: true,
          includePostItems: false,
          intervalMs: 2_000,
        },
      },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="reel-auto-advance"]').exists()).toBe(false)
    const media = wrapper.get('[data-post-id="10"] video')
    expect(media.attributes('loop')).toBeUndefined()
    await media.trigger('ended')

    expect(wrapper.get('.gallery-shell').attributes('data-active-post-id')).toBe('11')
  })

  it('counts through grouped post items before advancing vertically when included', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const groupedItem = {
      ...feedItem(10),
      items: [mediaAsset('10-a'), mediaAsset('10-b')],
    }
    const wrapper = mount(ReelFeed, {
      props: {
        ...props(),
        items: [groupedItem, feedItem(11)],
        previewStates: new Map([
          ['10:0', 'ready'],
          ['10:1', 'ready'],
          ['10:2', 'ready'],
        ]),
        reelAutoAdvance: {
          enabled: true,
          includePostItems: true,
          intervalMs: 2_000,
        },
      },
    })
    await wrapper.vm.$nextTick()

    await wrapper.get('.reel-auto-advance-progress').trigger('animationend')
    expect(wrapper.emitted('mediaChange')?.at(-1)).toEqual([10, 1])

    await wrapper.setProps({ mediaIndices: new Map([[10, 1]]) })
    await wrapper.get('.reel-auto-advance-progress').trigger('animationend')
    expect(wrapper.emitted('mediaChange')?.at(-1)).toEqual([10, 2])

    await wrapper.setProps({ mediaIndices: new Map([[10, 2]]) })
    await wrapper.get('.reel-auto-advance-progress').trigger('animationend')
    expect(wrapper.get('.gallery-shell').attributes('data-active-post-id')).toBe('11')
  })
})
