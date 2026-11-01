import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ReelFeed from '@/components/ReelFeed.vue'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('keeps the accepted destination selected throughout animated scrolling', async () => {
  const frames: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.push(callback); return frames.length })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  const wrapper = mount(ReelFeed, { props: {
    canRetryEnd: false, hasNext: false, infiniteScroll: false, isLoadingMore: false,
    items: [10, 11, 12].map(postId => ({ postId, src: 'data:,image', width: 100, height: 100, items: [] })),
    loadMoreLocked: false, mediaIndices: new Map(), nextPageError: false, previewStates: new Map(),
    reelAutoAdvance: { enabled: false, includePostItems: false, intervalMs: 5000 }, total: null,
  } })
  await wrapper.vm.$nextTick()
  const feed = wrapper.get('.reel-feed')
  const navigation = wrapper.vm.transitionActivePost(11)
  await wrapper.vm.$nextTick()
  expect(feed.attributes('data-active-post-id')).toBe('11')
  const start = performance.now()
  for (const elapsed of [16, 32, 70, 150, 320]) {
    frames.shift()!(start + elapsed)
    await feed.trigger('scroll')
    expect(feed.attributes('data-active-post-id')).toBe('11')
  }
  await navigation
  expect(wrapper.emitted('activeChange')).toEqual([[10], [11]])
  wrapper.unmount()
})
