import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'

import Masonry from '../src/Masonry.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('Masonry v-model:items', () => {
  it('keeps parent items in sync (initial load, append, remove)', async () => {
    const getContent = vi.fn(async (pageToken) => {
      const token = String(pageToken)

      const makeItem = (id) => ({
        id,
        type: 'image',
        reaction: null,
        width: 320,
        height: 240,
        original: 'https://picsum.photos/seed/test/1600/1200',
        preview: 'https://picsum.photos/seed/test/320/240',
      })

      if (token === '1') {
        return {
          items: Array.from({ length: 20 }, (_, i) => makeItem(`1-${i}`)),
          nextPage: '2',
        }
      }

      if (token === '2') {
        return {
          items: Array.from({ length: 20 }, (_, i) => makeItem(`2-${i}`)),
          nextPage: null,
        }
      }

      return { items: [], nextPage: null }
    })

    const Harness = defineComponent({
      setup() {
        const items = ref([])
        return () =>
          h(
            Masonry,
            {
              getContent,
              page: 1,
              itemWidth: 300,
              items: items.value,
              'onUpdate:items': (next) => {
                items.value = next
              },
            },
            {
              itemFooter: ({ item, remove }) =>
                h(
                  'button',
                  {
                    type: 'button',
                    'data-testid': `remove-${item.id}`,
                    onClick: remove,
                  },
                  'Remove',
                ),
            },
          )
      },
    })

    const wrapper = mount(Harness, { attachTo: document.body })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(20)

    // Trigger load of next page via scroll near bottom.
    const scroller = wrapper.get('[data-testid="items-scroll-container"]')
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 1000, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 900, configurable: true })

    await scroller.trigger('scroll')

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(40)

    // Remove one item via slot helper; should update parent items via v-model.
    await wrapper.get('[data-testid="remove-1-0"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(39)

    wrapper.unmount()
  })
})
