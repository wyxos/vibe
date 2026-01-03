import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('Masonry enter staggering', () => {
  class ImmediateIntersectionObserver {
    private cb: IntersectionObserverCallback
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb
    }
    observe(target: Element) {
      this.cb(
        [
          {
            target,
            isIntersecting: true,
            intersectionRatio: 1,
          } as unknown as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver
      )
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }

  it('adds a transition-delay for later items when multiple enter together', async () => {
    const rafCallbacks: FrameRequestCallback[] = []
    const originalRaf = globalThis.requestAnimationFrame
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return 0
    }) as unknown as typeof globalThis.requestAnimationFrame

    const flushRaf = (max = 10) => {
      let i = 0
      while (rafCallbacks.length && i < max) {
        const cb = rafCallbacks.shift()
        if (cb) cb(0)
        i += 1
      }
    }

    const originalResizeObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      constructor(_cb: ResizeObserverCallback) {}
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof ResizeObserver

    vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver as unknown as typeof IntersectionObserver)

    try {
      const getContent = vi.fn(async () => {
        return {
          items: [
            {
              id: 'a',
              type: 'image',
              reaction: null,
              width: 320,
              height: 240,
              original: 'https://example.com/original-a.jpg',
              preview: 'https://example.com/preview-a.jpg',
            },
            {
              id: 'b',
              type: 'image',
              reaction: null,
              width: 320,
              height: 240,
              original: 'https://example.com/original-b.jpg',
              preview: 'https://example.com/preview-b.jpg',
            },
          ],
          nextPage: null,
        }
      })

      const wrapper = mount(Masonry, {
        props: {
          getContent,
          page: 1,
          itemWidth: 300,
          enterStaggerMs: 40,
        },
        attachTo: document.body,
        slots: {
          default: () => h(MasonryItem),
        },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(getContent).toHaveBeenCalledTimes(1)

      // First RAF enables the enter transition (still at the enter start position).
      flushRaf(1)
      await wrapper.vm.$nextTick()

      const cards = wrapper.findAll('[data-testid="item-card"]')
      expect(cards).toHaveLength(2)

      const firstStyle = cards[0].attributes('style') ?? ''
      const secondStyle = cards[1].attributes('style') ?? ''

      expect(firstStyle).not.toContain('transition-delay')
      expect(secondStyle).toContain('transition-delay: 40ms')

      wrapper.unmount()
    } finally {
      vi.unstubAllGlobals()
      globalThis.ResizeObserver = originalResizeObserver
      globalThis.requestAnimationFrame = originalRaf
    }
  })
})
