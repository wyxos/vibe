import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import App from '@/App.vue'
import { createDemoRouter } from '@/router'

const fakeServer = vi.hoisted(() => ({
  getFakeMediaPage: vi.fn(),
}))

vi.mock('@/demo/fakeServer', () => fakeServer)

function item(postId: number, grouped = false) {
  const media = {
    src: `https://example.com/${postId}.jpg`,
    preview: {
      src: `https://example.com/${postId}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
  }

  return {
    ...media,
    postId,
    items: grouped ? [{ ...media, src: `${media.src}?item=1` }] : [],
  }
}

function videoItem(postId: number) {
  const media = item(postId)
  return {
    ...media,
    src: `https://example.com/${postId}.mp4`,
    preview: {
      ...media.preview,
      src: `https://example.com/${postId}-preview.mp4`,
    },
  }
}

describe('reel auto advance demo', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
    fakeServer.getFakeMediaPage.mockReset()
    fakeServer.getFakeMediaPage.mockResolvedValue({
      items: [item(1), item(2, true), videoItem(3)],
      meta: { next: null, total: 3 },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('toggles the countdown and grouped post-item participation from the header', async () => {
    const router = createDemoRouter(createMemoryHistory())
    await router.push('/demos/reel-auto-advance')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('.demos-aside a[href="/demos/reel-auto-advance"]').text())
      .toBe('Reel auto advance')
    expect(wrapper.get('[data-layout-mode="reel"]').exists()).toBe(true)
    expect(wrapper.get('[data-active-post-id]').attributes('data-active-post-id')).toBe('2')
    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/2.jpg')
    expect(wrapper.get('[data-post-id="3"] video').attributes('src'))
      .toBe('https://example.com/3.mp4')
    expect(wrapper.get('[aria-label="Start reel auto advance"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="reel-auto-advance-items"]').attributes('checked'))
      .toBeUndefined()

    await wrapper.get('img').trigger('load')
    await wrapper.get('[aria-label="Start reel auto advance"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="Stop reel auto advance"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="reel-auto-advance"]').attributes('aria-label'))
      .toBe('Auto advance to the next post in 3s')

    await wrapper.get('[data-test="reel-auto-advance-items"]').setValue(true)
    await flushPromises()
    expect(wrapper.get('[data-test="reel-auto-advance"]').attributes('aria-label'))
      .toBe('Auto advance to the next post item in 3s')

    await wrapper.get('[aria-label="Stop reel auto advance"]').trigger('click')
    expect(wrapper.find('[data-test="reel-auto-advance"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
