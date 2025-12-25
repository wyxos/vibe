import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Masonry from '../src/Masonry.vue'
import { createMockGetPage, getDefaultProps, defaultStubs, wait, createTestItem } from './helpers/testSetup'

describe('Masonry.vue - Error Handling Functionality', () => {
  const mockGetPage = createMockGetPage()

  it('should set loadError when loadPage fails', async () => {
    const errorMock = vi.fn().mockRejectedValue(new Error('Network error'))

    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        getPage: errorMock,
        retryMaxAttempts: 0 // Disable retries for faster test
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Initially loadError should be null
    expect(vm.loadError).toBeNull()

    // Try to load a page that will fail
    try {
      await vm.loadPage(1)
    } catch (error) {
      // Expected to throw
    }

    await wait(50)

    // loadError should be set
    expect(vm.loadError).not.toBeNull()
    expect(vm.loadError.message).toBe('Network error')
  })

  it('should set loadError when loadNext fails', async () => {
    let callCount = 0
    const errorMock = vi.fn().mockImplementation((page) => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          items: [createTestItem({ page })],
          nextPage: 2
        })
      }
      return Promise.reject(new Error('Load failed'))
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        getPage: errorMock,
        retryMaxAttempts: 0
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Load first page successfully
    await vm.loadPage(1)
    await wait(50)

    expect(vm.loadError).toBeNull()

    // Try to load next page that will fail
    try {
      await vm.loadNext()
    } catch (error) {
      // Expected to throw
    }

    await wait(50)

    // loadError should be set
    expect(vm.loadError).not.toBeNull()
    expect(vm.loadError.message).toBe('Load failed')
  })

  it('should clear loadError on successful load', async () => {
    let callCount = 0
    const errorThenSuccessMock = vi.fn().mockImplementation((page) => {
      callCount++
      if (callCount === 1) {
        return Promise.reject(new Error('First attempt failed'))
      }
      return Promise.resolve({
        items: [createTestItem({ id: callCount, src: `test${callCount}.jpg`, page })],
        nextPage: callCount + 1
      })
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        getPage: errorThenSuccessMock,
        retryMaxAttempts: 0
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // First load fails
    try {
      await vm.loadPage(1)
    } catch (error) {
      // Expected
    }

    await wait(50)

    expect(vm.loadError).not.toBeNull()

    // Reset the mock to succeed on next call
    errorThenSuccessMock.mockImplementation(() => Promise.resolve({
      items: [createTestItem({ id: 2, src: 'test2.jpg', page: 2 })],
      nextPage: 3
    }))

    // Load successfully
    await vm.loadPage(2)
    await wait(50)

    // loadError should be cleared
    expect(vm.loadError).toBeNull()
  })

  it('should reset loadError when reset() is called', async () => {
    const errorMock = vi.fn().mockRejectedValue(new Error('Network error'))

    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        getPage: errorMock,
        retryMaxAttempts: 0
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Cause an error
    try {
      await vm.loadPage(1)
    } catch (error) {
      // Expected
    }

    await wait(50)

    expect(vm.loadError).not.toBeNull()

    // Reset
    vm.reset()

    // loadError should be null
    expect(vm.loadError).toBeNull()
  })

  it('should set loadError when refreshCurrentPage fails', async () => {
    let callCount = 0
    const refreshErrorMock = vi.fn().mockImplementation((page) => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          items: [createTestItem({ page })],
          nextPage: 2
        })
      }
      return Promise.reject(new Error('Refresh failed'))
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        getPage: refreshErrorMock,
        retryMaxAttempts: 0
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Load first page successfully
    await vm.loadPage(1)
    await wait(50)

    // Try to refresh current page that will fail
    try {
      await vm.refreshCurrentPage()
    } catch (error) {
      // Expected to throw
    }

    await wait(50)

    // loadError should be set
    expect(vm.loadError).not.toBeNull()
    expect(vm.loadError.message).toBe('Refresh failed')
  })

  it('should display error message when loadError is set and items exist', async () => {
    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        items: [],
        init: 'manual'
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Set items via props and initialize pagination state
    const testItem = createTestItem()
    await wrapper.setProps({ items: [testItem] })
    vm.currentPage = 1
    vm.paginationHistory = [1, 2]
    vm.isInitialized = true
    await wrapper.vm.$nextTick()
    await wait(50)
    
    // Verify items were set
    expect(vm.totalItems).toBeGreaterThan(0)

    // Manually set loadError (Vue Test Utils unwraps refs, so set directly)
    vm.loadError = new Error('Test error message')
    await wrapper.vm.$nextTick()
    await wait(10)

    // Verify state
    expect(vm.loadError).not.toBeNull()
    expect(vm.totalItems).toBeGreaterThan(0)

    // Check that error message is displayed
    const html = wrapper.html()
    expect(html).toContain('Failed to load content')
    expect(html).toContain('Test error message')
  })

  it('should not display error message when items array is empty', async () => {
    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getPage: mockGetPage }),
      global: { stubs: defaultStubs }
    })

    // Wait for component to fully initialize (restoreItems may reset loadError)
    await wrapper.vm.$nextTick()
    await wait(10)

    const vm = wrapper.vm
    // Manually set loadError (Vue Test Utils unwraps refs, so set directly)
    vm.loadError = new Error('Test error')

    await wrapper.vm.$nextTick()

    // Error message should not be displayed when items array is empty
    const html = wrapper.html()
    expect(html).not.toContain('Failed to load content')
  })

  it('should allow custom error message via slot', async () => {
    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        items: [],
        init: 'manual'
      }),
      slots: {
        'error-message': '<div class="custom-error-message">Custom error: {{ error.message }}</div>'
      },
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Set items via props and initialize pagination state
    const testItem = createTestItem()
    await wrapper.setProps({ items: [testItem] })
    vm.currentPage = 1
    vm.paginationHistory = [1, 2]
    vm.isInitialized = true
    await wrapper.vm.$nextTick()
    await wait(50)
    
    // Verify items were set
    expect(vm.totalItems).toBeGreaterThan(0)

    // Manually set loadError (Vue Test Utils unwraps refs, so set directly)
    vm.loadError = new Error('Custom error')
    await wrapper.vm.$nextTick()
    await wait(10)

    // Verify state
    expect(vm.loadError).not.toBeNull()
    expect(vm.totalItems).toBeGreaterThan(0)

    // Check that custom error message is displayed
    const html = wrapper.html()
    expect(html).toContain('Custom error: Custom error')
  })

  it('should handle non-Error objects in loadError', async () => {
    const errorMock = vi.fn().mockRejectedValue('String error')

    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        getPage: errorMock,
        retryMaxAttempts: 0
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Try to load a page that will fail with a non-Error
    try {
      await vm.loadPage(1)
    } catch (error) {
      // Expected to throw
    }

    await wait(50)

    // loadError should be set and converted to Error
    expect(vm.loadError).not.toBeNull()
    expect(vm.loadError).toBeInstanceOf(Error)
    expect(vm.loadError.message).toBe('String error')
  })

  it('should clear loadError when attempting to load next after error', async () => {
    let callCount = 0
    const errorThenSuccessMock = vi.fn().mockImplementation((page) => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          items: [createTestItem({ page })],
          nextPage: 2
        })
      }
      if (callCount === 2) {
        return Promise.reject(new Error('Load failed'))
      }
      return Promise.resolve({
        items: [createTestItem({ id: 3, src: 'test3.jpg', page })],
        nextPage: 4
      })
    })

    const wrapper = mount(Masonry, {
      props: getDefaultProps({
        getPage: errorThenSuccessMock,
        retryMaxAttempts: 0
      }),
      global: { stubs: defaultStubs }
    })

    const vm = wrapper.vm

    // Load first page successfully
    await vm.loadPage(1)
    await wait(50)

    // Load next page that fails
    try {
      await vm.loadNext()
    } catch (error) {
      // Expected
    }

    await wait(50)

    expect(vm.loadError).not.toBeNull()

    // Attempt to load next again (should clear error and succeed)
    await vm.loadNext()
    await wait(50)

    // loadError should be cleared on successful load
    expect(vm.loadError).toBeNull()
  })
})

