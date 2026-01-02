import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

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
    width: 320,
    height: 240,
    original: 'https://example.com/original.jpg',
    preview: 'https://example.com/preview.jpg',
  }
}

describe('Masonry resume session', () => {
  it('accepts restoredPagesLoaded as an array and resumes from derived nextPage on scroll', async () => {
    const getContent = vi.fn(async (pageToken: unknown) => {
      const token = String(pageToken)
      if (token === '6') {
        return {
          items: Array.from({ length: 20 }, (_, i) => makeItem(`6-${i}`)),
          nextPage: null,
        }
      }

      throw new Error(`unexpected page token: ${token}`)
    })

    const Harness = defineComponent({
      setup() {
        const items = ref<MasonryItemBase[]>(
          Array.from({ length: 100 }, (_, i) => {
            const page = Math.floor(i / 20) + 1
            const idx = i % 20
            return makeItem(`p${page}-i${idx}`)
          })
        )

        return () =>
          h('div', [
            h('div', { 'data-testid': 'items-length' }, String(items.value.length)),
            h(
              Masonry,
              {
                getContent,
                page: 1,
                itemWidth: 300,
                items: items.value,
                restoredPagesLoaded: [1, 2, 3, 4, 5],
                'onUpdate:items': (next) => {
                  items.value = next as MasonryItemBase[]
                },
              },
              {
                default: () => h(MasonryItem),
              }
            ),
          ])
      },
    })

    const wrapper = mount(Harness, { attachTo: document.body })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Resume mode should skip the initial getContent call entirely.
    expect(getContent).toHaveBeenCalledTimes(0)
    expect(wrapper.get('[data-testid="items-length"]').text()).toBe('100')

    // Trigger load of next page via scroll near bottom.
    const scroller = wrapper.get('[data-testid="items-scroll-container"]')
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 1000, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 900, configurable: true })

    await scroller.trigger('scroll')

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(1)
    expect(String(getContent.mock.calls[0]?.[0])).toBe('6')
    expect(wrapper.get('[data-testid="items-length"]').text()).toBe('120')

    wrapper.unmount()
  })

  it('accepts restoredPagesLoaded as a single page token and resumes from derived nextPage on scroll', async () => {
    const getContent = vi.fn(async (pageToken: unknown) => {
      const token = String(pageToken)
      if (token === '6') {
        return {
          items: Array.from({ length: 20 }, (_, i) => makeItem(`6-${i}`)),
          nextPage: null,
        }
      }

      throw new Error(`unexpected page token: ${token}`)
    })

    const Harness = defineComponent({
      setup() {
        const items = ref<MasonryItemBase[]>(
          Array.from({ length: 100 }, (_, i) => {
            const page = Math.floor(i / 20) + 1
            const idx = i % 20
            return makeItem(`p${page}-i${idx}`)
          })
        )

        return () =>
          h('div', [
            h('div', { 'data-testid': 'items-length' }, String(items.value.length)),
            h(
              Masonry,
              {
                getContent,
                page: 1,
                itemWidth: 300,
                items: items.value,
                restoredPagesLoaded: 5,
                'onUpdate:items': (next) => {
                  items.value = next as MasonryItemBase[]
                },
              },
              {
                default: () => h(MasonryItem),
              }
            ),
          ])
      },
    })

    const wrapper = mount(Harness, { attachTo: document.body })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(0)
    expect(wrapper.get('[data-testid="items-length"]').text()).toBe('100')

    const scroller = wrapper.get('[data-testid="items-scroll-container"]')
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 1000, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 900, configurable: true })

    await scroller.trigger('scroll')

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(1)
    expect(String(getContent.mock.calls[0]?.[0])).toBe('6')
    expect(wrapper.get('[data-testid="items-length"]').text()).toBe('120')

    wrapper.unmount()
  })
})
