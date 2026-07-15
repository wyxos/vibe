import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MediaCard from '@/components/MediaCard.vue'

function mediaAsset(name: string) {
  return {
    src: `https://example.com/${name}.jpg`,
    preview: {
      src: `https://example.com/${name}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
  }
}

function props() {
  return {
    entering: false,
    fetchPriority: 'high' as const,
    index: 0,
    item: {
      postId: 10,
      ...mediaAsset('10'),
      items: [mediaAsset('10-a'), mediaAsset('10-b')],
    },
    layout: 'reel' as const,
    loadedCount: 1,
    mediaIndex: 0,
    previewState: 'ready' as const,
    total: null,
  }
}

describe('MediaCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accumulates native line-based deltaX without treating deltaY as horizontal', async () => {
    const wrapper = mount(MediaCard, { props: props() })
    const media = wrapper.get('.media-card-media')

    media.element.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaMode: 1,
      deltaX: 0,
      deltaY: 3,
      shiftKey: true,
    }))
    expect(wrapper.emitted('mediaChange')).toBeUndefined()

    const firstHorizontal = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaMode: 1,
      deltaX: 1,
    })
    media.element.dispatchEvent(firstHorizontal)
    expect(firstHorizontal.defaultPrevented).toBe(true)
    expect(wrapper.emitted('mediaChange')).toBeUndefined()

    media.element.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaMode: 1,
      deltaX: 1,
    }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('mediaChange')).toEqual([[1]])
  })

  it('tracks the direction used by the grouped-media slide transition', async () => {
    const wrapper = mount(MediaCard, { props: props() })

    await wrapper.get('[aria-label="Next media for post 10"]').trigger('click')
    expect(wrapper.get('.media-card-media').attributes('data-media-direction')).toBe('next')

    await wrapper.setProps({ mediaIndex: 1 })
    expect(wrapper.get('.media-card-frame').attributes('data-media-index')).toBe('1')

    await wrapper.get('[aria-label="Previous media for post 10"]').trigger('click')
    expect(wrapper.get('.media-card-media').attributes('data-media-direction')).toBe('previous')
    expect(wrapper.emitted('mediaChange')).toEqual([[1], [0]])
  })
})
