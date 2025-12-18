import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Masonry from '../src/Masonry.vue'
import { createMockGetNextPage, getDefaultProps, defaultStubs, wait, createTestItem } from './helpers/testSetup'

describe('Masonry.vue - End of List Functionality', () => {
  const mockGetNextPage = createMockGetNextPage()

  it('should set hasReachedEnd to true when nextPage is null in loadPage', async () => {
    const endOfListMock = vi.fn().mockResolvedValue({
      items: [createTestItem()],
      nextPage: null
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getNextPage: endOfListMock }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Initially hasReachedEnd should be false
    expect(vm.hasReachedEnd).toBe(false)

    // Load a page with null nextPage
    await vm.loadPage(1)
    await wait(50)

    // hasReachedEnd should now be true
    expect(vm.hasReachedEnd).toBe(true)
    expect(endOfListMock).toHaveBeenCalledWith(1)
  })

  it('should set hasReachedEnd to true when nextPage is null in loadNext', async () => {
    let callCount = 0
    const endOfListMock = vi.fn().mockImplementation((page) => {
      callCount++
      return Promise.resolve({
        items: [createTestItem({ id: callCount, src: `test${callCount}.jpg`, page })],
        nextPage: callCount === 1 ? 2 : null
      })
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getNextPage: endOfListMock }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Load first page
    await vm.loadPage(1)
    await wait(50)

    expect(vm.hasReachedEnd).toBe(false)

    // Load next page (which will return null nextPage)
    await vm.loadNext()
    await wait(50)

    // hasReachedEnd should now be true
    expect(vm.hasReachedEnd).toBe(true)
  })

  it('should not load next page if hasReachedEnd is true', async () => {
    let callCount = 0
    const endOfListMock = vi.fn().mockImplementation((page) => {
      callCount++
      return Promise.resolve({
        items: [createTestItem({ id: callCount, src: `test${callCount}.jpg`, page })],
        nextPage: callCount === 1 ? 2 : null
      })
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getNextPage: endOfListMock }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Load first page
    await vm.loadPage(1)
    await wait(50)

    // Load next page (which will return null nextPage)
    await vm.loadNext()
    await wait(50)

    expect(vm.hasReachedEnd).toBe(true)
    const callCountBefore = callCount

    // Try to load next again - should not call getNextPage
    await vm.loadNext()
    await wait(50)

    // Call count should not have increased
    expect(callCount).toBe(callCountBefore)
  })

  it('should reset hasReachedEnd when reset() is called', async () => {
    const endOfListMock = vi.fn().mockResolvedValue({
      items: [createTestItem()],
      nextPage: null
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getNextPage: endOfListMock }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Load a page with null nextPage
    await vm.loadPage(1)
    await wait(50)

    expect(vm.hasReachedEnd).toBe(true)

    // Reset
    vm.reset()

    // hasReachedEnd should be false again
    expect(vm.hasReachedEnd).toBe(false)
  })

  it('should reset hasReachedEnd when refreshCurrentPage is called', async () => {
    let callCount = 0
    const refreshMock = vi.fn().mockImplementation((page) => {
      callCount++
      return Promise.resolve({
        items: [createTestItem({ id: callCount, src: `test${callCount}.jpg`, page })],
        nextPage: callCount === 1 ? null : 2
      })
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getNextPage: refreshMock }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Load first page (which returns null nextPage)
    await vm.loadPage(1)
    await wait(50)

    expect(vm.hasReachedEnd).toBe(true)

    // Refresh current page (which now returns nextPage: 2)
    refreshMock.mockImplementation(() => Promise.resolve({
      items: [createTestItem({ id: 2, src: 'test2.jpg' })],
      nextPage: 2
    }))

    await vm.refreshCurrentPage()
    await wait(50)

    // hasReachedEnd should be false if nextPage is not null
    expect(vm.hasReachedEnd).toBe(false)
  })

  it('should display end message when hasReachedEnd is true and items exist', async () => {
    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        items: [createTestItem()]
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Manually set hasReachedEnd to true and ensure items exist
    vm.hasReachedEnd = true
    await wrapper.vm.$nextTick()

    // Verify state
    expect(vm.hasReachedEnd).toBe(true)
    expect(vm.totalItems).toBeGreaterThan(0)

    // Check that end message is displayed - look for the text content
    const html = wrapper.html()
    expect(html).toContain("You've reached the end")
  })

  it('should not display end message when items array is empty', async () => {
    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getNextPage: mockGetNextPage }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm
    // Manually set hasReachedEnd to true
    vm.hasReachedEnd = true

    await wrapper.vm.$nextTick()

    // End message should not be displayed when items array is empty
    const endMessage = wrapper.find('.text-center')
    // The end message should not exist when masonry.length is 0
    expect(endMessage.exists()).toBe(false)
  })

  it('should allow custom end message via slot', async () => {
    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        items: [createTestItem()]
      }),
      slots: {
        'end-message': '<div class="custom-end-message">Custom end message</div>'
      },
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Manually set hasReachedEnd to true and ensure items exist
    vm.hasReachedEnd = true
    await wrapper.vm.$nextTick()

    // Verify state
    expect(vm.hasReachedEnd).toBe(true)
    expect(vm.totalItems).toBeGreaterThan(0)

    // Check that custom end message is displayed
    const html = wrapper.html()
    expect(html).toContain('Custom end message')
  })

  it('should set hasReachedEnd when init is called with null next', () => {
    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getNextPage: mockGetNextPage }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    const items = [createTestItem()]

    // Init with null next
    vm.init(items, 1, null)

    expect(vm.hasReachedEnd).toBe(true)
  })

  it('should not set hasReachedEnd when init is called with non-null next', () => {
    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getNextPage: mockGetNextPage }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    const items = [createTestItem()]

    // Init with non-null next
    vm.init(items, 1, 2)

    expect(vm.hasReachedEnd).toBe(false)
  })

  it('should not backfill when hasReachedEnd is true', async () => {
    let callCount = 0
    const backfillMock = vi.fn().mockImplementation((page) => {
      callCount++
      return Promise.resolve({
        items: [createTestItem({ id: callCount, src: `test${callCount}.jpg`, page })],
        nextPage: callCount === 1 ? 2 : null
      })
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        getNextPage: backfillMock,
        backfillEnabled: true,
        pageSize: 10
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Load first page
    await vm.loadPage(1)
    await wait(50)

    // Load next page (which will return null nextPage)
    await vm.loadNext()
    await wait(100)

    expect(vm.hasReachedEnd).toBe(true)
    const callCountBefore = callCount

    // Try to trigger backfill - should not call getNextPage
    await vm.maybeBackfillToTarget(5, true)
    await wait(50)

    // Call count should not have increased
    expect(callCount).toBe(callCountBefore)
  })
})

