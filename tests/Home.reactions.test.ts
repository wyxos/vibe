import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Home from '@/pages/Home.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

vi.mock('@/fakeServer', () => {
  return {
    fetchPage: vi.fn(async () => {
      const makeItem = (n: number) => ({
        id: `1-${n}`,
        type: 'image',
        reaction: null,
        width: 320,
        height: 240,
        original: 'https://picsum.photos/seed/test/1600/1200',
        preview: 'https://picsum.photos/seed/test/320/240',
      })

      return { items: Array.from({ length: 20 }, (_, i) => makeItem(i)), nextPage: null }
    }),
  }
})

describe('Home reactions', () => {
  it('sets active reaction on click', async () => {
    const wrapper = mount(Home, { attachTo: document.body })

    await flushPromises()
    await wrapper.vm.$nextTick()

    const loveButtons = wrapper.findAll('button[title="Love"]')
    expect(loveButtons.length).toBeGreaterThan(0)

    const first = loveButtons[0]
    expect(first.attributes('aria-pressed')).toBe('false')

    await first.trigger('click')
    await wrapper.vm.$nextTick()

    expect(first.attributes('aria-pressed')).toBe('true')

    const icon = first.find('i')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('fa-solid')

    wrapper.unmount()
  })
})
