import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Home from '../src/pages/Home.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

vi.mock('../src/fakeServer', () => {
  return {
    fetchPage: vi.fn(async () => {
      const makeItem = (id: string) => ({
        id,
        type: 'image',
        reaction: null,
        width: 320,
        height: 240,
        original: 'https://picsum.photos/seed/test/1600/1200',
        preview: 'https://picsum.photos/seed/test/320/240',
      })

      return {
        items: [makeItem('1-0')],
        nextPage: null,
      }
    }),
  }
})

describe('Home rendering + Masonry wiring', () => {
  it('wires header/footer heights into Masonry', async () => {
    const wrapper = mount(Home, { attachTo: document.body })

    await flushPromises()
    await wrapper.vm.$nextTick()

    const header = wrapper.get('[data-testid="item-header-container"]')
    const footer = wrapper.get('[data-testid="item-footer-container"]')

    expect(header.attributes('style')).toContain('height: 45px')
    expect(footer.attributes('style')).toContain('height: 54px')

    wrapper.unmount()
  })

  it('renders type badge and page/id label in the header slot', async () => {
    const wrapper = mount(Home, { attachTo: document.body })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('image')
    expect(wrapper.text()).toContain('p1')
    expect(wrapper.text()).toContain('1-0')

    wrapper.unmount()
  })

  it('removes an item via the Remove action', async () => {
    const wrapper = mount(Home, { attachTo: document.body })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(1)

    const removeButton = wrapper.get('button[title="Remove"]')
    await removeButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(0)

    wrapper.unmount()
  })
})
