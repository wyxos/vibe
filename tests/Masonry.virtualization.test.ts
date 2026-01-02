import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'
import type { MasonryItemBase } from '@/masonry/types'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function makeItem(id: string): MasonryItemBase {
  return {
    id,
    type: 'image',
    reaction: null,
    width: 300,
    height: 300,
    original: 'https://example.com/original.jpg',
    preview: 'https://example.com/preview.jpg',
  }
}

describe('Masonry virtualization + resize', () => {
  it('renders a subset when viewportHeight > 0 and updates window on scroll', async () => {
    const roCallbacks: ResizeObserverCallback[] = []
    const originalResizeObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      private _cb: ResizeObserverCallback
      constructor(cb: ResizeObserverCallback) {
        this._cb = cb
        roCallbacks.push(cb)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof ResizeObserver

    const getContent = vi.fn(async () => {
      return {
        items: Array.from({ length: 200 }, (_, i) => makeItem(`i-${i}`)),
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      attachTo: document.body,
      props: {
        getContent,
        page: 1,
        itemWidth: 300,
        overscanPx: 0,
        gapY: 0,
      },
      slots: {
        default: () =>
          h(MasonryItem, null, {
            header: ({ item }: { item: MasonryItemBase }) => h('div', { 'data-testid': `hdr-${item.id}` }, item.id),
          }),
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    const scroller = wrapper.get('[data-testid="items-scroll-container"]')
    Object.defineProperty(scroller.element, 'clientWidth', { value: 600, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 600, configurable: true })

    if (roCallbacks.length) {
      roCallbacks[0]([] as unknown as ResizeObserverEntry[], {} as unknown as ResizeObserver)
    }
    await wrapper.vm.$nextTick()

    const initialHeaders = wrapper.findAll('[data-testid^="hdr-i-"]')
    expect(initialHeaders.length).toBeGreaterThan(0)
    expect(initialHeaders.length).toBeLessThan(200)

    Object.defineProperty(scroller.element, 'scrollTop', { value: 6000, configurable: true })
    await scroller.trigger('scroll')
    await wrapper.vm.$nextTick()

    const laterHeaders = wrapper.findAll('[data-testid^="hdr-i-"]')
    expect(laterHeaders.length).toBeGreaterThan(0)
    expect(laterHeaders.length).toBeLessThan(200)

    const ids = laterHeaders.map((n) => n.text())
    expect(new Set(ids).size).toBe(ids.length)

    wrapper.unmount()
    globalThis.ResizeObserver = originalResizeObserver
  })
})
