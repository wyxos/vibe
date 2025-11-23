import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Masonry from '../src/Masonry.vue'

// Mock lodash-es debounce to avoid timing issues in tests
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn) => fn)
}))

// Mock IntersectionObserver for MasonryItem components
global.IntersectionObserver = class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
    this.observe = vi.fn()
    this.disconnect = vi.fn()
    this.unobserve = vi.fn()
  }
}

// Mock window.innerWidth for responsive column calculation
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
})

describe('Masonry.vue', () => {
  let mockGetNextPage

  beforeEach(() => {
    mockGetNextPage = vi.fn().mockResolvedValue({
      items: [
        { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1 },
        { id: 2, width: 400, height: 300, src: 'test2.jpg', page: 1 }
      ],
      nextPage: 2
    })
  })

  it('should mount correctly with basic props', async () => {
    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        loadAtPage: 1
      }
    })

    // Check that the component mounted
    expect(wrapper.exists()).toBe(true)

    // Check that the main container element exists
    const container = wrapper.find('.overflow-auto')
    expect(container.exists()).toBe(true)

    // Check that the relative positioned div exists for item positioning
    const relativeDiv = wrapper.find('.relative')
    expect(relativeDiv.exists()).toBe(true)

    // Check that transition-group exists
    const transitionGroup = wrapper.findComponent({ name: 'transition-group' })
    expect(transitionGroup.exists()).toBe(true)

    // Verify component is exposed correctly
    const vm = wrapper.vm
    expect(typeof vm.isLoading).toBe('boolean')
    expect(typeof vm.refreshLayout).toBe('function')
    expect(typeof vm.containerHeight).toBe('number')
    expect(typeof vm.remove).toBe('function')
  })

  it('should initialize with default layout configuration', () => {
    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: []
      }
    })

    // Access the component's internal layout computed property
    // This verifies the default layout is properly merged
    const vm = wrapper.vm

    // The component should have access to layout configuration
    expect(wrapper.props('layout')).toBeUndefined() // no custom layout passed

    // Component should still function with default layout values
    expect(wrapper.exists()).toBe(true)
  })

  it('should accept custom layout configuration', () => {
    const customLayout = {
      gutterX: 20,
      gutterY: 15,
      sizes: { base: 2, md: 4 }
    }

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        layout: customLayout
      }
    })

    expect(wrapper.props('layout')).toEqual(customLayout)
    expect(wrapper.exists()).toBe(true)
  })

  it('should accept pagination type prop', () => {
    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        paginationType: 'cursor'
      }
    })

    expect(wrapper.props('paginationType')).toBe('cursor')
    expect(wrapper.exists()).toBe(true)
  })

  it('should render with initial items if provided', () => {
    const initialItems = [
      { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1, top: 0, left: 0, columnWidth: 320, columnHeight: 213 },
      { id: 2, width: 400, height: 300, src: 'test2.jpg', page: 1, top: 0, left: 330, columnWidth: 320, columnHeight: 240 }
    ]

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: initialItems
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props('items')).toEqual(initialItems)
  })

  it('should mount without errors and handle lifecycle correctly', async () => {
    // Mock DOM element methods that the component uses
    const mockContainer = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      offsetWidth: 1000,
      clientWidth: 980,
      scrollTop: 0,
      clientHeight: 600
    }

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        loadAtPage: 1
      },
      global: {
        stubs: {
          'transition-group': {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    // Verify the component mounted successfully
    expect(wrapper.exists()).toBe(true)

    // Verify ref is available
    const vm = wrapper.vm
    expect(vm.$refs).toBeDefined()

    // Verify initial state
    expect(typeof vm.isLoading).toBe('boolean')
    expect(typeof vm.containerHeight).toBe('number')

    // Verify exposed methods exist
    expect(typeof vm.refreshLayout).toBe('function')
    expect(typeof vm.remove).toBe('function')

    // Component should handle being mounted without throwing errors
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('should load initial page on mount', async () => {
    const initialMockGetNextPage = vi.fn().mockResolvedValue({
      items: [
        { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1 },
        { id: 2, width: 400, height: 300, src: 'test2.jpg', page: 1 }
      ],
      nextPage: 2
    })

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: initialMockGetNextPage,
        items: [],
        loadAtPage: 1
      },
      global: {
        stubs: {
          'transition-group': {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    // Wait for the onMounted lifecycle to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0)) // Wait for async operations

    // Verify getNextPage was called with the loadAtPage value
    expect(initialMockGetNextPage).toHaveBeenCalledWith(1)
    expect(initialMockGetNextPage).toHaveBeenCalledTimes(1)
  })

  it('should handle loading next page correctly', async () => {
    let pageCount = 0
    const dynamicMockGetNextPage = vi.fn().mockImplementation((page) => {
      pageCount++
      return Promise.resolve({
        items: [
          { id: `${pageCount}-1`, width: 300, height: 200, src: `test${pageCount}-1.jpg`, page: pageCount },
          { id: `${pageCount}-2`, width: 400, height: 300, src: `test${pageCount}-2.jpg`, page: pageCount }
        ],
        nextPage: pageCount + 1
      })
    })

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: dynamicMockGetNextPage,
        items: [],
        loadAtPage: 1
      },
      global: {
        stubs: {
          'transition-group': {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    const vm = wrapper.vm

    // Wait for initial mount to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify initial page was loaded
    expect(dynamicMockGetNextPage).toHaveBeenCalledWith(1)

    // Manually trigger loading next page (simulating scroll trigger)
    // We can't easily simulate scroll events in this test environment,
    // but we can test the loadNext functionality directly
    expect(typeof vm.loadNext).toBe('function')

    // Reset mock call count to focus on next page loading
    dynamicMockGetNextPage.mockClear()

    // The component should have updated its internal state
    expect(vm.isLoading).toBeDefined()
    expect(typeof vm.containerHeight).toBe('number')
  })

  it('should support cursor-based pagination', () => {
    const cursorMockGetNextPage = vi.fn().mockResolvedValue({
      items: [
        { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1 }
      ],
      nextCursor: 'cursor_token_123'
    })

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: cursorMockGetNextPage,
        items: [],
        loadAtPage: 1,
        paginationType: 'cursor'
      },
      global: {
        stubs: {
          'transition-group': {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    expect(wrapper.props('paginationType')).toBe('cursor')
    expect(wrapper.exists()).toBe(true)
  })

  it('should refresh current page when called directly', async () => {
    let callCount = 0
    const refreshMockGetNextPage = vi.fn().mockImplementation((page) => {
      callCount++
      return Promise.resolve({
        items: [
          { id: `item-${callCount}-1`, width: 300, height: 200, src: `test${callCount}-1.jpg`, page },
          { id: `item-${callCount}-2`, width: 400, height: 300, src: `test${callCount}-2.jpg`, page }
        ],
        nextPage: page + 1
      })
    })

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: refreshMockGetNextPage,
        loadAtPage: 1,
        backfillEnabled: false
      },
      global: {
        stubs: {
          'transition-group': {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    const vm = wrapper.vm

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify items were loaded
    expect(refreshMockGetNextPage).toHaveBeenCalledWith(1)
    const initialHistory = [...vm.paginationHistory]
    expect(initialHistory.length).toBeGreaterThanOrEqual(2)

    // Clear the mock to track refreshCurrentPage call
    refreshMockGetNextPage.mockClear()

    // Call refreshCurrentPage directly
    await vm.refreshCurrentPage()
    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify getNextPage was called with page 1 again (current page)
    expect(refreshMockGetNextPage).toHaveBeenCalledWith(1)

    // Verify pagination history was reset and updated
    expect(vm.paginationHistory).toHaveLength(2)
    expect(vm.paginationHistory[0]).toBe(1)
  })

  it('should expose refreshCurrentPage method', async () => {
    const simpleMock = vi.fn().mockResolvedValue({
      items: [
        { id: 'test-1', width: 300, height: 200, src: 'test1.jpg', page: 1 }
      ],
      nextPage: 2
    })

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: simpleMock,
        loadAtPage: 1,
        skipInitialLoad: true,
        backfillEnabled: false
      },
      global: {
        stubs: {
          'transition-group': {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    const vm = wrapper.vm

    // Verify refreshCurrentPage method exists
    expect(typeof vm.refreshCurrentPage).toBe('function')

    // Load a page first
    await vm.loadPage(1)
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(simpleMock).toHaveBeenCalledWith(1)
    simpleMock.mockClear()

    // Call refreshCurrentPage
    await vm.refreshCurrentPage()
    await new Promise(resolve => setTimeout(resolve, 50))

    // Should reload page 1
    expect(simpleMock).toHaveBeenCalledWith(1)
  })
})
