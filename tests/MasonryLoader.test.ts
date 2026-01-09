import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MasonryLoader from '@/components/MasonryLoader.vue'
import type { MasonryItemBase } from '@/masonry/types'

type IOInstance = {
  trigger: (ratio: number) => void
}

function installMockIntersectionObserver() {
  const instances: Array<MockIntersectionObserver & IOInstance> = []

  class MockIntersectionObserver {
    cb: IntersectionObserverCallback
    el: Element | null = null

    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb
      instances.push(this as MockIntersectionObserver & IOInstance)
    }

    observe(el: Element) {
      this.el = el
    }

    unobserve() {}

    disconnect() {}

    takeRecords() {
      return []
    }

    trigger(ratio: number) {
      if (!this.el) throw new Error('No element observed')
      this.cb(
        [
          {
            target: this.el,
            isIntersecting: ratio > 0,
            intersectionRatio: ratio,
          } as unknown as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver
      )
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as unknown as typeof IntersectionObserver)

  return { instances }
}

describe('MasonryLoader', () => {
  it('starts rendering media only after >= 50% intersection', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'img-1',
      type: 'image',
      width: 320,
      height: 240,
      preview: 'https://example.com/preview.jpg',
      original: 'https://example.com/original.jpg',
    }

    const wrapper = mount(MasonryLoader, { props: { item } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-testid="masonry-loader-spinner"]').exists()).toBe(false)

    // Below the threshold: should not render.
    const io = instances[0]
    expect(io).toBeTruthy()
    io.trigger(0.49)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-testid="masonry-loader-spinner"]').exists()).toBe(false)

    // At threshold: should render.
    io.trigger(0.5)
    await wrapper.vm.$nextTick()

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(item.preview)

    // Media starts hidden until it succeeds.
    expect(img.classes()).toContain('opacity-0')

    // Shows spinner until the media fires success.
    expect(wrapper.find('[data-testid="masonry-loader-spinner"]').exists()).toBe(true)

    // Emit success on load.
    await img.trigger('load')
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.find('[data-testid="masonry-loader-spinner"]').exists()).toBe(false)

    // Media fades in on success.
    expect(wrapper.find('img').classes()).toContain('opacity-100')

    wrapper.unmount()
  })

  it('does not clear media src when timeouts are disabled', async () => {
    vi.useFakeTimers()
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'img-timeout-src',
      type: 'image',
      width: 320,
      height: 240,
      preview: 'https://example.com/slow.jpg',
      original: 'https://example.com/original.jpg',
    }

    const wrapper = mount(MasonryLoader, { props: { item, timeoutSeconds: 1 } })

    const io = instances[0]
    io.trigger(1)
    await wrapper.vm.$nextTick()

    const img = wrapper.find('img')
    const imgEl = img.element as HTMLImageElement
    expect(imgEl.getAttribute('src')).toBe(item.preview)

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(imgEl.getAttribute('src') ?? '').toBe(item.preview)
    expect(wrapper.emitted('error')).toBeFalsy()

    wrapper.unmount()
    vi.useRealTimers()
  })

  it('does not emit timeout error even when item timeout is set', async () => {
    vi.useFakeTimers()
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'img-timeout-override',
      type: 'image',
      width: 320,
      height: 240,
      preview: 'https://example.com/slow.jpg',
      original: 'https://example.com/original.jpg',
      timeoutSeconds: 0.5,
    }

    const wrapper = mount(MasonryLoader, { props: { item, timeoutSeconds: 5 } })

    const io = instances[0]
    io.trigger(1)
    await wrapper.vm.$nextTick()

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('error')).toBeFalsy()

    wrapper.unmount()
    vi.useRealTimers()
  })

  it('does not auto retry when an error occurs', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'img-error',
      type: 'image',
      width: 320,
      height: 240,
      preview: 'https://example.com/broken.jpg',
      original: 'https://example.com/original.jpg',
    }

    const wrapper = mount(MasonryLoader, { props: { item } })

    const io = instances[0]
    io.trigger(1)
    await wrapper.vm.$nextTick()

    await wrapper.find('img').trigger('error')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="masonry-loader-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="masonry-loader-retry-status"]').exists()).toBe(
      false
    )

    wrapper.unmount()
  })

  it('manual retry resets error state without auto retry', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'img-retry',
      type: 'image',
      width: 320,
      height: 240,
      preview: 'https://example.com/broken.jpg',
      original: 'https://example.com/original.jpg',
    }

    const wrapper = mount(MasonryLoader, { props: { item } })

    const io = instances[0]
    io.trigger(1)
    await wrapper.vm.$nextTick()

    await wrapper.find('img').trigger('error')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="masonry-loader-error"]').exists()).toBe(true)

    await wrapper.get('[data-testid="masonry-loader-retry"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="masonry-loader-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="masonry-loader-spinner"]').exists()).toBe(
      true
    )
    expect(wrapper.find('[data-testid="masonry-loader-retry-status"]').exists()).toBe(
      false
    )

    wrapper.unmount()
  })
})
