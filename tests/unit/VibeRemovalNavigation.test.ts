import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import type { VibeViewerItem } from '@/components/viewer'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'
import { createDeferred } from '../helpers/useDataSourceTestUtils'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout removal navigation', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps the current fullscreen item anchored when a batched undo restores items before it', async () => {
    setViewportWidth(1_280)

    let wrapper = mount(Layout, {
      props: createSeededVibeProps(
        Array.from({ length: 7 }, (_, index) => createImageItem(`item-${index + 1}`, `Item ${index + 1}`)),
        {
          activeIndex: 0,
        },
      ),
    })

    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle

    expect(handle.remove(['item-2', 'item-5', 'item-7']).ids).toEqual(['item-2', 'item-5', 'item-7'])
    await flushDom()
    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('1 / 4')

    await wrapper.get('[data-index="1"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-title"]').text()).toBe('Item 3')
    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('2 / 4')

    expect(handle.undo()?.ids).toEqual(['item-2', 'item-5', 'item-7'])
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-title"]').text()).toBe('Item 3')
    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('3 / 7')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-title"]').text()).toBe('Item 2')

    wrapper.unmount()
  })

  it('resets the masonry scroll position before animating the last items out', async () => {
    setViewportWidth(1_280)

    const items = Array.from({ length: 24 }, (_, index) => createImageItem(`remove-all-${index + 1}`, `Remove all ${index + 1}`))
    const wrapper = mount(Layout, {
      props: createSeededVibeProps(items),
    })

    await flushDom()

    const scrollViewport = wrapper.get('[data-testid="vibe-list-scroll"]')
    ;(scrollViewport.element as HTMLElement).scrollTop = 1_200
    await scrollViewport.trigger('scroll')
    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle
    expect(handle.remove(items.map((item) => item.id)).ids).toHaveLength(items.length)
    await flushDom()

    expect((scrollViewport.element as HTMLElement).scrollTop).toBe(0)
    expect(wrapper.findAll('[data-testid="vibe-list-card-leaving"]').length).toBeGreaterThan(0)

    wrapper.unmount()
  })

  it('locks boundary loading while the empty-removal reset scroll is happening', async () => {
    setViewportWidth(1_280)

    const items = Array.from({ length: 24 }, (_, index) => createImageItem(`locked-remove-${index + 1}`, `Locked remove ${index + 1}`))
    const resolve = vi.fn().mockResolvedValue({
      items: [createImageItem('page-previous', 'Previous page item')],
      nextPage: null,
      previousPage: null,
    })
    const wrapper = mount(Layout, {
      props: createSeededVibeProps(items, {
        mode: 'static',
        previousCursor: '9',
        resolve,
      }),
    })

    await flushDom()

    const scrollViewport = wrapper.get('[data-testid="vibe-list-scroll"]')
    ;(scrollViewport.element as HTMLElement).scrollTop = 1_200
    await scrollViewport.trigger('scroll')
    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle
    expect(handle.remove(items.map((item) => item.id)).ids).toHaveLength(items.length)
    await flushDom()

    await scrollViewport.trigger('scroll')
    await flushDom()

    expect(resolve).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('ignores a removal-driven bottom re-entry until the user scrolls again', async () => {
    vi.useFakeTimers()
    setViewportWidth(1_280)

    const items = Array.from({ length: 24 }, (_, index) => createImageItem(`partial-remove-${index + 1}`, `Partial remove ${index + 1}`))
    const resolve = vi.fn().mockResolvedValue({
      items: [createImageItem('page-next', 'Next page item')],
      nextPage: null,
      previousPage: null,
    })
    const wrapper = mount(Layout, {
      props: createSeededVibeProps(items, {
        mode: 'static',
        nextCursor: '9',
        resolve,
      }),
    })

    await flushDom()

    const scrollViewport = wrapper.get('[data-testid="vibe-list-scroll"]')
    ;(scrollViewport.element as HTMLElement).scrollTop = 1_200
    await scrollViewport.trigger('scroll')
    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle
    expect(handle.remove(items.slice(-12).map((item) => item.id)).ids).toHaveLength(12)
    await flushDom()

    ;(scrollViewport.element as HTMLElement).scrollTop = 100_000
    await scrollViewport.trigger('scroll')
    await flushDom()

    expect(resolve).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1_301)

    await scrollViewport.trigger('wheel', { deltaY: 180 })
    await flushDom()

    expect(resolve).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('prefetches the next page when fullscreen removal advances near the trailing edge without changing the numeric index', async () => {
    setViewportWidth(1_280)

    const deferred = createDeferred<{ items: VibeViewerItem[]; nextPage: string | null; previousPage: string | null }>()
    const resolve = vi.fn(() => deferred.promise)
    const wrapper = mount(Layout, {
      props: createSeededVibeProps(
        Array.from({ length: 5 }, (_, index) => createImageItem(`item-${index + 1}`, `Item ${index + 1}`)),
        {
          nextCursor: 'page-2',
          resolve,
        },
      ),
    })

    await flushDom()
    await wrapper.get('[data-index="3"] button').trigger('click')
    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle
    expect(handle.remove('item-4').ids).toEqual(['item-4'])
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-title"]').text()).toBe('Item 5')
    expect(wrapper.get('[data-testid="vibe-pagination-spinner"]').exists()).toBe(true)
    expect(resolve).toHaveBeenCalledTimes(1)

    deferred.resolve({
      items: Array.from({ length: 5 }, (_, index) => createImageItem(`page-two-${index + 1}`, `Page two ${index + 1}`)),
      nextPage: null,
      previousPage: null,
    })
    await flushDom()

    wrapper.unmount()
  })

  it('keeps fullscreen on a loading placeholder when removing the last visible item until the next page arrives', async () => {
    setViewportWidth(1_280)

    const deferred = createDeferred<{ items: VibeViewerItem[]; nextPage: string | null; previousPage: string | null }>()
    const resolve = vi.fn(() => deferred.promise)
    const wrapper = mount(Layout, {
      props: createSeededVibeProps(
        [createImageItem('last-visible', 'Last visible item')],
        {
          nextCursor: 'page-2',
          resolve,
        },
      ),
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle
    expect(handle.remove('last-visible').ids).toEqual(['last-visible'])
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-forward-fill-placeholder"]').text()).toContain('Loading more items')
    expect(resolve).toHaveBeenCalledTimes(1)

    deferred.resolve({
      items: Array.from({ length: 5 }, (_, index) => createImageItem(`page-three-${index + 1}`, `Page three ${index + 1}`)),
      nextPage: null,
      previousPage: null,
    })
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-forward-fill-placeholder"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="vibe-title"]').text()).toBe('Page three 1')

    wrapper.unmount()
  })
})

function createImageItem(id: string, title: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    title,
    url: `https://example.com/${id}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${id}-preview.jpg`,
      width: 320,
      height: 180,
    },
  }
}

async function flushDom() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  })
}
