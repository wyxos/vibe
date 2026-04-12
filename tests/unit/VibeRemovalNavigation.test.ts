import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import type { VibeViewerItem } from '@/components/viewer'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout removal navigation', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
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
