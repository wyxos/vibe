import { flushPromises, mount } from '@vue/test-utils'
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
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders a network-free synthetic fixture with auto-scroll controls', async () => {
    const router = createDemoRouter(createMemoryHistory())
    await router.push('/demos/masonry-performance')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('a[href="/demos/masonry-performance"]').text())
      .toBe('Masonry performance')
    expect(wrapper.get('[data-test="auto-scroll-controls"]').exists()).toBe(true)
    expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('80')
    expect(wrapper.findAll('.masonry-item').length).toBeGreaterThan(0)
    const sharedSource = wrapper.get('.media-preview').attributes('src')
    expect(sharedSource).toMatch(/^data:image\/svg\+xml/)
    expect(wrapper.get('[data-test="performance-requested"]').text()).toBe('0.0px')
    expect(wrapper.get('[data-test="performance-travelled"]').text()).toBe('0.0px')

    const uniqueMedia = wrapper.findAll('button')
      .find((button) => button.text() === 'Unique media')
    expect(uniqueMedia).toBeDefined()
    await uniqueMedia!.trigger('click')
    await flushPromises()
    expect(wrapper.get('.media-preview').attributes('src')).not.toBe(sharedSource)

    wrapper.unmount()
  })
})
