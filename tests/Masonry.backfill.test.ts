import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { BackfillStats } from '@/masonryTypes'
import Masonry from '@/Masonry.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function makeItem(id: string) {
  return {
    id,
    type: 'image',
    reaction: null,
    width: 320,
    height: 240,
    original: 'https://example.com/original.mp4',
    preview: 'https://example.com/preview.jpg',
  }
}

type WrapperWithExposed = {
  vm: {
    $: {
      exposed?: unknown
    }
  }
}

function getExposed<T>(wrapper: WrapperWithExposed): T {
  // Vue Test Utils doesn't always proxy defineExpose() onto wrapper.vm.
  // The reliable path is via the component internal instance.
  const exposed = wrapper.vm.$.exposed
  return exposed as T
}

describe('Masonry backfill', () => {
  it('fetches multiple short pages to fill pageSize on initial load', async () => {
    const getContent = vi.fn(async (pageToken: unknown) => {
      const token = Number(pageToken)

      if (token === 1) {
        return {
          items: Array.from({ length: 15 }, (_, i) => makeItem(`p1-${i}`)),
          nextPage: 2,
        }
      }

      if (token === 2) {
        return {
          items: Array.from({ length: 19 }, (_, i) => makeItem(`p2-${i}`)),
          nextPage: 3,
        }
      }

      if (token === 3) {
        return {
          items: Array.from({ length: 20 }, (_, i) => makeItem(`p3-${i}`)),
          nextPage: 4,
        }
      }

      return { items: [], nextPage: null }
    })

    const wrapper = mount(Masonry, {
      attachTo: document.body,
      props: {
        getContent,
        mode: 'backfill',
        page: 1,
        pageSize: 20,
        backfillRequestDelayMs: 0,
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(2)
    expect(getContent).toHaveBeenNthCalledWith(1, 1)
    expect(getContent).toHaveBeenNthCalledWith(2, 2)

    const cards = wrapper.findAll('[data-testid="item-card"]')
    expect(cards).toHaveLength(20)

    const exposed = getExposed<{ backfillStats: { value: BackfillStats } }>(
      wrapper as unknown as WrapperWithExposed
    )
    const debug = exposed?.backfillStats?.value
    expect(debug?.enabled).toBe(true)
    expect(debug?.pageSize).toBe(20)
    expect(debug?.bufferSize).toBe(14)
    expect(debug?.lastBatch?.pages).toEqual([1, 2])
    expect(debug?.lastBatch?.emitted).toBe(20)
    expect(debug?.lastBatch?.carried).toBe(14)

    // Next page should advance to the next unfetched token.
    expect(wrapper.text()).toContain('Scroll to load page 3')

    wrapper.unmount()
  })

  it('uses carryover buffer first and reduces network fetches on next load', async () => {
    const getContent = vi.fn(async (pageToken: unknown) => {
      const token = Number(pageToken)

      if (token === 1) {
        return {
          items: Array.from({ length: 15 }, (_, i) => makeItem(`p1-${i}`)),
          nextPage: 2,
        }
      }

      if (token === 2) {
        return {
          items: Array.from({ length: 19 }, (_, i) => makeItem(`p2-${i}`)),
          nextPage: 3,
        }
      }

      if (token === 3) {
        return {
          items: Array.from({ length: 20 }, (_, i) => makeItem(`p3-${i}`)),
          nextPage: 4,
        }
      }

      return { items: [], nextPage: null }
    })

    const wrapper = mount(Masonry, {
      attachTo: document.body,
      props: {
        getContent,
        mode: 'backfill',
        page: 1,
        pageSize: 20,
        prefetchThresholdPx: 200,
        backfillRequestDelayMs: 0,
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(2)

    const scroller = wrapper.get('[data-testid="items-scroll-container"]')

    // Distance from bottom must be <= prefetchThresholdPx to trigger loading.
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 100, configurable: true })
    // Keep clientHeight at 0 so virtualization stays disabled and all items render.
    Object.defineProperty(scroller.element, 'clientHeight', { value: 0, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 0, configurable: true })

    await scroller.trigger('scroll')

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(3)
    expect(getContent).toHaveBeenNthCalledWith(3, 3)

    const cards = wrapper.findAll('[data-testid="item-card"]')
    expect(cards).toHaveLength(40)

    const exposed = getExposed<{ backfillStats: { value: BackfillStats } }>(
      wrapper as unknown as WrapperWithExposed
    )
    const debug = exposed?.backfillStats?.value
    expect(debug?.lastBatch?.usedFromBuffer).toBe(14)
    expect(debug?.lastBatch?.pages).toEqual([3])
    expect(debug?.lastBatch?.emitted).toBe(20)
    expect(debug?.bufferSize).toBe(14)

    expect(wrapper.text()).toContain('Scroll to load page 4')

    wrapper.unmount()
  })

  it('drains buffer even when nextPage is null (no extra network)', async () => {
    const getContent = vi.fn(async (pageToken: unknown) => {
      const token = Number(pageToken)

      if (token === 1) {
        return {
          items: Array.from({ length: 25 }, (_, i) => makeItem(`p1-${i}`)),
          nextPage: null,
        }
      }

      return { items: [], nextPage: null }
    })

    const wrapper = mount(Masonry, {
      attachTo: document.body,
      props: {
        getContent,
        mode: 'backfill',
        page: 1,
        pageSize: 20,
        prefetchThresholdPx: 200,
        backfillRequestDelayMs: 0,
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('[data-testid="item-card"]')).toHaveLength(20)

    const scroller = wrapper.get('[data-testid="items-scroll-container"]')

    // Distance from bottom must be <= prefetchThresholdPx to trigger loading.
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 100, configurable: true })
    // Keep clientHeight at 0 so virtualization stays disabled and all items render.
    Object.defineProperty(scroller.element, 'clientHeight', { value: 0, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 0, configurable: true })

    await scroller.trigger('scroll')

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(getContent).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('[data-testid="item-card"]')).toHaveLength(25)

    const exposed = getExposed<{ backfillStats: { value: BackfillStats } }>(
      wrapper as unknown as WrapperWithExposed
    )
    const debug = exposed?.backfillStats?.value
    expect(debug?.lastBatch?.startPage).toBe(null)
    expect(debug?.lastBatch?.pages).toEqual([])
    expect(debug?.lastBatch?.usedFromBuffer).toBe(5)
    expect(debug?.lastBatch?.fetchedFromNetwork).toBe(0)
    expect(debug?.lastBatch?.emitted).toBe(5)
    expect(debug?.bufferSize).toBe(0)

    wrapper.unmount()
  })
})
