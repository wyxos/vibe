import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout fullscreen aside layout', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
  })

  it('renders a fullscreen aside slot as a side column on wide desktop viewports', async () => {
    setViewportWidth(1_600)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-aside-column', 'Aside column item')],
      },
      slots: {
        'fullscreen-aside': () => h('div', { 'data-testid': 'custom-fullscreen-aside' }, 'Details column'),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-fullscreen-aside"]').text()).toContain('Details column')

    wrapper.unmount()
  })

  it('renders a fullscreen aside slot as an overlay drawer on narrower desktop viewports', async () => {
    setViewportWidth(1_100)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-aside-drawer', 'Aside drawer item')],
      },
      slots: {
        'fullscreen-aside': () => h('div', { 'data-testid': 'custom-fullscreen-aside' }, 'Details drawer'),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-fullscreen-aside"]').text()).toContain('Details drawer')

    wrapper.unmount()
  })

  it('renders fullscreen header actions next to the pagination counter', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-header-action', 'Header action item')],
      },
      slots: {
        'fullscreen-header-actions': () => h('button', { 'data-testid': 'custom-header-action' }, 'Details'),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="custom-header-action"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('1 / 1')

    wrapper.unmount()
  })

  it('renders a custom fullscreen status slot for loading-more state', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-status-slot', 'Status slot item')],
        loading: true,
        hasNextPage: true,
        showStatusBadges: true,
      },
      slots: {
        'fullscreen-status': ({ kind, message }: { kind: 'end' | 'loading-more'; message: string }) =>
          h('div', { 'data-kind': kind, 'data-testid': 'custom-fullscreen-status' }, message),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="custom-fullscreen-status"]').attributes('data-kind')).toBe('loading-more')
    expect(wrapper.get('[data-testid="custom-fullscreen-status"]').text()).toBe('Loading more items')

    wrapper.unmount()
  })

  it('can suppress the fullscreen end badge', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-hide-end-badge', 'Hide end badge item')],
        hasNextPage: false,
        showEndBadge: false,
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.text()).not.toContain('End reached')

    wrapper.unmount()
  })

  it('suppresses fullscreen status output when showStatusBadges is false', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-hide-status-badge', 'Hide status badge item')],
        loading: true,
        hasNextPage: true,
        showStatusBadges: false,
      },
      slots: {
        'fullscreen-status': ({ kind, message }: { kind: 'end' | 'loading-more'; message: string }) =>
          h('div', { 'data-kind': kind, 'data-testid': 'custom-fullscreen-status' }, message),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.find('[data-testid="custom-fullscreen-status"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Loading more items')

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
