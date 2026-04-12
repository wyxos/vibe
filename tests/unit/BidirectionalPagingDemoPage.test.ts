import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getVibeMasonryLeaveDuration } from '@/components/viewer-core/useMasonryMotion'
import BidirectionalPagingDemoPage from '@/pages/BidirectionalPagingDemoPage.vue'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('BidirectionalPagingDemoPage', () => {
  afterEach(() => {
    vi.useRealTimers()
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
  })

  it('animates the advanced demo list out before showing the empty status in the footer bar', async () => {
    vi.useFakeTimers()
    setViewportWidth(1_280)

    const wrapper = mount(BidirectionalPagingDemoPage)

    await vi.advanceTimersByTimeAsync(100)
    await flushDom()

    const removeAllButton = wrapper.get('[data-testid="advanced-static-remove-all-button"]')

    expect(removeAllButton.attributes('disabled')).toBeUndefined()

    await removeAllButton.trigger('click')
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-empty-state-inline"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="vibe-empty-state-badge"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="vibe-list-card-leaving"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="advanced-static-status-bar"]').text()).toContain('static')

    await vi.advanceTimersByTimeAsync(getVibeMasonryLeaveDuration())
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-empty-state-inline"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="vibe-empty-state-badge"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="advanced-static-status-bar"]').text()).toContain('no items available')
    expect(wrapper.get('[data-testid="advanced-static-remove-all-button"]').attributes('disabled')).toBeDefined()

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
