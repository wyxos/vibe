import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeRootHandle } from '@/components/vibe-root/useVibeRoot'
import type { VibeViewerItem } from '@/components/vibeViewer'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeRoot removal navigation', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
  })

  it('keeps the current fullscreen item anchored when a batched undo restores items before it', async () => {
    setViewportWidth(1_280)

    let wrapper = mount(VibeRoot, {
      props: {
        activeIndex: 0,
        items: Array.from({ length: 7 }, (_, index) => createImageItem(`item-${index + 1}`, `Item ${index + 1}`)),
        'onUpdate:activeIndex': async (value: number) => {
          await wrapper.setProps({
            activeIndex: value,
          })
        },
      },
    })

    await flushDom()

    const handle = wrapper.vm as unknown as VibeRootHandle

    expect(handle.remove(['item-2', 'item-5', 'item-7']).ids).toEqual(['item-2', 'item-5', 'item-7'])
    await flushDom()
    expect(wrapper.get('[data-testid="vibe-root-pagination"]').text()).toContain('1 / 4')

    await wrapper.get('[data-index="1"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-root-title"]').text()).toBe('Item 3')
    expect(wrapper.get('[data-testid="vibe-root-pagination"]').text()).toContain('2 / 4')

    expect(handle.undo()?.ids).toEqual(['item-2', 'item-5', 'item-7'])
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-root-title"]').text()).toBe('Item 3')
    expect(wrapper.get('[data-testid="vibe-root-pagination"]').text()).toContain('3 / 7')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-root-title"]').text()).toBe('Item 2')

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
