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
    height: 1200,
    preview: {
      height: 600,
      src: `https://example.com/${postId}-preview.jpg`,
      width: 450,
    },
    src: `https://example.com/${postId}.jpg`,
    width: 900,
  }

  return {
    ...media,
    items: grouped ? [{ ...media, src: `${media.src}?item=1` }] : [],
    postId,
  }
}

describe('reel information sheet demo', () => {
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
      items: [item(1, true), item(2), item(3)],
      meta: { next: null, total: 3 },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('demonstrates two masonry-backed information tabs and runtime toggling', async () => {
    const router = createDemoRouter(createMemoryHistory())
    await router.push('/demos/reel-info-sheet')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('.demos-aside a[href="/demos/reel-info-sheet"]').text())
      .toBe('Reel info sheet')
    const toggle = wrapper.get('[aria-label="Open reel information sheet"]')
    expect(toggle.attributes()).toHaveProperty('disabled')

    await wrapper.get('.demo-vibe-host [data-post-id="1"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[aria-label="Open reel information sheet"]').attributes())
      .not.toHaveProperty('disabled')
    await wrapper.get('[aria-label="Open reel information sheet"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[role="tab"]')).toHaveLength(2)
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text()))
      .toEqual(['User', 'Post'])
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('User')
    expect(wrapper.get('.reel-info-sheet .masonry-feed').exists()).toBe(true)

    const postTab = wrapper.findAll('[role="tab"]')
      .find((tab) => tab.text() === 'Post')
    await postTab?.trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Post')
    expect(wrapper.get('.reel-info-sheet .masonry-feed').exists()).toBe(true)

    await wrapper.get('[aria-label="Close reel information"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="reel-info-sheet"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
