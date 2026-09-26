import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ReelFeed from '@/components/ReelFeed.vue'

function item(postId: number) {
  return {
    postId,
    src: `https://example.com/${postId}.jpg`,
    preview: { src: `https://example.com/${postId}.jpg`, width: 450, height: 600 },
    width: 900,
    height: 1200,
    items: [],
  }
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  vi.stubGlobal('ResizeObserver', class {
    disconnect(): void {}
    observe(): void {}
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('advances through loaded posts but leaves the next page to manual loading', async () => {
  const wrapper = mount(ReelFeed, {
    props: {
      canRetryEnd: false,
      hasNext: true,
      infiniteScroll: false,
      isLoadingMore: false,
      items: [item(10), item(11)],
      loadMoreLocked: false,
      mediaIndices: new Map(),
      nextPageError: false,
      previewStates: new Map([['10:0', 'ready'], ['11:0', 'ready']]),
      reelAutoAdvance: { enabled: true, includePostItems: false, intervalMs: 2_000 },
      total: null,
    },
  })
  await wrapper.vm.$nextTick()

  await wrapper.get('.reel-auto-advance-progress').trigger('animationend')
  expect(wrapper.get('.gallery-shell').attributes('data-active-post-id')).toBe('11')

  await wrapper.get('.reel-auto-advance-progress').trigger('animationend')
  expect(wrapper.emitted('loadMore')).toBeUndefined()

  await wrapper.get('[data-test="load-more"]').trigger('click')
  expect(wrapper.emitted('loadMore')).toEqual([[]])

  await wrapper.setProps({ infiniteScroll: true })
  await wrapper.get('.reel-auto-advance-progress').trigger('animationend')
  expect(wrapper.emitted('loadMore')).toEqual([[], []])
})
