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

  it('animates the demo list out while refreshing emptied visible items', async () => {
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
    expect(wrapper.get('[data-testid="feed-behavior-status-bar"]').text()).toContain('refreshing')

    await vi.advanceTimersByTimeAsync(getVibeMasonryLeaveDuration() + 100)
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-empty-state-inline"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="vibe-empty-state-badge"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="feed-behavior-status-bar"]').text()).not.toContain('no items available')
    expect(wrapper.get('[data-testid="feed-behavior-remove-all-button"]').attributes('disabled')).toBeUndefined()

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
    expect(wrapper.get('[data-testid="feed-behavior-fill-count-button"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="feed-behavior-fill-until-end-button"]').attributes('disabled')).toBeUndefined()

    await lockButton.trigger('click')
    await flushDom()

    expect(lockButton.text()).toContain('Unlock paging')
    expect(lockButton.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="feed-behavior-fill-count-button"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="feed-behavior-fill-until-end-button"]').attributes('disabled')).toBeDefined()

    await lockButton.trigger('click')
    await flushDom()

    expect(lockButton.text()).toContain('Lock paging')
    expect(lockButton.attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('[data-testid="feed-behavior-fill-count-button"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="feed-behavior-fill-until-end-button"]').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('renders the manual fill and auto-scroll footer controls', async () => {
    vi.useFakeTimers()
    setViewportWidth(1_280)

    const wrapper = mount(FeedBehaviorDemoPage)

    await vi.advanceTimersByTimeAsync(100)
    await flushDom()

    const fillCountButton = wrapper.get('[data-testid="feed-behavior-fill-count-button"]')
    const fillUntilEndButton = wrapper.get('[data-testid="feed-behavior-fill-until-end-button"]')
    const autoScrollButton = wrapper.get('[data-testid="feed-behavior-auto-scroll-button"]')

    expect(fillCountButton.text()).toContain('Fill 2')
    expect(fillUntilEndButton.text()).toContain('Fill to end')
    expect(wrapper.find('[data-testid="feed-behavior-cancel-fill-button"]').exists()).toBe(false)
    expect(autoScrollButton.text()).toContain('Auto scroll')
    expect(autoScrollButton.attributes('aria-pressed')).toBe('false')

    await fillCountButton.trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="feed-behavior-cancel-fill-button"]').text()).toContain('Cancel fill')

    await wrapper.get('[data-testid="feed-behavior-cancel-fill-button"]').trigger('click')
    await flushDom()

    expect(wrapper.find('[data-testid="feed-behavior-cancel-fill-button"]').exists()).toBe(false)

    await autoScrollButton.trigger('click')
    await flushDom()

    expect(autoScrollButton.text()).toContain('Stop scroll')
    expect(autoScrollButton.attributes('aria-pressed')).toBe('true')

    await autoScrollButton.trigger('click')
    await flushDom()

    expect(autoScrollButton.text()).toContain('Auto scroll')
    expect(autoScrollButton.attributes('aria-pressed')).toBe('false')

    wrapper.unmount()
  })

  it('updates the footer load progress bars from the Vibe scroll budget', async () => {
    vi.useFakeTimers()
    setViewportWidth(1_280)

    const wrapper = mount(FeedBehaviorDemoPage)

    await vi.advanceTimersByTimeAsync(100)
    await flushDom()

    const scrollViewport = wrapper.get('[data-testid="vibe-list-scroll"]').element as HTMLElement
    const listContent = wrapper.get('[data-testid="vibe-list-content"]').element as HTMLElement
    const contentHeight = Number.parseFloat(listContent.style.height)
    const viewportHeight = 700
    const maxScrollTop = contentHeight - viewportHeight
    const previousProgress = wrapper.get('[data-testid="feed-behavior-previous-boundary-progress"]')
    const nextProgress = wrapper.get('[data-testid="feed-behavior-next-boundary-progress"]')

    setScrollMetrics(scrollViewport, 20, viewportHeight, contentHeight)
    await wrapper.get('[data-testid="vibe-list-scroll"]').trigger('scroll')
    await flushDom()

    expect(Number(previousProgress.attributes('aria-valuenow'))).toBe(100)
    expect(Number(nextProgress.attributes('aria-valuenow'))).toBeLessThan(10)

    setScrollMetrics(scrollViewport, maxScrollTop - 1, viewportHeight, contentHeight)
    await wrapper.get('[data-testid="vibe-list-scroll"]').trigger('scroll')
    await flushDom()

    const previousNearBottom = Number(previousProgress.attributes('aria-valuenow'))
    const nextNearBottom = Number(nextProgress.attributes('aria-valuenow'))

    expect(previousNearBottom).toBeLessThan(50)
    expect(nextNearBottom).toBeGreaterThanOrEqual(95)
    expect(nextNearBottom).toBeLessThan(100)

    await vi.advanceTimersByTimeAsync(500)
    await flushDom()

    expect(wrapper.get('[data-testid="feed-behavior-status-total"]').text()).toContain('25')

    setScrollMetrics(scrollViewport, maxScrollTop, viewportHeight, contentHeight)
    await wrapper.get('[data-testid="vibe-list-scroll"]').trigger('scroll')
    await flushDom()

    expect(Number(nextProgress.attributes('aria-valuenow'))).toBe(100)

    setScrollMetrics(scrollViewport, maxScrollTop - 1, viewportHeight, contentHeight + 600)
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
