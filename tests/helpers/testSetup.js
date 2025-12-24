import { vi } from 'vitest'

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

/**
 * Creates a default mock for getNextPage function
 */
export function createMockGetNextPage(options = {}) {
  const {
    items = [
      { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1 },
      { id: 2, width: 400, height: 300, src: 'test2.jpg', page: 1 }
    ],
    nextPage = 2
  } = options

  return vi.fn().mockResolvedValue({
    items,
    nextPage
  })
}

/**
 * Default props for mounting Masonry component in tests
 */
export function getDefaultProps(overrides = {}) {
  return {
    getNextPage: createMockGetNextPage(),
    items: [],
    loadAtPage: 1,
    init: 'auto',
    mode: 'none',
    ...overrides
  }
}

/**
 * Default global stubs for mounting Masonry component
 */
export const defaultStubs = {
  'transition-group': {
    template: '<div><slot /></div>'
  }
}

/**
 * Helper to wait for async operations in tests
 */
export function wait(ms = 50) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Helper to create a test item with all required properties
 */
export function createTestItem(overrides = {}) {
  return {
    id: 1,
    width: 300,
    height: 200,
    src: 'test1.jpg',
    page: 1,
    top: 0,
    left: 0,
    columnWidth: 320,
    columnHeight: 213,
    ...overrides
  }
}

