import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

import Masonry from '../src/Masonry.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('Masonry slots + media rendering', () => {
  it('renders itemHeader and itemFooter slots and keeps media rendering internal', async () => {
    const getContent = vi.fn(async () => {
      return {
        items: [
          {
            id: 'img-1',
            type: 'image',
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/original/1600/1200',
            preview: 'https://picsum.photos/seed/preview/320/240',
          },
          {
            id: 'vid-1',
            type: 'video',
            width: 320,
            height: 240,
            original: 'https://example.com/video.mp4',
            preview: 'https://picsum.photos/seed/poster/320/240',
          },
        ],
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      props: { getContent, page: 1, itemWidth: 300 },
      slots: {
        itemHeader: ({ item }) =>
          h('div', { 'data-testid': 'slot-item-header' }, `H:${item.id}`),
        itemFooter: ({ item }) =>
          h('div', { 'data-testid': 'slot-item-footer' }, `F:${item.id}`),
      },
      attachTo: document.body,
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(1)

    const cards = wrapper.findAll('[data-testid="item-card"]')
    expect(cards).toHaveLength(2)

    expect(wrapper.findAll('[data-testid="slot-item-header"]').length).toBe(2)
    expect(wrapper.findAll('[data-testid="slot-item-footer"]').length).toBe(2)

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://picsum.photos/seed/preview/320/240')

    const video = wrapper.find('video')
    expect(video.exists()).toBe(true)
    expect(video.attributes('poster')).toBe('https://picsum.photos/seed/poster/320/240')

    const source = wrapper.find('video source')
    expect(source.exists()).toBe(true)
    expect(source.attributes('src')).toBe('https://example.com/video.mp4')

    wrapper.unmount()
  })

  it('renders the default footer when itemFooter slot is not provided', async () => {
    const getContent = vi.fn(async () => {
      return {
        items: [
          {
            id: 'img-1',
            type: 'image',
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/original/1600/1200',
            preview: 'https://picsum.photos/seed/preview/320/240',
          },
        ],
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      props: { getContent, page: 1, itemWidth: 300 },
      slots: {
        itemHeader: ({ item }) =>
          h('div', { 'data-testid': 'slot-item-header' }, `H:${item.id}`),
      },
      attachTo: document.body,
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('img-1')

    wrapper.unmount()
  })
})
