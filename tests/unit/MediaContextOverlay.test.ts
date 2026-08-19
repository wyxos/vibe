import { mount } from '@vue/test-utils'
import { defineComponent, h, markRaw } from 'vue'
import { describe, expect, it } from 'vitest'

import MediaCard from '@/components/MediaCard.vue'

describe('MediaContextOverlay', () => {
  it('renders an optional contextual overlay across media states', async () => {
    const Overlay = markRaw(defineComponent({
      props: ['item', 'mediaIndex', 'mediaItem', 'mediaSource'],
      setup(props) {
        return () => h('div', { 'data-test': 'consumer-overlay' },
          `${props.item.postId}:${props.mediaIndex}:${props.mediaSource}:${props.mediaItem.src}`)
      },
    }))
    const wrapper = mount(MediaCard, {
      props: {
        active: true,
        entering: false,
        fetchPriority: 'high',
        index: 0,
        item: {
          postId: 10,
          src: 'https://example.com/original.jpg',
          preview: { src: 'https://example.com/preview.jpg' },
          items: [{
            src: 'https://example.com/original.jpg',
            preview: { src: 'https://example.com/preview.jpg' },
          }],
        },
        layout: 'reel',
        loadedCount: 1,
        mediaCard: { overlay: { component: Overlay } },
        mediaIndex: 0,
        previewState: 'loading',
        total: null,
      },
    })

    expect(wrapper.get('[data-test="consumer-overlay"]').text()).toContain('10:0:preview:')
    await wrapper.setProps({ previewState: 'error' })
    expect(wrapper.get('[data-test="consumer-overlay"]').exists()).toBe(true)
  })
})
