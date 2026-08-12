import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import MasonryFeed from '@/components/MasonryFeed.vue'

const item = {
  postId: 1,
  src: 'https://example.com/1.mp4',
  preview: {
    src: 'https://example.com/1-preview.mp4',
    type: 'video' as const,
    width: 450,
    height: 600,
  },
  width: 900,
  height: 1200,
  items: [],
}

describe('MasonryFeed suspension', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('preserves visible video loading priority while suspended behind a reel', async () => {
    const wrapper = mount(MasonryFeed, {
      props: {
        canRetryEnd: false,
        enteringPostIds: new Set<number>(),
        entryDelays: new Map<number, number>(),
        hasNext: false,
        infiniteScroll: true,
        isLoadingMore: false,
        items: [item],
        loadMoreLocked: false,
        mediaIndices: new Map<number, number>(),
        nextPageError: false,
        previewStates: new Map<string, 'loading'>(),
        total: null,
      },
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const video = wrapper.get('video').element
    expect(video.getAttribute('preload')).toBe('auto')

    await wrapper.setProps({ suspended: true })
    expect(wrapper.get('video').element).toBe(video)
    expect(video.getAttribute('preload')).toBe('auto')

    await wrapper.setProps({ suspended: false })
    expect(wrapper.get('video').element).toBe(video)
    expect(video.getAttribute('preload')).toBe('auto')
  })
})
