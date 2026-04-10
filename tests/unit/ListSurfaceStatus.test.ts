import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout grid status slot', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
  })

  it('renders a custom grid status slot for loading-more state', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-grid-status', 'Grid status image')],
        loading: true,
        hasNextPage: true,
      },
      slots: {
        'grid-status': ({ kind, message }: { kind: 'end' | 'loading-more'; message: string }) =>
          h('div', { 'data-kind': kind, 'data-testid': 'custom-grid-status' }, message),
      },
    })

    await flushDom()

    expect(wrapper.get('[data-testid="custom-grid-status"]').attributes('data-kind')).toBe('loading-more')
    expect(wrapper.get('[data-testid="custom-grid-status"]').text()).toBe('Loading more items')

    wrapper.unmount()
  })

  it('suppresses grid status badges and slot rendering when showStatusBadges is false', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-grid-status-hidden', 'Grid status image')],
        loading: true,
        hasNextPage: true,
        showStatusBadges: false,
      },
      slots: {
        'grid-status': ({ kind, message }: { kind: 'end' | 'loading-more'; message: string }) =>
          h('div', { 'data-kind': kind, 'data-testid': 'custom-grid-status' }, message),
      },
    })

    await flushDom()

    expect(wrapper.find('[data-testid="custom-grid-status"]').exists()).toBe(false)
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
