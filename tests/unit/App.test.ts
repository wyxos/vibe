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

  it('loads the first page and renders the masonry feed by default', async () => {
    const wrapper = mount(App)

    expect(wrapper.get('[role="status"]').text()).toBe('Loading media…')
    expect(wrapper.get('.app-header').text()).toContain('Vibe')
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenCalledWith(null)
    expect(wrapper.get('[data-layout-mode="masonry"]').exists()).toBe(true)
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

    const wrapper = mount(App)
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

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.get('[data-layout-mode="reel"]').exists()).toBe(true)
    expect(wrapper.find('.masonry').exists()).toBe(false)
  })

  it('keeps a touch tablet in masonry mode', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(820)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(1180)
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(820)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(1180)

    const wrapper = mount(App)
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

    const wrapper = mount(App)
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

    expect(fakeServer.getFakeMediaPage).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-test="load-more"]').text()).toBe('Load more')

    await wrapper.get('[data-test="load-more"]').trigger('click')
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenNthCalledWith(2, 'cursor-2')
  })

  it('renders a load error', async () => {
    fakeServer.getFakeMediaPage.mockRejectedValueOnce(new Error('Fixture failed'))

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load media.')
  })
})
