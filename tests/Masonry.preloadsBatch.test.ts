import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'
import type { GetContentFn, MasonryItemBase } from '@/masonry/types'

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
}

function makeItem(id: string): MasonryItemBase {
  return {
    id,
    type: 'image',
    width: 320,
    height: 240,
    preview: 'https://example.com/preview.jpg',
    original: 'https://example.com/original.jpg',
  }
}

describe('Masonry preload batching', () => {
  it('debounces per-item preloaded events into batched Masonry emits', async () => {
    vi.useFakeTimers()

    const onItemPreloaded = vi.fn()
    const onItemFailed = vi.fn()

    const items = Array.from({ length: 10 }, (_, i) => makeItem(`img-${i}`))

    const getContent = vi.fn<GetContentFn<MasonryItemBase>>(async () => ({
      items,
      nextPage: null,
    }))

    const wrapper = mount(Masonry, {
      attachTo: document.body,
      props: { getContent, page: 1, itemWidth: 300 },
      slots: {
        // Provide the required definition but no default slot so Masonry falls back to MasonryLoader.
        default: () => h(MasonryItem, { onPreloaded: onItemPreloaded, onFailed: onItemFailed }),
      },
    })

    await flushMicrotasks()
    await wrapper.vm.$nextTick()

    const scroller = wrapper.get('[data-testid="items-scroll-container"]')
    Object.defineProperty(scroller.element, 'clientHeight', { value: 10_000, configurable: true })
    Object.defineProperty(scroller.element, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 20_000, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 0, configurable: true })
    await scroller.trigger('scroll')
    await wrapper.vm.$nextTick()

    const imgs = wrapper.findAll('img')
    expect(imgs.length).toBeGreaterThan(0)

    // Fire 6 preloads "at the same time".
    for (const img of imgs.slice(0, 6)) {
      await img.trigger('load')
    }

    expect(onItemPreloaded).toHaveBeenCalledTimes(6)
    expect(onItemFailed).toHaveBeenCalledTimes(0)

    // Within debounce window there should be no batch yet.
    expect(wrapper.emitted('preloaded')).toBeFalsy()

    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    const batches1 = wrapper.emitted('preloaded') ?? []
    expect(batches1.length).toBe(1)
    expect((batches1[0]?.[0] as MasonryItemBase[]).length).toBe(6)

    // Later, fire the remaining 4.
    for (const img of imgs.slice(6, 10)) {
      await img.trigger('load')
    }

    expect(onItemPreloaded).toHaveBeenCalledTimes(10)

    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    const batches2 = wrapper.emitted('preloaded') ?? []
    expect(batches2.length).toBe(2)
    expect((batches2[1]?.[0] as MasonryItemBase[]).length).toBe(4)

    wrapper.unmount()
    vi.useRealTimers()
  })

  it('debounces per-item failed events into batched Masonry emits', async () => {
    vi.useFakeTimers()

    const onItemPreloaded = vi.fn()
    const onItemFailed = vi.fn()

    const items = Array.from({ length: 6 }, (_, i) => makeItem(`img-fail-${i}`))

    const getContent = vi.fn<GetContentFn<MasonryItemBase>>(async () => ({
      items,
      nextPage: null,
    }))

    const wrapper = mount(Masonry, {
      attachTo: document.body,
      props: { getContent, page: 1, itemWidth: 300 },
      slots: {
        default: () => h(MasonryItem, { onPreloaded: onItemPreloaded, onFailed: onItemFailed }),
      },
    })

    await flushMicrotasks()
    await wrapper.vm.$nextTick()

    const scroller = wrapper.get('[data-testid="items-scroll-container"]')
    Object.defineProperty(scroller.element, 'clientHeight', { value: 10_000, configurable: true })
    Object.defineProperty(scroller.element, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 20_000, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 0, configurable: true })
    await scroller.trigger('scroll')
    await wrapper.vm.$nextTick()

    const imgs = wrapper.findAll('img')
    expect(imgs.length).toBeGreaterThan(2)

    // Fail 2 quickly.
    for (const img of imgs.slice(0, 2)) {
      await img.trigger('error')
    }

    expect(onItemFailed).toHaveBeenCalledTimes(2)
    expect(wrapper.emitted('failures')).toBeFalsy()

    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    const failures1 = wrapper.emitted('failures') ?? []
    expect(failures1.length).toBe(1)
    expect((failures1[0]?.[0] as Array<{ item: MasonryItemBase; error: unknown }>).length).toBe(2)

    // Fail one later.
    await imgs[2].trigger('error')
    expect(onItemFailed).toHaveBeenCalledTimes(3)

    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    const failures2 = wrapper.emitted('failures') ?? []
    expect(failures2.length).toBe(2)
    expect((failures2[1]?.[0] as Array<{ item: MasonryItemBase; error: unknown }>).length).toBe(1)

    wrapper.unmount()
    vi.useRealTimers()
  })
})
