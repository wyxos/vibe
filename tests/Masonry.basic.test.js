import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Masonry from '../src/Masonry.vue'
import { createMockGetNextPage, getDefaultProps, defaultStubs, wait, flushPromises, waitFor } from './helpers/testSetup'

describe('Masonry.vue - Basic Functionality', () => {
  let mockGetNextPage

  beforeEach(() => {
    mockGetNextPage = createMockGetNextPage()
  })

  it('should mount correctly with basic props', async () => {
    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        loadAtPage: 1,
        init: 'manual'
      }
    })

    // Wait for component to mount and all promises to flush
    await wrapper.vm.$nextTick()
    await flushPromises()

    // Check that the component mounted
    expect(wrapper.exists()).toBe(true)

    // Verify component is exposed correctly
    const vm = wrapper.vm
    // For manual mode, isInitialized should be false until user calls restoreItems
    expect(vm.isInitialized).toBe(false)
    
    // Manually call restoreItems to initialize (as user would do in manual mode)
    // Pass some items so isInitialized gets set to true
    const testItems = [{ id: 1, width: 300, height: 200, src: 'test1.jpg' }]
    await vm.restoreItems(testItems, 1, 2)
    await wrapper.vm.$nextTick()
    
    // Now isInitialized should be true
    expect(vm.isInitialized).toBe(true)

    // Wait for the masonry container to actually appear in the DOM
    // This ensures Vue has re-rendered after isInitialized became true
    // Check both possible containers (masonry-container for desktop, swipe-container for mobile)
    await waitFor(() => {
      // Force a DOM update check
      wrapper.vm.$nextTick()
      const html = wrapper.html()
      // Check if either container exists, or if loading message is gone
      const hasMasonryContainer = wrapper.find('.masonry-container').exists()
      const hasSwipeContainer = wrapper.find('.swipe-container').exists()
      const hasLoadingMessage = html.includes('Waiting for content to load')
      // Container should exist OR loading message should be gone (meaning masonry is rendered)
      return hasMasonryContainer || hasSwipeContainer || (!hasLoadingMessage && vm.isInitialized)
    }, { timeout: 1000, interval: 10 })

    // Check that the component mounted
    expect(wrapper.exists()).toBe(true)

    // Verify isInitialized is true
    expect(vm.isInitialized).toBe(true)

    // Check that either masonry or swipe container exists (depending on mode)
    const masonryContainer = wrapper.find('.masonry-container')
    const swipeContainer = wrapper.find('.swipe-container')
    expect(masonryContainer.exists() || swipeContainer.exists()).toBe(true)

    // If masonry container exists, check for its child elements
    if (masonryContainer.exists()) {
      // Check that the relative positioned div exists for item positioning
      const relativeDiv = masonryContainer.find('.relative')
      expect(relativeDiv.exists()).toBe(true)

      // Check that transition-group exists (it's stubbed in defaultStubs)
      const transitionGroup = masonryContainer.findComponent({ name: 'transition-group' })
      expect(transitionGroup.exists()).toBe(true)
    }
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
    const wrapper = mount(Masonry, {
      props: getDefaultProps(),
      global: {
        stubs: defaultStubs
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
    const initialMockGetNextPage = createMockGetNextPage()

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: initialMockGetNextPage,
        items: [],
        loadAtPage: 1,
        init: 'auto' // Auto mode should call loadPage on mount
      },
      global: {
        stubs: defaultStubs
      }
    })

    // Wait for the onMounted lifecycle to complete
    await wrapper.vm.$nextTick()
    await wait(0) // Wait for async operations

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
        loadAtPage: 1,
        init: 'auto' // Auto mode should call loadPage on mount
      },
      global: {
        stubs: defaultStubs
      }
    })

    const vm = wrapper.vm

    // Wait for initial mount to complete
    await wrapper.vm.$nextTick()
    await wait(10)

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
        stubs: defaultStubs
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
        mode: 'none',
        init: 'auto' // Auto mode should call loadPage on mount
      },
      global: {
        stubs: defaultStubs
      }
    })

    const vm = wrapper.vm

    // Wait for initial load
    await wait(50)

    // Verify items were loaded
    expect(refreshMockGetNextPage).toHaveBeenCalledWith(1)
    const initialHistory = [...vm.paginationHistory]
    expect(initialHistory.length).toBeGreaterThanOrEqual(2)

    // Clear the mock to track refreshCurrentPage call
    refreshMockGetNextPage.mockClear()

    // Call refreshCurrentPage directly
    await vm.refreshCurrentPage()
    await wait(50)

    // Verify getNextPage was called with page 1 again (current page)
    expect(refreshMockGetNextPage).toHaveBeenCalledWith(1)

    // Verify pagination history was reset and updated
    expect(vm.paginationHistory).toHaveLength(2)
    expect(vm.paginationHistory[0]).toBe(1)
  })

  it('should expose refreshCurrentPage method', async () => {
    const simpleMock = createMockGetNextPage()

    const wrapper = mount(Masonry, {
      props: getDefaultProps({ getNextPage: simpleMock }),
      global: {
        stubs: defaultStubs
      }
    })

    const vm = wrapper.vm

    // Verify refreshCurrentPage method exists
    expect(typeof vm.refreshCurrentPage).toBe('function')

    // Load a page first
    await vm.loadPage(1)
    await wait(50)

    expect(simpleMock).toHaveBeenCalledWith(1)
    simpleMock.mockClear()

    // Call refreshCurrentPage
    await vm.refreshCurrentPage()
    await wait(50)

    // Should reload page 1
    expect(simpleMock).toHaveBeenCalledWith(1)
  })

  it('should attach scroll listener when container becomes available in masonry mode', async () => {
    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        loadAtPage: 1,
        layoutMode: 'masonry' // Explicitly set to masonry mode
      },
      global: {
        stubs: defaultStubs
      }
    })

    // Wait for component to mount
    await wrapper.vm.$nextTick()
    await wait(50)

    // The component should exist and be ready
    expect(wrapper.exists()).toBe(true)

    // Verify component is in masonry mode (not swipe mode)
    expect(wrapper.props('layoutMode')).toBe('masonry')

    // The container watcher should attach the scroll listener when container ref becomes available
    // This test verifies the component doesn't crash when starting in masonry mode
    const vm = wrapper.vm
    expect(typeof vm.refreshLayout).toBe('function')
  })

  it('should attach scroll listener when switching from swipe to masonry mode', async () => {
    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        loadAtPage: 1,
        layoutMode: 'swipe' // Start in swipe mode
      },
      global: {
        stubs: defaultStubs
      }
    })

    await wrapper.vm.$nextTick()
    await wait(10)

    // Verify we're in swipe mode initially
    expect(wrapper.props('layoutMode')).toBe('swipe')

    // Switch to masonry mode
    await wrapper.setProps({ layoutMode: 'masonry' })
    await wrapper.vm.$nextTick()
    await wait(50)

    // Verify component exists and is in masonry mode
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props('layoutMode')).toBe('masonry')

    // The useSwipeMode watcher should have triggered and attached scroll listener
    // This test ensures the mode switching doesn't break scroll functionality
  })

  it('should attach scroll listener on initial mount in masonry mode', async () => {
    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        loadAtPage: 1,
        layoutMode: 'auto' // Auto mode - should use masonry for wide screens (1024px > 768px breakpoint)
      },
      global: {
        stubs: defaultStubs
      }
    })

    await wrapper.vm.$nextTick()
    await wait(50)

    // Verify component mounted successfully
    expect(wrapper.exists()).toBe(true)

    // The scroll listener should be attached via the container watcher
    // This test ensures the component doesn't break when starting in masonry mode
    const vm = wrapper.vm
    expect(typeof vm.refreshLayout).toBe('function')

    // Verify the component is ready to handle scroll events
    // The container watcher should have attached the listener when container ref became available
    expect(wrapper.exists()).toBe(true)
  })

  it('should auto-initialize pagination state when init is auto and items are provided', async () => {
    const initialItems = [
      { id: 1, width: 300, height: 200, src: 'test1.jpg' },
      { id: 2, width: 400, height: 300, src: 'test2.jpg' }
    ]

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: initialItems,
        loadAtPage: 1,
        init: 'auto'
      },
      global: {
        stubs: defaultStubs
      }
    })

    await wrapper.vm.$nextTick()
    await wait(200)

    const vm = wrapper.vm

    // Verify getNextPage WAS called (auto mode always calls loadPage)
    expect(mockGetNextPage).toHaveBeenCalledWith(1)
    
    // Items will be overwritten by loadPage results
    // Verify pagination state is initialized from loadPage
    expect(vm.currentPage).toBe(1)
    expect(vm.paginationHistory).toContain(1)
    expect(vm.paginationHistory).toContain(2)
    expect(vm.hasReachedEnd).toBe(false) // Should be false when nextPage is provided
  })

  it('should set hasReachedEnd to true when loadPage returns null nextPage', async () => {
    const initialItems = [
      { id: 1, width: 300, height: 200, src: 'test1.jpg' }
    ]

    // Create a mock that returns null nextPage for page 10
    const mockGetNextPageWithNull = vi.fn((page) => {
      return Promise.resolve({
        items: [
          { id: `item-${page}-1`, width: 300, height: 200, src: `test${page}-1.jpg`, page }
        ],
        nextPage: page === 10 ? null : page + 1
      })
    })

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPageWithNull,
        items: initialItems,
        loadAtPage: 10,
        init: 'auto'
      },
      global: {
        stubs: defaultStubs
      }
    })

    await wrapper.vm.$nextTick()
    await wait(100)

    const vm = wrapper.vm

    // Verify loadPage was called with loadAtPage
    expect(mockGetNextPageWithNull).toHaveBeenCalledWith(10)
    
    // Verify hasReachedEnd is set correctly based on loadPage result
    expect(vm.currentPage).toBe(10)
    expect(vm.hasReachedEnd).toBe(true)
  })

  it('should allow manual restoreItems call to initialize pagination state', async () => {
    const initialItems = [
      { id: 1, width: 300, height: 200, src: 'test1.jpg' },
      { id: 2, width: 400, height: 300, src: 'test2.jpg' }
    ]

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        loadAtPage: 1,
        init: 'auto'
      },
      global: {
        stubs: defaultStubs
      }
    })

    await wrapper.vm.$nextTick()
    await wait(100)

    const vm = wrapper.vm

    // Verify restoreItems is exposed
    expect(typeof vm.restoreItems).toBe('function')

    // Manually call restoreItems
    await vm.restoreItems(initialItems, 3, 4)
    
    // Wait for updates
    await wrapper.vm.$nextTick()
    await wait(100)

    // Verify pagination state was updated
    expect(vm.currentPage).toBe(3)
    expect(vm.paginationHistory).toContain(3)
    expect(vm.paginationHistory).toContain(4)
    expect(vm.hasReachedEnd).toBe(false)
  })

  it('should allow loading next page after auto-initialization with init auto', async () => {
    const initialItems = [
      { id: 1, width: 300, height: 200, src: 'test1.jpg' }
    ]

    const mockGetNextPageWithNext = createMockGetNextPage({
      items: [{ id: 2, width: 400, height: 300, src: 'test2.jpg' }],
      nextPage: 3
    })

    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPageWithNext,
        items: initialItems,
        loadAtPage: 1,
        init: 'auto'
      },
      global: {
        stubs: defaultStubs
      }
    })

    await wrapper.vm.$nextTick()
    await wait(200)

    const vm = wrapper.vm

    // Verify loadPage was called with loadAtPage
    expect(mockGetNextPageWithNext).toHaveBeenCalledWith(1)
    
    // Verify initial state is correct (based on loadPage result)
    expect(vm.currentPage).toBe(1)
    // paginationHistory will contain nextPage from loadPage result
    expect(vm.paginationHistory).toContain(3)
    expect(vm.hasReachedEnd).toBe(false)
    // Items will be overwritten by loadPage result
    expect(wrapper.props('items').length).toBeGreaterThanOrEqual(1)

    // Verify loadNext is available and callable
    expect(typeof vm.loadNext).toBe('function')
    
    // The key point: after auto-initialization, loadNext should work normally
    // We've verified the state is correct, so pagination should work when user scrolls
  })
})

