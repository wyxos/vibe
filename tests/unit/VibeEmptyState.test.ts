import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout empty state', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
  })

  it('keeps the desktop grid shell mounted when there are no items', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([]),
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.get('[data-testid="vibe-list-surface"]').attributes('data-visible')).toBe('true')
    expect(wrapper.get('[data-testid="vibe-empty-state-inline"]').attributes('data-surface')).toBe('grid')
    expect(wrapper.get('[data-testid="vibe-empty-state-inline"]').text()).toBe('no items available')
    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('0 / 0')
    expect(wrapper.get('[data-testid="vibe-list-scrollbar-thumb"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('renders a custom empty-state slot in badge mode on desktop', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([], {
        emptyStateMode: 'badge',
      }),
      slots: {
        'empty-state': ({ message, mode, surface }: { message: string; mode: 'badge' | 'inline'; surface: 'fullscreen' | 'grid' }) =>
          h('div', { 'data-mode': mode, 'data-surface': surface, 'data-testid': 'custom-empty-state' }, message),
      },
    })

    await flushDom()

    expect(wrapper.get('[data-testid="custom-empty-state"]').attributes('data-mode')).toBe('badge')
    expect(wrapper.get('[data-testid="custom-empty-state"]').attributes('data-surface')).toBe('grid')
    expect(wrapper.get('[data-testid="custom-empty-state"]').text()).toBe('no items available')

    wrapper.unmount()
  })

  it('can hide empty-state output while leaving the grid shell mounted', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([], {
        emptyStateMode: 'hidden',
      }),
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe-list-surface"]').attributes('data-visible')).toBe('true')
    expect(wrapper.find('[data-testid="vibe-empty-state-inline"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="vibe-empty-state-badge"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('returns desktop fullscreen back to the list shell when the last item is removed', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('empty-after-remove', 'Empty after remove')]),
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')

    const handle = wrapper.vm as unknown as VibeHandle
    handle.remove('empty-after-remove')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.get('[data-testid="vibe-list-surface"]').attributes('data-visible')).toBe('true')
    expect(wrapper.get('[data-testid="vibe-empty-state-inline"]').text()).toBe('no items available')

    wrapper.unmount()
  })

  it('renders the fullscreen empty badge on mobile when requested', async () => {
    setViewportWidth(390)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([], {
        emptyStateMode: 'badge',
      }),
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-empty-state-badge"]').attributes('data-surface')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-empty-state-badge"]').text()).toBe('no items available')

    wrapper.unmount()
  })
})

function createImageItem(id: string, title?: string): VibeViewerItem {
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
