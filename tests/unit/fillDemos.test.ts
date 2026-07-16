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

function page(postId: number, next: string | null) {
  return {
    items: [item(postId)],
    meta: { next, total: 10 },
  }
}

describe('fill demos', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
    fakeServer.getFakeMediaPage.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function mountDemo(path: string) {
    const router = createDemoRouter(createMemoryHistory())
    await router.push(path)
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()
    return wrapper
  }

  it('lets frontend fill request an editable number of pages', async () => {
    fakeServer.getFakeMediaPage
      .mockResolvedValueOnce(page(1, 'two'))
      .mockResolvedValueOnce(page(2, 'three'))
      .mockResolvedValueOnce(page(3, 'four'))
    const wrapper = await mountDemo('/demos/fill/frontend')

    expect(wrapper.get('.demos-aside a[href="/demos/fill/frontend"]').text())
      .toBe('Frontend fill')
    await wrapper.get('[data-test="fill-page-count"]').setValue(2)
    await wrapper.get('[data-test="fill-pages"]').trigger('click')
    await flushPromises()

    expect(fakeServer.getFakeMediaPage.mock.calls.map(([cursor]) => cursor))
      .toEqual([null, 'two', 'three'])
    expect(wrapper.get('[data-test="fill-lifecycle"]').text())
      .toBe('Fill·Complete2 / 2 pages')
    expect(wrapper.findAll('.masonry-item')).toHaveLength(3)
    wrapper.unmount()
  })

  it('lets frontend fill follow the cursor to the end', async () => {
    fakeServer.getFakeMediaPage
      .mockResolvedValueOnce(page(1, 'two'))
      .mockResolvedValueOnce(page(2, null))
    const wrapper = await mountDemo('/demos/fill/frontend')

    await wrapper.get('[data-test="fill-to-end"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="fill-lifecycle"]').text())
      .toBe('Fill·Complete1 pages')
    expect(wrapper.get('[data-test="fill-to-end"]').attributes('disabled'))
      .toBeDefined()
    wrapper.unmount()
  })

  it('shows backend progress while preserving an atomic terminal append', async () => {
    vi.useFakeTimers()
    fakeServer.getFakeMediaPage
      .mockResolvedValueOnce(page(1, 'two'))
      .mockResolvedValueOnce(page(2, 'three'))
      .mockResolvedValueOnce(page(3, 'four'))
    const wrapper = await mountDemo('/demos/fill/backend')
    await wrapper.get('[data-test="fill-page-count"]').setValue(2)

    await wrapper.get('[data-test="fill-pages"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-test="fill-lifecycle"]').text())
      .toBe('Fill·Waiting0 / 2 pages')

    await vi.advanceTimersByTimeAsync(250)
    await flushPromises()
    expect(wrapper.get('[data-test="fill-lifecycle"]').text())
      .toBe('Fill·Waiting1 / 2 pages')
    expect(wrapper.findAll('.masonry-item')).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(250)
    await flushPromises()
    expect(wrapper.get('[data-test="fill-lifecycle"]').text())
      .toBe('Fill·Complete2 / 2 pages')
    expect(wrapper.findAll('.masonry-item')).toHaveLength(3)
    wrapper.unmount()
  })

  it('cancels the simulated backend job before its next request', async () => {
    vi.useFakeTimers()
    fakeServer.getFakeMediaPage.mockResolvedValueOnce(page(1, 'two'))
    const wrapper = await mountDemo('/demos/fill/backend')

    await wrapper.get('[data-test="fill-to-end"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-test="cancel-fill"]').trigger('click')
    await flushPromises()
    await vi.advanceTimersByTimeAsync(250)

    expect(wrapper.get('[data-test="fill-lifecycle"]').text())
      .toBe('Fill·Cancelled0 pages')
    expect(fakeServer.getFakeMediaPage).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
})
