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
    expect(wrapper.get('.media-preview').attributes('src'))
      .toMatch(/^data:image\/svg\+xml/)

    wrapper.unmount()
  })
})
