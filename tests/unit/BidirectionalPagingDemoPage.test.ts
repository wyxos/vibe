import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getVibeMasonryLeaveDuration } from '@/components/viewer-core/useMasonryMotion'
import BidirectionalPagingDemoPage from '@/pages/BidirectionalPagingDemoPage.vue'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('BidirectionalPagingDemoPage', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
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

  it('toggles the page-loading lock CTA in the advanced demo footer bar', async () => {
    vi.useFakeTimers()
    setViewportWidth(1_280)

    const wrapper = mount(BidirectionalPagingDemoPage)

    await vi.advanceTimersByTimeAsync(100)
    await flushDom()

    const lockButton = wrapper.get('[data-testid="advanced-static-page-loading-lock-button"]')

    expect(lockButton.text()).toContain('Lock paging')
    expect(lockButton.attributes('aria-pressed')).toBe('false')

    await lockButton.trigger('click')
    await flushDom()

    expect(lockButton.text()).toContain('Unlock paging')
    expect(lockButton.attributes('aria-pressed')).toBe('true')

    await lockButton.trigger('click')
    await flushDom()

    expect(lockButton.text()).toContain('Lock paging')
    expect(lockButton.attributes('aria-pressed')).toBe('false')

    wrapper.unmount()
  })

  it('removes 10 random loaded items from the advanced demo footer CTA', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    setViewportWidth(1_280)

    const wrapper = mount(BidirectionalPagingDemoPage)

    await vi.advanceTimersByTimeAsync(100)
    await flushDom()

    const removeRandomButton = wrapper.get('[data-testid="advanced-static-remove-random-button"]')

    expect(removeRandomButton.attributes('disabled')).toBeUndefined()

    await removeRandomButton.trigger('click')
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-list-card-leaving"]')).toHaveLength(10)
    expect(wrapper.get('[data-testid="advanced-static-status-total"]').text()).toContain('15')
    expect(wrapper.get('[data-testid="advanced-static-remove-random-button"]').attributes('disabled')).toBeUndefined()

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
