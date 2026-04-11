import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'
import { createDeferred } from '../helpers/useDataSourceTestUtils'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout grid status slot', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
  })

  it('renders the built-in grid status badge when no custom status slot is supplied', async () => {
    setViewportWidth(1_280)
    const deferred = createDeferred<{ items: VibeViewerItem[]; nextPage: string | null }>()

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-grid-built-in-status', 'Grid built-in status image')], {
        nextCursor: 'page-2',
        resolve: vi.fn(() => deferred.promise),
        showStatusBadges: true,
      }),
    })

    await flushDom()
    void (wrapper.vm as unknown as VibeHandle).loadNext()
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-grid-status-badge"]').text()).toBe('Loading more items')

    deferred.resolve({ items: [], nextPage: null })
    await flushDom()

    wrapper.unmount()
  })

  it('renders a custom grid status slot for loading-more state', async () => {
    setViewportWidth(1_280)
    const deferred = createDeferred<{ items: VibeViewerItem[]; nextPage: string | null }>()

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-grid-status', 'Grid status image')], {
        nextCursor: 'page-2',
        resolve: vi.fn(() => deferred.promise),
        showStatusBadges: true,
      }),
      slots: {
        'grid-status': ({ kind, message }: { kind: 'end' | 'failed' | 'filling' | 'initializing' | 'loading-more' | 'refreshing'; message: string }) =>
          h('div', { 'data-kind': kind, 'data-testid': 'custom-grid-status' }, message),
      },
    })

    await flushDom()
    void (wrapper.vm as unknown as VibeHandle).loadNext()
    await flushDom()

    expect(wrapper.get('[data-testid="custom-grid-status"]').attributes('data-kind')).toBe('loading-more')
    expect(wrapper.get('[data-testid="custom-grid-status"]').text()).toBe('Loading more items')

    deferred.resolve({ items: [], nextPage: null })
    await flushDom()

    wrapper.unmount()
  })

  it('renders a custom grid status slot for end-of-list state', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-grid-end', 'Grid end image')], {
        showStatusBadges: true,
      }),
      slots: {
        'grid-status': ({ kind, message }: { kind: 'end' | 'failed' | 'filling' | 'initializing' | 'loading-more' | 'refreshing'; message: string }) =>
          h('div', { 'data-kind': kind, 'data-testid': 'custom-grid-status' }, message),
      },
    })

    await flushDom()

    expect(wrapper.get('[data-testid="custom-grid-status"]').attributes('data-kind')).toBe('end')
    expect(wrapper.get('[data-testid="custom-grid-status"]').text()).toBe('End of list')

    wrapper.unmount()
  })

  it('suppresses grid status output when showStatusBadges is false', async () => {
    setViewportWidth(1_280)
    const deferred = createDeferred<{ items: VibeViewerItem[]; nextPage: string | null }>()

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-grid-hidden-status', 'Grid hidden status image')], {
        nextCursor: 'page-2',
        resolve: vi.fn(() => deferred.promise),
        showStatusBadges: false,
      }),
      slots: {
        'grid-status': ({ kind, message }: { kind: 'end' | 'failed' | 'filling' | 'initializing' | 'loading-more' | 'refreshing'; message: string }) =>
          h('div', { 'data-kind': kind, 'data-testid': 'custom-grid-status' }, message),
      },
    })

    await flushDom()
    void (wrapper.vm as unknown as VibeHandle).loadNext()
    await flushDom()

    expect(wrapper.find('[data-testid="custom-grid-status"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Loading more items')

    deferred.resolve({ items: [], nextPage: null })
    await flushDom()

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
