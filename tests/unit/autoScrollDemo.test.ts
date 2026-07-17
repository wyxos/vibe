import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import App from '@/App.vue'
import { createDemoRouter } from '@/router'

const fakeServer = vi.hoisted(() => ({
  getFakeMediaPage: vi.fn(),
}))

vi.mock('@/demo/fakeServer', () => fakeServer)

function item(postId: number) {
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

describe('auto scroll demo', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
    fakeServer.getFakeMediaPage.mockReset()
    fakeServer.getFakeMediaPage.mockResolvedValue({
      items: Array.from({ length: 10 }, (_, index) => item(index + 1)),
      meta: { next: 'cursor-2', total: 100 },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders header controls backed by the public instance API', async () => {
    const router = createDemoRouter(createMemoryHistory())
    await router.push('/demos/auto-scroll')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('.demos-aside a[href="/demos/auto-scroll"]').text())
      .toBe('Auto scroll')
    expect(wrapper.get('[data-test="auto-scroll-controls"]').text())
      .toContain('80 px/s')
    expect(wrapper.get('[data-test="auto-scroll-speed"]').attributes())
      .toMatchObject({ min: '20', max: '240', value: '80' })

    await wrapper.get('[data-test="auto-scroll-speed"]').setValue(120)
    expect(wrapper.get('[data-test="auto-scroll-controls"]').text())
      .toContain('120 px/s')

    await wrapper.get('[aria-label="Start auto scroll"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[aria-label="Stop auto scroll"]').exists()).toBe(true)
    expect(wrapper.get('[aria-label="Pause auto scroll"]').attributes('disabled'))
      .toBeUndefined()

    await wrapper.get('[aria-label="Pause auto scroll"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[aria-label="Resume auto scroll"]').exists()).toBe(true)

    await wrapper.get('[aria-label="Resume auto scroll"]').trigger('click')
    await wrapper.get('[aria-label="Stop auto scroll"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[aria-label="Start auto scroll"]').exists()).toBe(true)
    expect(wrapper.get('[aria-label="Pause auto scroll"]').attributes('disabled'))
      .toBeDefined()

    wrapper.unmount()
  })
})
