import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createVibe } from '@/index'
import CardRegion from '@/components/CardRegion.vue'

describe('card region options', () => {
  it('rejects unsupported background values at runtime', () => {
    const Region = defineComponent(() => () => h('span'))

    expect(() => createVibe({
      cardFooter: {
        background: 'opaque' as 'transparent',
        component: Region,
        height: 40,
      },
      initialPage: { items: [], next: null },
      target: document.createElement('div'),
    })).toThrow(
      'Vibe cardFooter background must be "default" or "transparent".',
    )
  })

  it('applies consumer-owned card chrome spacing and transparency', async () => {
    const Region = defineComponent(() => () => h('span', 'region'))
    const item = {
      postId: 1,
      src: 'https://example.test/1.jpg',
      preview: { src: 'https://example.test/1-preview.jpg', width: 10, height: 10 },
      width: 10,
      height: 10,
      items: [],
    }
    const wrapper = mount(CardRegion, {
      props: {
        index: 0,
        item,
        layout: 'masonry',
        loadedCount: 1,
        mediaIndex: 0,
        placement: 'header',
        region: { component: Region, height: 32 },
        style: { background: 'transparent', paddingX: 0, paddingY: 4 },
        total: 1,
      },
    })

    const header = wrapper.get<HTMLElement>('.media-card-header').element
    expect(header.classList.contains('media-card-region--transparent')).toBe(true)
    expect(header.style.paddingInline).toBe('0px')
    expect(header.style.paddingBlock).toBe('4px')
  })

  it('rejects negative consumer-owned card spacing', () => {
    expect(() => createVibe({
      initialPage: { items: [], next: null },
      mediaCard: { footer: { paddingY: -1 } },
      target: document.createElement('div'),
    })).toThrow('Vibe mediaCard footer paddingY must be a non-negative number.')
  })
})
