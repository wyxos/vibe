import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Layout from '@/components/Layout.vue'
import { createDeferred } from '../helpers/useDataSourceTestUtils'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout loading lifecycle', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
  })

  it('keeps the desktop list shell mounted during an unresolved empty load', async () => {
    setViewportWidth(1_280)

    const deferred = createDeferred<{ items: []; nextPage: string | null }>()

    const wrapper = mount(Layout, {
      props: {
        resolve: vi.fn(() => deferred.promise),
        showStatusBadges: false,
      },
      slots: {
        'grid-footer': () => h('div', { 'data-testid': 'desktop-grid-footer' }, 'Atlas status bar'),
      },
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe-list-surface"]').attributes('data-visible')).toBe('true')
    expect(wrapper.get('[data-testid="desktop-grid-footer"]').text()).toBe('Atlas status bar')
    expect(wrapper.find('[data-testid="vibe-empty-state-inline"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Loading...')

    deferred.resolve({ items: [], nextPage: null })
    await flushDom()

    expect(wrapper.get('[data-testid="desktop-grid-footer"]').text()).toBe('Atlas status bar')
    expect(wrapper.get('[data-testid="vibe-empty-state-inline"]').text()).toBe('no items available')

    wrapper.unmount()
  })

  it('uses the loading overlay on mobile while the first page is unresolved', async () => {
    setViewportWidth(390)

    const deferred = createDeferred<{ items: []; nextPage: string | null }>()

    const wrapper = mount(Layout, {
      props: {
        resolve: vi.fn(() => deferred.promise),
      },
    })

    await flushDom()

    expect(wrapper.text()).toContain('Loading...')
    expect(wrapper.text()).not.toContain('no items available')

    deferred.resolve({ items: [], nextPage: null })
    await flushDom()

    wrapper.unmount()
  })
})

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
