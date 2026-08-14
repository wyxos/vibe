import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MediaCard from '@/components/MediaCard.vue'

function asset(name: string, type?: 'video') {
  const extension = type === 'video' ? 'mp4' : 'jpg'
  return {
    src: `https://example.test/${name}.${extension}`,
    preview: {
      src: `https://example.test/${name}-preview.${extension}`,
      type,
      width: 450,
      height: 600,
    },
    type,
    width: 900,
    height: 1200,
  }
}

function cardProps() {
  return {
    active: true,
    entering: false,
    fetchPriority: 'high' as const,
    index: 0,
    item: {
      postId: 10,
      ...asset('parent'),
      items: [asset('child'), asset('video', 'video')],
    },
    layout: 'masonry' as const,
    loadedCount: 1,
    mediaCard: { groupedMediaNavigation: 'thumbnails' as const },
    mediaIndex: 0,
    previewState: 'ready' as const,
    total: null,
  }
}

describe('grouped media thumbnail navigation', () => {
  it('selects lazy thumbnail previews without activating the masonry card', async () => {
    const wrapper = mount(MediaCard, { props: cardProps() })
    const buttons = wrapper.findAll('.media-thumbnail-button')

    expect(buttons).toHaveLength(3)
    expect(wrapper.find('.media-carousel-controls').exists()).toBe(false)
    expect(buttons[0]?.attributes('aria-pressed')).toBe('true')
    expect(buttons[1]?.get('img').attributes('loading')).toBe('lazy')
    expect(buttons[2]?.find('video').exists()).toBe(true)

    await buttons[1]?.trigger('click')

    expect(wrapper.emitted('mediaChange')).toEqual([[1]])
    expect(wrapper.emitted('activate')).toBeUndefined()
  })

  it('omits the strip for one media and retains arrows in reel layout', async () => {
    const wrapper = mount(MediaCard, { props: cardProps() })
    await wrapper.setProps({
      item: { postId: 11, ...asset('single'), items: [] },
    })
    expect(wrapper.find('.media-thumbnail-strip').exists()).toBe(false)

    await wrapper.setProps({
      item: cardProps().item,
      layout: 'reel',
    })
    expect(wrapper.find('.media-thumbnail-strip').exists()).toBe(false)
    expect(wrapper.get('.media-carousel-controls').classes())
      .toContain('media-carousel-controls--persistent')
  })
})
