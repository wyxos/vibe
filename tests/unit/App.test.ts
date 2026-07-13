import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'

const fakeServer = vi.hoisted(() => ({
  getFakeMediaPage: vi.fn(),
}))

vi.mock('@/demo/fakeServer', () => fakeServer)

describe('App', () => {
  beforeEach(() => {
    fakeServer.getFakeMediaPage.mockReset()
    fakeServer.getFakeMediaPage.mockResolvedValue({
      items: [{
        postId: 10,
        items: [{
          src: 'https://example.com/image.jpeg',
          preview: {
            src: 'https://example.com/image-preview.jpeg',
            width: 450,
            height: 600,
          },
          width: 900,
          height: 1200,
        }, {
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
      meta: { next: 'cursor-2', total: 1000 },
    })
  })

  it('loads and renders the first fake media page on mount', async () => {
    const wrapper = mount(App)

    expect(wrapper.get('[role="status"]').text()).toBe('Loading media…')
    await flushPromises()

    expect(fakeServer.getFakeMediaPage).toHaveBeenCalledWith(null)
    expect(wrapper.findAll('.masonry-item')).toHaveLength(1)
    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/image-preview.jpeg')
    expect(wrapper.get('video').attributes('src')).toBe('https://example.com/video-preview.mp4')
  })

  it('renders a load error', async () => {
    fakeServer.getFakeMediaPage.mockRejectedValueOnce(new Error('Fixture failed'))

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load media.')
  })
})
