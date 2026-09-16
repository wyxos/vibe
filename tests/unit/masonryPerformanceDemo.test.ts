import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import App from '@/App.vue'
import { createDemoRouter } from '@/router'

describe('masonry performance demo', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1_920)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(900)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      return {
        arc: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: '',
        lineTo: vi.fn(),
        moveTo: vi.fn(),
      } as unknown as CanvasRenderingContext2D
    })
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      callback(new Blob(['jpeg-template'], { type: 'image/jpeg' }))
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders unique JPEG fixtures and can switch to a shared raster', async () => {
    const router = createDemoRouter(createMemoryHistory())
    await router.push('/demos/masonry-performance')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await vi.waitFor(() => {
      expect(wrapper.findAll('.masonry-item').length).toBeGreaterThan(0)
    })

    expect(wrapper.get('a[href="/demos/masonry-performance"]').text())
      .toBe('Masonry performance')
    expect(wrapper.get('[data-test="auto-scroll-controls"]').exists()).toBe(true)
    expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('100')
    expect(wrapper.findAll('.masonry-item').length).toBeGreaterThan(0)
    const uniqueSource = wrapper.get('.media-preview').attributes('src')
    expect(uniqueSource).toMatch(/^(?:blob:|data:image\/jpeg)/)
    expect(wrapper.get('[data-test="performance-remove-visible"]').text())
      .toBe('Remove visible')
    expect(wrapper.get('[data-test="performance-requested"]').text()).toBe('0.0px')
    expect(wrapper.get('[data-test="performance-travelled"]').text()).toBe('0.0px')

    const sharedMedia = wrapper.findAll('button')
      .find((button) => button.text() === 'Shared JPEG')
    expect(sharedMedia).toBeDefined()
    await sharedMedia!.trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.get('.media-preview').attributes('src')).not.toBe(uniqueSource)
    })

    wrapper.unmount()
  })
})
