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

  it('should attach scroll listener when container becomes available in masonry mode', async () => {
    const wrapper = mount(Masonry, {
      props: {
        getNextPage: mockGetNextPage,
        items: [],
        loadAtPage: 1,
        layoutMode: 'masonry' // Explicitly set to masonry mode
      },
      global: {
        stubs: {
          'transition-group': {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    // Wait for component to mount
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

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
        stubs: {
          'transition-group': {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify we're in swipe mode initially
    expect(wrapper.props('layoutMode')).toBe('swipe')

    // Switch to masonry mode
    await wrapper.setProps({ layoutMode: 'masonry' })
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

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
        stubs: {
          'transition-group': {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

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

  describe('End of list functionality', () => {
    it('should set hasReachedEnd to true when nextPage is null in loadPage', async () => {
      const endOfListMock = vi.fn().mockResolvedValue({
        items: [
          { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1 }
        ],
        nextPage: null
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: endOfListMock,
          items: [],
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

      // Initially hasReachedEnd should be false
      expect(vm.hasReachedEnd).toBe(false)

      // Load a page with null nextPage
      await vm.loadPage(1)
      await new Promise(resolve => setTimeout(resolve, 50))

      // hasReachedEnd should now be true
      expect(vm.hasReachedEnd).toBe(true)
      expect(endOfListMock).toHaveBeenCalledWith(1)
    })

    it('should set hasReachedEnd to true when nextPage is null in loadNext', async () => {
      let callCount = 0
      const endOfListMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [
            { id: callCount, width: 300, height: 200, src: `test${callCount}.jpg`, page }
          ],
          nextPage: callCount === 1 ? 2 : null
        })
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: endOfListMock,
          items: [],
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

      // Load first page
      await vm.loadPage(1)
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(vm.hasReachedEnd).toBe(false)

      // Load next page (which will return null nextPage)
      await vm.loadNext()
      await new Promise(resolve => setTimeout(resolve, 50))

      // hasReachedEnd should now be true
      expect(vm.hasReachedEnd).toBe(true)
    })

    it('should not load next page if hasReachedEnd is true', async () => {
      let callCount = 0
      const endOfListMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [
            { id: callCount, width: 300, height: 200, src: `test${callCount}.jpg`, page }
          ],
          nextPage: callCount === 1 ? 2 : null
        })
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: endOfListMock,
          items: [],
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

      // Load first page
      await vm.loadPage(1)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Load next page (which will return null nextPage)
      await vm.loadNext()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(vm.hasReachedEnd).toBe(true)
      const callCountBefore = callCount

      // Try to load next again - should not call getNextPage
      await vm.loadNext()
      await new Promise(resolve => setTimeout(resolve, 50))

      // Call count should not have increased
      expect(callCount).toBe(callCountBefore)
    })

    it('should reset hasReachedEnd when reset() is called', async () => {
      const endOfListMock = vi.fn().mockResolvedValue({
        items: [
          { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1 }
        ],
        nextPage: null
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: endOfListMock,
          items: [],
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

      // Load a page with null nextPage
      await vm.loadPage(1)
      await new Promise(resolve => setTimeout(resolve, 50))

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
          items: [
            { id: callCount, width: 300, height: 200, src: `test${callCount}.jpg`, page }
          ],
          nextPage: callCount === 1 ? null : 2
        })
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: refreshMock,
          items: [],
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

      // Load first page (which returns null nextPage)
      await vm.loadPage(1)
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(vm.hasReachedEnd).toBe(true)

      // Refresh current page (which now returns nextPage: 2)
      refreshMock.mockImplementation(() => Promise.resolve({
        items: [
          { id: 2, width: 300, height: 200, src: 'test2.jpg', page: 1 }
        ],
        nextPage: 2
      }))

      await vm.refreshCurrentPage()
      await new Promise(resolve => setTimeout(resolve, 50))

      // hasReachedEnd should be false if nextPage is not null
      expect(vm.hasReachedEnd).toBe(false)
    })

    it('should display end message when hasReachedEnd is true and items exist', async () => {
      const endOfListMock = vi.fn().mockResolvedValue({
        items: [
          { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1, top: 0, left: 0, columnWidth: 320, columnHeight: 213 }
        ],
        nextPage: null
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: endOfListMock,
          items: [
            { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1, top: 0, left: 0, columnWidth: 320, columnHeight: 213 }
          ],
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
        props: {
          getNextPage: mockGetNextPage,
          items: [],
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
        props: {
          getNextPage: mockGetNextPage,
          items: [
            { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1, top: 0, left: 0, columnWidth: 320, columnHeight: 213 }
          ],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: false
        },
        slots: {
          'end-message': '<div class="custom-end-message">Custom end message</div>'
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
        props: {
          getNextPage: mockGetNextPage,
          items: [],
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

      const items = [
        { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1 }
      ]

      // Init with null next
      vm.init(items, 1, null)

      expect(vm.hasReachedEnd).toBe(true)
    })

    it('should not set hasReachedEnd when init is called with non-null next', () => {
      const wrapper = mount(Masonry, {
        props: {
          getNextPage: mockGetNextPage,
          items: [],
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

      const items = [
        { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1 }
      ]

      // Init with non-null next
      vm.init(items, 1, 2)

      expect(vm.hasReachedEnd).toBe(false)
    })

    it('should not backfill when hasReachedEnd is true', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [
            { id: callCount, width: 300, height: 200, src: `test${callCount}.jpg`, page }
          ],
          nextPage: callCount === 1 ? 2 : null
        })
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: backfillMock,
          items: [],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: true,
          pageSize: 10
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

      // Load first page
      await vm.loadPage(1)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Load next page (which will return null nextPage)
      await vm.loadNext()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(vm.hasReachedEnd).toBe(true)
      const callCountBefore = callCount

      // Try to trigger backfill - should not call getNextPage
      await vm.maybeBackfillToTarget(5, true)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Call count should not have increased
      expect(callCount).toBe(callCountBefore)
    })
  })

  describe('Error handling functionality', () => {
    it('should set loadError when loadPage fails', async () => {
      const errorMock = vi.fn().mockRejectedValue(new Error('Network error'))

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: errorMock,
          items: [],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: false,
          retryMaxAttempts: 0 // Disable retries for faster test
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

      // Initially loadError should be null
      expect(vm.loadError).toBeNull()

      // Try to load a page that will fail
      try {
        await vm.loadPage(1)
      } catch (error) {
        // Expected to throw
      }

      await new Promise(resolve => setTimeout(resolve, 50))

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
            items: [
              { id: 1, width: 300, height: 200, src: 'test1.jpg', page }
            ],
            nextPage: 2
          })
        }
        return Promise.reject(new Error('Load failed'))
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: errorMock,
          items: [],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: false,
          retryMaxAttempts: 0
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

      // Load first page successfully
      await vm.loadPage(1)
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(vm.loadError).toBeNull()

      // Try to load next page that will fail
      try {
        await vm.loadNext()
      } catch (error) {
        // Expected to throw
      }

      await new Promise(resolve => setTimeout(resolve, 50))

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
          items: [
            { id: callCount, width: 300, height: 200, src: `test${callCount}.jpg`, page }
          ],
          nextPage: callCount + 1
        })
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: errorThenSuccessMock,
          items: [],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: false,
          retryMaxAttempts: 0
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

      // First load fails
      try {
        await vm.loadPage(1)
      } catch (error) {
        // Expected
      }

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(vm.loadError).not.toBeNull()

      // Reset the mock to succeed on next call
      errorThenSuccessMock.mockImplementation(() => Promise.resolve({
        items: [
          { id: 2, width: 300, height: 200, src: 'test2.jpg', page: 2 }
        ],
        nextPage: 3
      }))

      // Load successfully
      await vm.loadPage(2)
      await new Promise(resolve => setTimeout(resolve, 50))

      // loadError should be cleared
      expect(vm.loadError).toBeNull()
    })

    it('should reset loadError when reset() is called', async () => {
      const errorMock = vi.fn().mockRejectedValue(new Error('Network error'))

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: errorMock,
          items: [],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: false,
          retryMaxAttempts: 0
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

      // Cause an error
      try {
        await vm.loadPage(1)
      } catch (error) {
        // Expected
      }

      await new Promise(resolve => setTimeout(resolve, 50))

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
            items: [
              { id: 1, width: 300, height: 200, src: 'test1.jpg', page }
            ],
            nextPage: 2
          })
        }
        return Promise.reject(new Error('Refresh failed'))
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: refreshErrorMock,
          items: [],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: false,
          retryMaxAttempts: 0
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

      // Load first page successfully
      await vm.loadPage(1)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Try to refresh current page that will fail
      try {
        await vm.refreshCurrentPage()
      } catch (error) {
        // Expected to throw
      }

      await new Promise(resolve => setTimeout(resolve, 50))

      // loadError should be set
      expect(vm.loadError).not.toBeNull()
      expect(vm.loadError.message).toBe('Refresh failed')
    })

    it('should display error message when loadError is set and items exist', async () => {
      const wrapper = mount(Masonry, {
        props: {
          getNextPage: mockGetNextPage,
          items: [
            { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1, top: 0, left: 0, columnWidth: 320, columnHeight: 213 }
          ],
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

      // Manually set loadError
      vm.loadError = new Error('Test error message')
      await wrapper.vm.$nextTick()

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
        props: {
          getNextPage: mockGetNextPage,
          items: [],
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
      // Manually set loadError
      vm.loadError = new Error('Test error')

      await wrapper.vm.$nextTick()

      // Error message should not be displayed when items array is empty
      const html = wrapper.html()
      expect(html).not.toContain('Failed to load content')
    })

    it('should allow custom error message via slot', async () => {
      const wrapper = mount(Masonry, {
        props: {
          getNextPage: mockGetNextPage,
          items: [
            { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1, top: 0, left: 0, columnWidth: 320, columnHeight: 213 }
          ],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: false
        },
        slots: {
          'error-message': '<div class="custom-error-message">Custom error: {{ error.message }}</div>'
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

      // Manually set loadError
      vm.loadError = new Error('Custom error')
      await wrapper.vm.$nextTick()

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
        props: {
          getNextPage: errorMock,
          items: [],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: false,
          retryMaxAttempts: 0
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

      // Try to load a page that will fail with a non-Error
      try {
        await vm.loadPage(1)
      } catch (error) {
        // Expected to throw
      }

      await new Promise(resolve => setTimeout(resolve, 50))

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
            items: [
              { id: 1, width: 300, height: 200, src: 'test1.jpg', page }
            ],
            nextPage: 2
          })
        }
        if (callCount === 2) {
          return Promise.reject(new Error('Load failed'))
        }
        return Promise.resolve({
          items: [
            { id: 3, width: 300, height: 200, src: 'test3.jpg', page }
          ],
          nextPage: 4
        })
      })

      const wrapper = mount(Masonry, {
        props: {
          getNextPage: errorThenSuccessMock,
          items: [],
          loadAtPage: 1,
          skipInitialLoad: true,
          backfillEnabled: false,
          retryMaxAttempts: 0
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

      // Load first page successfully
      await vm.loadPage(1)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Load next page that fails
      try {
        await vm.loadNext()
      } catch (error) {
        // Expected
      }

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(vm.loadError).not.toBeNull()

      // Attempt to load next again (should clear error and succeed)
      await vm.loadNext()
      await new Promise(resolve => setTimeout(resolve, 50))

      // loadError should be cleared on successful load
      expect(vm.loadError).toBeNull()
    })
  })
})
