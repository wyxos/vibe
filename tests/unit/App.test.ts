import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import App from '@/App.vue'
import { createDemoRouter } from '@/router'

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
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
    fakeServer.getFakeMediaPage.mockReset()
    fakeServer.getFakeMediaPage.mockResolvedValue({
      items: [feedItem(10)],
      meta: { next: 'cursor-2', total: 1 },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function mountApp(path = '/') {
    const { wrapper } = await mountAppWithRouter(path)

    return wrapper
  }

  async function mountAppWithRouter(path = '/') {
    const router = createDemoRouter(createMemoryHistory())
    await router.push(path)
    await router.isReady()

    return {
      router,
      wrapper: mount(App, { global: { plugins: [router] } }),
    }
  }

  it('loads the first page and renders the masonry feed by default', async () => {
    const wrapper = await mountApp()

    expect(wrapper.get('[role="status"]').text()).toBe('Loading media…')
    expect(wrapper.get('[data-test="vibe-lifecycle"]').text()).toBe('Masonry·Loading')
    expect(wrapper.get('.app-header').text()).toContain('Vibe')
    expect(wrapper.get('a[href="/demos/card-header-and-footer"]').text()).toBe('Demos')
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenCalledWith(null)
    expect(wrapper.get('[data-layout-mode="masonry"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="vibe-lifecycle"]').text()).toBe('Masonry·Loaded')
    expect(wrapper.findAll('.masonry-item')).toHaveLength(1)
    expect(wrapper.get('img').attributes('src'))
      .toBe('https://example.com/image-10-preview.jpeg')
  })

  it('uses an independent reel feed for phones in portrait', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(430)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(932)
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(430)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(932)
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))

    const wrapper = await mountApp()
    await flushPromises()

    expect(wrapper.get('[data-layout-mode="reel"]').exists()).toBe(true)
    expect(wrapper.get('.reel-track').exists()).toBe(true)
    expect(wrapper.find('.masonry').exists()).toBe(false)
  })

  it('keeps a phone in reel mode in landscape', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(932)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(430)
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(932)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(430)
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))

    const wrapper = await mountApp()
    await flushPromises()

    expect(wrapper.get('[data-layout-mode="reel"]').exists()).toBe(true)
    expect(wrapper.find('.masonry').exists()).toBe(false)
  })

  it('keeps a touch tablet in masonry mode', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(820)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(1180)
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(820)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(1180)

    const wrapper = await mountApp()
    await flushPromises()

    expect(wrapper.get('[data-layout-mode="masonry"]').exists()).toBe(true)
    expect(wrapper.find('.reel-track').exists()).toBe(false)
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

    const wrapper = await mountApp()
    await flushPromises()
    await wrapper.get('img').trigger('error')

    const error = wrapper.get('[data-test="media-error"]')
    expect(error.text()).toContain('404')
    expect(error.text()).toContain('Preview not found')
  })

  it('loads the next page at the active feed bottom', async () => {
    fakeServer.getFakeMediaPage
      .mockResolvedValueOnce({
        items: [feedItem(10)],
        meta: { next: 'cursor-2', total: 2 },
      })
      .mockResolvedValueOnce({
        items: [feedItem(11)],
        meta: { next: null, total: 2 },
      })

    const wrapper = await mountApp()
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

    const wrapper = await mountApp()
    await flushPromises()
    await wrapper.get('[data-test="infinite-scroll-toggle"]').setValue(false)

    expect(fakeServer.getFakeMediaPage).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-test="load-more"]').text()).toBe('Load more')

    await wrapper.get('[data-test="load-more"]').trigger('click')
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenNthCalledWith(2, 'cursor-2')
  })

  it('renders a load error', async () => {
    fakeServer.getFakeMediaPage.mockRejectedValueOnce(new Error('Fixture failed'))

    const wrapper = await mountApp()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load media.')
    expect(wrapper.get('[data-test="vibe-lifecycle"]').text()).toBe('Masonry·Error')
  })

  it('renders the card header and footer variation on the demos route', async () => {
    const groupedItem = feedItem(10)
    groupedItem.items = [{
      src: 'https://example.com/image-10-a.jpeg',
      preview: {
        src: 'https://example.com/image-10-a-preview.jpeg',
        width: 400,
        height: 600,
      },
      width: 800,
      height: 1200,
    }]
    fakeServer.getFakeMediaPage.mockResolvedValueOnce({
      items: [groupedItem],
      meta: { next: null, total: 8 },
    })
    const { router, wrapper } = await mountAppWithRouter('/demos')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/demos/card-header-and-footer')
    expect(wrapper.get('.demos-aside a[href="/demos/card-header-and-footer"]')
      .text()).toBe('Card header & footer')
    expect(wrapper.get('.demos-aside a[href="/demos/reel-url"]')
      .text()).toBe('Reel URL')
    expect(wrapper.find('.demo-stage-header').exists()).toBe(false)
    expect(wrapper.findAll('.demo-card-metadata').map((metadata) => metadata.text()))
      .toEqual(['1 / 2', '1 / 1'])

    await wrapper.get('[aria-label="Next media for post 10"]').trigger('click')
    expect(wrapper.findAll('.demo-card-metadata').map((metadata) => metadata.text()))
      .toEqual(['2 / 2', '1 / 1'])

    const infoAction = wrapper.get('[aria-label="Show information for post 10"]')
    await infoAction.trigger('click')
    expect(wrapper.findAll('.demo-card-metadata').map((metadata) => metadata.text()))
      .toEqual(['2 / 2', '800 × 1200', '1 / 1'])
    expect(wrapper.find('.vibe-reel-overlay').exists()).toBe(false)

    const loveAction = wrapper.get('[aria-label="Love"]')
    await loveAction.trigger('click')
    expect(loveAction.attributes('aria-pressed')).toBe('true')
  })

  it('updates and restores the URL for a masonry-origin reel', async () => {
    const { router, wrapper } = await mountAppWithRouter('/demos/reel-url')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/demos/reel-url')
    await wrapper.get('[data-post-id="10"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/demos/reel-url/file/10')
    expect(wrapper.find('.vibe-reel-overlay').exists()).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/demos/reel-url')
    expect(wrapper.find('.vibe-reel-overlay').exists()).toBe(false)
    expect(wrapper.find('.masonry-feed').exists()).toBe(true)
  })

  it('reflects the first active item in the URL for a phone reel', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(430)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(932)
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(430)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(932)
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))

    const { router, wrapper } = await mountAppWithRouter('/demos/reel-url')
    await flushPromises()

    expect(wrapper.find('[data-layout-mode="reel"]').exists()).toBe(true)
    expect(router.currentRoute.value.fullPath).toBe('/demos/reel-url/file/10')
  })
})
