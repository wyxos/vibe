import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('MasonryItem definition', () => {
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

  it('uses <MasonryItem> slots for header/body/footer and passes remove()', async () => {
    vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver as unknown as typeof IntersectionObserver)

    try {
      const getContent = vi.fn(async () => {
        return {
          items: [
            {
              id: 'img-1',
              type: 'image',
              width: 320,
              height: 240,
              original: 'https://example.com/original.jpg',
              preview: 'https://example.com/preview.jpg',
            },
            {
              id: 'img-2',
              type: 'image',
              width: 320,
              height: 240,
              original: 'https://example.com/original-2.jpg',
              preview: 'https://example.com/preview-2.jpg',
            },
          ],
          nextPage: null,
        }
      })

      const wrapper = mount(Masonry, {
        props: { getContent, page: 1, itemWidth: 300 },
        slots: {
          default: () =>
            h(MasonryItem, null, {
              header: ({ item }: { item: { id: string } }) =>
                h('div', { 'data-testid': 'defined-header' }, `H:${item.id}`),
              default: ({ item }: { item: { id: string } }) =>
                h('div', { 'data-testid': 'defined-body' }, `B:${item.id}`),
              footer: ({ item, remove }: { item: { id: string }; remove: () => void }) =>
                h(
                  'button',
                  {
                    type: 'button',
                    'data-testid': `defined-remove-${item.id}`,
                    onClick: remove,
                  },
                  `Remove:${item.id}`
                ),
            }),
        },
        attachTo: document.body,
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(getContent).toHaveBeenCalledTimes(1)

      expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(2)
      expect(wrapper.findAll('[data-testid="defined-header"]').length).toBe(2)
      expect(wrapper.findAll('[data-testid="defined-body"]').length).toBe(2)

      await wrapper.get('[data-testid="defined-remove-img-1"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(1)
      expect(wrapper.text()).toContain('img-2')

      wrapper.unmount()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
