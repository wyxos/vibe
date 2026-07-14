import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'

const fakeServer = vi.hoisted(() => ({
  getFakeMediaPage: vi.fn(),
}))

vi.mock('@/demo/fakeServer', () => fakeServer)

function feedItem(postId: number) {
  return {
    postId,
    src: `https://example.com/image-${postId}.jpeg`,
    preview: {
      src: `https://example.com/image-${postId}-preview.jpeg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
    items: [],
  }
}

describe('App', () => {
  const animationFrames: FrameRequestCallback[] = []

  beforeEach(() => {
    animationFrames.length = 0
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      animationFrames.push(callback)
      return animationFrames.length
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
    fakeServer.getFakeMediaPage.mockReset()
    fakeServer.getFakeMediaPage.mockResolvedValue({
      items: [{
        ...feedItem(10),
        items: [{
          src: 'https://example.com/video.mp4',
          preview: {
            src: 'https://example.com/video-preview.mp4',
            width: 450,
            height: 600,
          },
          width: 900,
          height: 1200,
        }],
      }],
      meta: { next: 'cursor-2', total: 1 },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('loads and renders the first fake media page on mount', async () => {
    const wrapper = mount(App)

    expect(wrapper.get('[role="status"]').text()).toBe('Loading media…')
    expect(wrapper.get('.app-shell > .app-header').text()).toContain('Vibe')
    expect((wrapper.get('[data-test="infinite-scroll-toggle"]').element as HTMLInputElement).checked)
      .toBe(true)
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenCalledWith(null)
    expect(wrapper.findAll('.masonry-item')).toHaveLength(1)
    const image = wrapper.get('img')
    expect(image.attributes('src')).toBe('https://example.com/image-10-preview.jpeg')
    expect(image.attributes('loading')).toBe('eager')
    expect(image.attributes('fetchpriority')).toBe('high')
    expect(wrapper.get('[data-test="media-loading"]').exists()).toBe(true)

    await image.trigger('load')

    expect(wrapper.find('[data-test="media-loading"]').exists()).toBe(false)
    expect(image.classes()).toContain('media-preview--ready')
    expect(wrapper.find('video').exists()).toBe(false)
  })

  it('enables native vertical swipe snapping only for a one-column layout', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(230)

    const wrapper = mount(App)
    await flushPromises()

    const gallery = wrapper.get('.gallery-shell')

    expect(gallery.classes()).toContain('gallery-shell--swipe')
    expect(gallery.attributes('data-layout-mode')).toBe('swipe')
    expect(wrapper.get('.masonry-item').attributes('style')).toContain('width: 230px')
    expect(wrapper.get('.masonry-item').attributes('style')).toContain('height: 500px')
    expect((wrapper.get('.masonry-item').element as HTMLElement).style.transform)
      .toBe('translate3d(0, 0px, 0)')
    expect((wrapper.get('.masonry-item-content').element as HTMLElement).style.transform)
      .toBe('translate3d(0, 500px, 0)')
  })

  it('keeps the regular masonry scroll behavior when multiple columns fit', async () => {
    const wrapper = mount(App)
    await flushPromises()

    const gallery = wrapper.get('.gallery-shell')

    expect(gallery.classes()).not.toContain('gallery-shell--swipe')
    expect(gallery.attributes('data-layout-mode')).toBe('masonry')
  })

  it('forces reel mode on an iPhone 14 Pro Max in landscape', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(932)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(430)
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(932)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(430)
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))

    const wrapper = mount(App)
    await flushPromises()

    const gallery = wrapper.get('.gallery-shell')

    expect(gallery.attributes('data-layout-mode')).toBe('swipe')
    expect(wrapper.get('.masonry-item').attributes('style')).toContain('width: 932px')
    expect(wrapper.get('.masonry-item').attributes('style')).toContain('height: 430px')
  })

  it('forces reel mode when phone emulation retains desktop screen dimensions', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(932)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(430)
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(1920)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(1080)
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query !== '(hover: hover)',
    })))

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.get('.gallery-shell').attributes('data-layout-mode')).toBe('swipe')
  })

  it('preserves the active reel item without adjacent slides peeking during resize', async () => {
    let viewportWidth = 430
    let viewportHeight = 932
    const resizeObservers: Array<{
      callback: ResizeObserverCallback
      element?: Element
    }> = []

    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockImplementation(() => viewportWidth)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(() => viewportHeight)
    vi.spyOn(window.screen, 'width', 'get').mockImplementation(() => viewportWidth)
    vi.spyOn(window.screen, 'height', 'get').mockImplementation(() => viewportHeight)
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    vi.stubGlobal('ResizeObserver', class {
      private readonly record: (typeof resizeObservers)[number]

      constructor(callback: ResizeObserverCallback) {
        this.record = { callback }
        resizeObservers.push(this.record)
      }

      disconnect(): void {}

      observe(element: Element): void {
        this.record.element = element
      }

      unobserve(): void {}
    })
    fakeServer.getFakeMediaPage.mockResolvedValueOnce({
      items: [feedItem(10), feedItem(11), feedItem(12)],
      meta: { next: null, total: 3 },
    })

    const wrapper = mount(App)
    await flushPromises()

    const gallery = wrapper.get('.gallery-shell').element as HTMLElement
    const masonry = wrapper.get('.masonry').element as HTMLElement
    vi.spyOn(gallery, 'getBoundingClientRect').mockReturnValue({ top: 0 } as DOMRect)
    vi.spyOn(masonry, 'getBoundingClientRect').mockImplementation(() => ({
      top: -gallery.scrollTop,
    }) as DOMRect)
    const anchoredItem = wrapper.get('[data-post-id="12"]').element as HTMLElement
    const previousItem = wrapper.get('[data-post-id="11"]').element as HTMLElement
    const portraitTop = Number.parseFloat(anchoredItem.style.top)
    expect(portraitTop - Number.parseFloat(previousItem.style.top)).toBe(viewportHeight)
    Object.defineProperty(gallery, 'scrollTop', {
      configurable: true,
      writable: true,
      value: portraitTop,
    })
    gallery.dispatchEvent(new Event('scroll'))

    viewportWidth = 932
    viewportHeight = 932
    const galleryObserver = resizeObservers.find(({ element }) =>
      element?.classList.contains('gallery-shell'))
    const masonryObserver = resizeObservers.find(({ element }) =>
      element?.classList.contains('masonry'))
    galleryObserver?.callback([], {} as ResizeObserver)
    masonryObserver?.callback([
      { contentRect: { width: viewportWidth } } as ResizeObserverEntry,
    ], {} as ResizeObserver)
    animationFrames.at(-1)?.(0)
    await flushPromises()

    expect(wrapper.get('.gallery-shell').attributes('data-layout-mode')).toBe('swipe')
    expect(wrapper.get('.gallery-shell').attributes('data-layout-transition')).toBe('resizing')

    viewportHeight = 430
    galleryObserver?.callback([], {} as ResizeObserver)
    await flushPromises()

    const restoredItem = wrapper.get('[data-post-id="12"]').element as HTMLElement

    expect(gallery.scrollTop).toBe(Number.parseFloat(restoredItem.style.top))
    expect(gallery.scrollTop).toBeLessThan(portraitTop)

    await new Promise((resolve) => setTimeout(resolve, 200))
    await flushPromises()
    animationFrames.at(-1)?.(0)
    animationFrames.at(-1)?.(16)
    await wrapper.vm.$nextTick()
    animationFrames.at(-1)?.(32)

    expect(gallery.scrollTop).toBe(Number.parseFloat(restoredItem.style.top))
    expect(wrapper.get('.gallery-shell').attributes('data-layout-transition')).toBe('settled')
  })

  it('keeps a touch tablet in masonry mode', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(820)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(1180)
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(820)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(1180)

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.get('.gallery-shell').attributes('data-layout-mode')).toBe('masonry')
  })

  it('replaces a failed preview with its HTTP error state', async () => {
    fakeServer.getFakeMediaPage.mockResolvedValueOnce({
      items: [{
        ...feedItem(404),
        preview: {
          src: '/demo-errors/404/page-01-1.jpg',
          width: 450,
          height: 600,
        },
      }],
      meta: { next: null, total: 1 },
    })

    const wrapper = mount(App)
    await flushPromises()

    await wrapper.get('img').trigger('error')

    const error = wrapper.get('[data-test="media-error"]')
    expect(error.text()).toContain('404')
    expect(error.text()).toContain('Preview not found')
    expect(error.attributes('aria-label')).toBe('404 Preview not found')
  })

  it('loads the next page when infinite scrolling reaches the gallery bottom', async () => {
    fakeServer.getFakeMediaPage
      .mockResolvedValueOnce({
        items: [feedItem(10)],
        meta: { next: 'cursor-2', total: 2 },
      })
      .mockResolvedValueOnce({
        items: [feedItem(11)],
        meta: { next: null, total: 2 },
      })

    const wrapper = mount(App)
    await flushPromises()

    const gallery = wrapper.get('.gallery-shell')
    Object.defineProperties(gallery.element, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 480 },
    })

    await gallery.trigger('scroll')
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenNthCalledWith(2, 'cursor-2')
    expect(wrapper.findAll('.masonry-item')).toHaveLength(2)
  })

  it('uses a load-more CTA when infinite scrolling is off', async () => {
    fakeServer.getFakeMediaPage
      .mockResolvedValueOnce({
        items: [feedItem(10)],
        meta: { next: 'cursor-2', total: 2 },
      })
      .mockResolvedValueOnce({
        items: [feedItem(11)],
        meta: { next: null, total: 2 },
      })

    const wrapper = mount(App)
    await flushPromises()

    await wrapper.get('[data-test="infinite-scroll-toggle"]').setValue(false)

    const gallery = wrapper.get('.gallery-shell')
    Object.defineProperties(gallery.element, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 480 },
    })
    await gallery.trigger('scroll')
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-test="load-more"]').text()).toBe('Load more')

    await wrapper.get('[data-test="load-more"]').trigger('click')
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenNthCalledWith(2, 'cursor-2')
    expect(wrapper.findAll('.masonry-item')).toHaveLength(2)
  })

  it('renders only the masonry items near the virtual viewport', async () => {
    fakeServer.getFakeMediaPage.mockResolvedValueOnce({
      items: Array.from({ length: 5000 }, (_, index) => feedItem(index + 1)),
      meta: { next: null, total: 5000 },
    })

    const wrapper = mount(App)
    await flushPromises()

    const masonry = wrapper.get('.masonry')
    const initialItems = wrapper.findAll('.masonry-item')

    expect(initialItems.length).toBeGreaterThan(0)
    expect(initialItems.length).toBeLessThan(100)
    expect(Number.parseFloat((masonry.element as HTMLElement).style.height)).toBeGreaterThan(500)
    expect(wrapper.find('[data-post-id="1"]').exists()).toBe(true)
    expect(wrapper.findAll('img').map((image) => image.attributes('fetchpriority')))
      .toEqual(expect.arrayContaining(['high', 'low']))

    const gallery = wrapper.get('.gallery-shell')
    const fullLayoutHeight = (masonry.element as HTMLElement).style.height
    Object.defineProperty(gallery.element, 'scrollTop', {
      configurable: true,
      value: 5000,
    })
    await gallery.trigger('scroll')

    expect(wrapper.find('[data-post-id="1"]').exists()).toBe(false)
    expect(wrapper.findAll('.masonry-item').length).toBeLessThan(100)
    expect((masonry.element as HTMLElement).style.height).toBe(fullLayoutHeight)
  })

  it('staggers newly added items in feed order', async () => {
    fakeServer.getFakeMediaPage.mockResolvedValueOnce({
      items: [feedItem(10), feedItem(11), feedItem(12)],
      meta: { next: 'cursor-2', total: 3 },
    })

    const wrapper = mount(App)
    await flushPromises()

    const delays = wrapper.findAll('.masonry-item').map((item) => (
      (item.element as HTMLElement).style.getPropertyValue('--masonry-entry-delay')
    ))

    expect(delays).toEqual(['0ms', '35ms', '70ms'])
  })

  it('moves an added item upward from below the container', async () => {
    const wrapper = mount(App)
    await flushPromises()

    const item = wrapper.get('.masonry-item')
    const containerHeight = Number.parseFloat(
      (wrapper.get('.masonry').element as HTMLElement).style.height,
    )
    const enteringStyle = (item.element as HTMLElement).style

    expect(item.classes()).toContain('masonry-item--entering')
    expect(Number.parseFloat(enteringStyle.left)).toBe(0)
    expect(Number.parseFloat(enteringStyle.top)).toBe(0)
    expect(Number.parseFloat(enteringStyle.transform.match(/, ([\d.]+)px,/)?.[1] ?? '0'))
      .toBeGreaterThan(containerHeight)

    animationFrames.shift()?.(0)
    animationFrames.shift()?.(16)
    await wrapper.vm.$nextTick()

    expect(item.classes()).not.toContain('masonry-item--entering')
    expect((item.element as HTMLElement).style.transform).toBe('translate3d(0, 0px, 0)')
  })

  it('skips spatial enter motion when reduced motion is requested', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))

    const wrapper = mount(App)
    await flushPromises()

    const item = wrapper.get('.masonry-item')

    expect(item.classes()).not.toContain('masonry-item--entering')
    expect((item.element as HTMLElement).style.transform).toBe('translate3d(0, 0px, 0)')
  })

  it('renders a load error', async () => {
    fakeServer.getFakeMediaPage.mockRejectedValueOnce(new Error('Fixture failed'))

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load media.')
  })
})
