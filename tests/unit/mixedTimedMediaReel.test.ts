import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ReelFeed from '@/components/ReelFeed.vue'

function item(postId: number, extension: 'jpg' | 'mp3' | 'mp4') {
  return {
    postId,
    src: `https://example.com/${postId}.${extension}`,
    preview: {
      height: 600,
      src: `https://example.com/${postId}-preview.${extension}`,
      width: 450,
    },
    width: 900,
    height: 1200,
    items: [],
  }
}

describe('mixed timed-media reels', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('advances from audio to video as each item completes', async () => {
    const wrapper = mount(ReelFeed, {
      props: {
        canRetryEnd: false,
        hasNext: false,
        infiniteScroll: true,
        isLoadingMore: false,
        items: [item(10, 'mp3'), item(11, 'mp4'), item(12, 'jpg')],
        loadMoreLocked: false,
        mediaIndices: new Map(),
        nextPageError: false,
        previewStates: new Map([
          ['10:0', 'ready'],
          ['11:0', 'ready'],
          ['12:0', 'ready'],
        ]),
        reelAutoAdvance: {
          enabled: true,
          includePostItems: false,
          intervalMs: 2_000,
        },
        total: null,
      },
    })
    await wrapper.vm.$nextTick()

    await wrapper.get('[data-post-id="10"] audio').trigger('ended')
    expect(wrapper.get('.gallery-shell').attributes('data-active-post-id')).toBe('11')
    await wrapper.get('[data-post-id="11"] video').trigger('ended')
    expect(wrapper.get('.gallery-shell').attributes('data-active-post-id')).toBe('12')
  })
})
