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

  it('shows error state when media fails', async () => {
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
    expect(wrapper.text()).toContain('Error')

    wrapper.unmount()
  })
})
