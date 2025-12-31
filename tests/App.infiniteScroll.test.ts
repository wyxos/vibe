import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { fetchPage } from '@/fakeServer'
import Home from '@/pages/Home.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

vi.mock('@/fakeServer', () => {
  return {
    fetchPage: vi.fn(async (pageToken: unknown) => {
      const tokenStr = String(pageToken)
      const makeItem = (n: number) => ({
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
    expect(fetchPage).toHaveBeenCalledTimes(1)

    const scroller = wrapper.get('[data-testid="items-scroll-container"]')

    // Simulate scroll near bottom
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 1000, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 900, configurable: true })

    await scroller.trigger('scroll')

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(fetchPage).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })
})
