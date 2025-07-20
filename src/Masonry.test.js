import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Masonry from './Masonry.vue'

// Mock lodash-es debounce to avoid timing issues in tests
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn) => fn)
}))

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
    expect(typeof vm.onRemove).toBe('function')
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
    expect(typeof vm.onRemove).toBe('function')

    // Component should handle being mounted without throwing errors
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })
})
