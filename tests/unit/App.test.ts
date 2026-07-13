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
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenCalledWith(null)
    expect(wrapper.findAll('.masonry-item')).toHaveLength(1)
    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/image-10-preview.jpeg')
    expect(wrapper.find('video').exists()).toBe(false)
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
