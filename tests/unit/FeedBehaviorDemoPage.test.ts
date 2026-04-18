import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getVibeMasonryLeaveDuration } from '@/components/viewer-core/useMasonryMotion'
import FeedBehaviorDemoPage from '@/pages/FeedBehaviorDemoPage.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
}))

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('FeedBehaviorDemoPage', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
  })

  it('animates the demo list out before showing the empty status in the footer bar', async () => {
    vi.useFakeTimers()
    setViewportWidth(1_280)

    const wrapper = mount(FeedBehaviorDemoPage)

    await vi.advanceTimersByTimeAsync(100)
    await flushDom()

    const removeAllButton = wrapper.get('[data-testid="feed-behavior-remove-all-button"]')

    expect(removeAllButton.attributes('disabled')).toBeUndefined()

    await removeAllButton.trigger('click')
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-empty-state-inline"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="vibe-empty-state-badge"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="vibe-list-card-leaving"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="feed-behavior-status-bar"]').text()).toContain('no items available')

    await vi.advanceTimersByTimeAsync(getVibeMasonryLeaveDuration())
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-empty-state-inline"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="vibe-empty-state-badge"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="feed-behavior-status-bar"]').text()).toContain('no items available')
    expect(wrapper.get('[data-testid="feed-behavior-remove-all-button"]').attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('toggles the page-loading lock CTA in the footer bar', async () => {
    vi.useFakeTimers()
    setViewportWidth(1_280)

    const wrapper = mount(FeedBehaviorDemoPage)

    await vi.advanceTimersByTimeAsync(100)
    await flushDom()

    const lockButton = wrapper.get('[data-testid="feed-behavior-page-loading-lock-button"]')

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

  it('updates the footer load progress bars from the Vibe scroll budget', async () => {
    vi.useFakeTimers()
    setViewportWidth(1_280)

    const wrapper = mount(FeedBehaviorDemoPage)

    await vi.advanceTimersByTimeAsync(100)
    await flushDom()

    const scrollViewport = wrapper.get('[data-testid="vibe-list-scroll"]').element as HTMLElement
    const previousProgress = wrapper.get('[data-testid="feed-behavior-previous-boundary-progress"]')
    const nextProgress = wrapper.get('[data-testid="feed-behavior-next-boundary-progress"]')

    setScrollMetrics(scrollViewport, 20, 700, 2_000)
    await wrapper.get('[data-testid="vibe-list-scroll"]').trigger('scroll')
    await flushDom()

    expect(Number(previousProgress.attributes('aria-valuenow'))).toBe(100)
    expect(Number(nextProgress.attributes('aria-valuenow'))).toBeLessThan(10)

    setScrollMetrics(scrollViewport, 1_180, 700, 2_000)
    await wrapper.get('[data-testid="vibe-list-scroll"]').trigger('scroll')
    await flushDom()

    const previousNearBottom = Number(previousProgress.attributes('aria-valuenow'))
    const nextNearBottom = Number(nextProgress.attributes('aria-valuenow'))

    expect(previousNearBottom).toBeGreaterThan(0)
    expect(previousNearBottom).toBeLessThan(50)
    expect(nextNearBottom).toBeGreaterThan(90)

    setScrollMetrics(scrollViewport, 1_181, 700, 2_600)
    await wrapper.get('[data-testid="vibe-list-scroll"]').trigger('scroll')
    await flushDom()

    const nextAfterBudgetIncrease = Number(nextProgress.attributes('aria-valuenow'))

    expect(nextAfterBudgetIncrease).toBeGreaterThan(0)
    expect(nextAfterBudgetIncrease).toBeLessThan(nextNearBottom)

    wrapper.unmount()
  })

  it('removes 10 random loaded items from the footer CTA', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    setViewportWidth(1_280)

    const wrapper = mount(FeedBehaviorDemoPage)

    await vi.advanceTimersByTimeAsync(100)
    await flushDom()

    const removeRandomButton = wrapper.get('[data-testid="feed-behavior-remove-random-button"]')

    expect(removeRandomButton.attributes('disabled')).toBeUndefined()

    await removeRandomButton.trigger('click')
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-list-card-leaving"]')).toHaveLength(10)
    expect(wrapper.get('[data-testid="feed-behavior-status-total"]').text()).toContain('15')
    expect(wrapper.get('[data-testid="feed-behavior-remove-random-button"]').attributes('disabled')).toBeUndefined()

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

function setScrollMetrics(element: HTMLElement, scrollTop: number, clientHeight: number, scrollHeight: number) {
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    value: scrollTop,
    writable: true,
  })
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    value: clientHeight,
  })
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  })
}
