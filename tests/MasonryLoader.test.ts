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

  it('emits success when an image is already complete (cache hit) without relying on load event', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'img-cached',
      type: 'image',
      width: 320,
      height: 240,
      preview: 'https://example.com/cached.jpg',
      original: 'https://example.com/original.jpg',
    }

    const proto = HTMLImageElement.prototype as unknown as Record<string, unknown>
    const prevComplete = Object.getOwnPropertyDescriptor(proto, 'complete')
    const prevNaturalWidth = Object.getOwnPropertyDescriptor(proto, 'naturalWidth')

    Object.defineProperty(proto, 'complete', {
      configurable: true,
      get() {
        return true
      },
    })
    Object.defineProperty(proto, 'naturalWidth', {
      configurable: true,
      get() {
        return 123
      },
    })

    const restore = () => {
      if (prevComplete) Object.defineProperty(proto, 'complete', prevComplete)
      else delete proto.complete

      if (prevNaturalWidth) Object.defineProperty(proto, 'naturalWidth', prevNaturalWidth)
      else delete proto.naturalWidth
    }

    let wrapper: ReturnType<typeof mount> | null = null
    try {
      wrapper = mount(MasonryLoader, { props: { item } })

      const io = instances[0]
      io.trigger(0.5)
      await wrapper.vm.$nextTick()

      // Success should be emitted even if we never dispatch a load event.
      await new Promise((r) => setTimeout(r, 0))
      expect(wrapper.emitted('success')).toBeTruthy()
    } finally {
      wrapper?.unmount()
      restore()
    }
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

  it('prefers preview for video src without extension', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'vid-preview',
      type: 'video',
      width: 320,
      height: 240,
      preview: 'https://atlas.test/api/files/123/preview',
      original: 'https://atlas.test/api/files/123/downloaded',
    }

    const wrapper = mount(MasonryLoader, { props: { item } })

    const io = instances[0]
    io.trigger(1)
    await wrapper.vm.$nextTick()

    const video = wrapper.find('video')
    expect(video.exists()).toBe(true)
    expect(video.attributes('poster')).toBeUndefined()

    const source = wrapper.find('video source')
    expect(source.exists()).toBe(true)
    expect(source.attributes('src')).toBe(item.preview)

    wrapper.unmount()
  })

  it('shows error state when a video source fails', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'vid-error',
      type: 'video',
      width: 320,
      height: 240,
      preview: 'https://example.com/broken.mp4',
      original: 'https://example.com/original.mp4',
    }

    const wrapper = mount(MasonryLoader, { props: { item } })

    const io = instances[0]
    io.trigger(1)
    await wrapper.vm.$nextTick()

    await wrapper.find('video source').trigger('error')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="masonry-loader-error"]').exists()).toBe(true)
    expect(wrapper.emitted('error')).toBeTruthy()

    wrapper.unmount()
  })
})
