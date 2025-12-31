import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import Home from '../src/pages/Home.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

vi.mock('../src/fakeServer', () => {
  return {
    fetchPage: vi.fn(async (pageToken) => {
      const tokenStr = String(pageToken)
      const makeItem = (n) => ({
        id: `${tokenStr}-${n}`,
        type: 'image',
        reaction: null,
        width: 320,
        height: 240,
        original: 'https://picsum.photos/seed/test/1600/1200',
        preview: 'https://picsum.photos/seed/test/320/240',
      })

      if (tokenStr === '1') {
        return { items: Array.from({ length: 20 }, (_, i) => makeItem(i)), nextPage: '2' }
      }

      if (tokenStr === '2') {
        return { items: Array.from({ length: 20 }, (_, i) => makeItem(100 + i)), nextPage: null }
      }

      return { items: [], nextPage: null }
    }),
  }
})

describe('App infinite scroll', () => {
  it('loads the next page when scrolled near the bottom', async () => {
    const wrapper = mount(Home, { attachTo: document.body })

    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(20)

    const scroller = wrapper.get('[data-testid="items-scroll-container"]')

    // Simulate scroll near bottom
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 1000, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 900, configurable: true })

    await scroller.trigger('scroll')

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Should append another page worth of items (total 40)
    expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(40)

    wrapper.unmount()
  })
})
