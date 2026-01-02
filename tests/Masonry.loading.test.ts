import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import type { GetContentFn, GetContentResult, MasonryItemBase, PageToken } from '@/masonry/types'
import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
}

function makeItem(id: string): MasonryItemBase {
  return {
    id,
    type: 'image',
    reaction: null,
    width: 320,
    height: 240,
    original: 'https://example.com/original.jpg',
    preview: 'https://example.com/preview.jpg',
  }
}

describe('Masonry loading resilience', () => {
  it('retries next-page getContent up to 5 times with 1s.. backoff and keeps single-flight', async () => {
    vi.useFakeTimers()

    const getContent = vi.fn<GetContentFn<MasonryItemBase>>(async (pageToken) => {
        const token = String(pageToken)
        if (token === '1') {
          return { items: Array.from({ length: 20 }, (_, i) => makeItem(`1-${i}`)), nextPage: '2' }
        }

        // Fail twice for page 2, then succeed.
        if (token === '2') {
          const callsForPage2 = getContent.mock.calls.filter((c) => String(c[0]) === '2').length
          if (callsForPage2 <= 2) throw new Error('boom')
          return { items: Array.from({ length: 20 }, (_, i) => makeItem(`2-${i}`)), nextPage: null }
        }

        return { items: [], nextPage: null }
      })

    const wrapper = mount(Masonry, {
      attachTo: document.body,
      props: { getContent: getContent as any, page: 1, itemWidth: 300 },
      slots: {
        default: () => h(MasonryItem),
      },
    })

    // Initial load should succeed immediately.
    await flushMicrotasks()
    await wrapper.vm.$nextTick()
    expect(getContent).toHaveBeenCalledTimes(1)

    const scroller = wrapper.get('[data-testid="items-scroll-container"]')
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 1000, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 900, configurable: true })

    // Trigger near-bottom multiple times; should still be single-flight.
    await scroller.trigger('scroll')
    await scroller.trigger('scroll')
    await scroller.trigger('scroll')

    // First attempt for page 2 happens immediately.
    await flushMicrotasks()
    await wrapper.vm.$nextTick()

    const callsAfterKickoff = getContent.mock.calls.filter((c) => String(c[0]) === '2').length
    expect(callsAfterKickoff).toBe(1)

    // Retry #1 after 1s.
    vi.advanceTimersByTime(1000)
    await flushMicrotasks()
    await wrapper.vm.$nextTick()

    // Retry #2 after 2s.
    vi.advanceTimersByTime(2000)
    await flushMicrotasks()
    await wrapper.vm.$nextTick()

    const page2Calls = getContent.mock.calls.filter((c) => String(c[0]) === '2').length
    expect(page2Calls).toBe(3)

    wrapper.unmount()
    vi.useRealTimers()
  })

  it('ignores stale in-flight results after page prop changes', async () => {
    vi.useFakeTimers()

    let resolvePage1: ((v: GetContentResult<MasonryItemBase>) => void) | null = null
    const page1Promise: Promise<GetContentResult<MasonryItemBase>> = new Promise((resolve) => {
      resolvePage1 = resolve
    })

    const getContent = vi.fn<GetContentFn<MasonryItemBase>>(async (pageToken: PageToken) => {
      const token = String(pageToken)
      if (token === '1') return page1Promise
      if (token === '2') return { items: [makeItem('p2-only')], nextPage: null }
      return { items: [], nextPage: null }
    })

    const wrapper = mount(Masonry, {
      attachTo: document.body,
      props: { getContent, page: 1, itemWidth: 300 },
      slots: {
        default: () =>
          h(MasonryItem, null, {
            header: ({ item }: { item: MasonryItemBase }) => item.id,
          }),
      },
    })

    // Switch feed start page while page 1 request is still in flight.
    await wrapper.setProps({ page: 2 })

    await flushMicrotasks()
    await wrapper.vm.$nextTick()

    // Ensure page 2 items render.
    expect(wrapper.text()).toContain('p2-only')

    // Now resolve the stale page 1 request; it must not overwrite the feed.
    expect(resolvePage1).not.toBeNull()
    resolvePage1!({ items: [makeItem('p1-stale')], nextPage: null })

    await flushMicrotasks()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('p2-only')
    expect(wrapper.text()).not.toContain('p1-stale')

    wrapper.unmount()
    vi.useRealTimers()
  })
})
