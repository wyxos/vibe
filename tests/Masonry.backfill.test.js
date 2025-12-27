import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Masonry from '../src/Masonry.vue'
import { createMockGetPage, getDefaultProps, defaultStubs, wait, createTestItem } from './helpers/testSetup'

describe('Masonry.vue - Backfill Functionality', () => {
  let mockGetPage

  beforeEach(() => {
    mockGetPage = createMockGetPage()
  })

  describe('Basic Backfill Behavior', () => {
    it('should backfill when enabled and target count is not reached', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [createTestItem({ id: callCount, src: `test${callCount}.jpg`, page })],
          nextPage: callCount < 5 ? page + 1 : null
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          backfillDelayMs: 10,
          items: [createTestItem({ id: 0 })],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(100)

      // Start with 1 item, target is 1 + 10 = 11
      expect(vm.totalItems).toBe(1)

      // Trigger backfill
      await vm.maybeBackfillToTarget(1, true)
      await wait(500) // Wait for backfill to complete

      // Should have called getPage multiple times to reach target
      expect(backfillMock).toHaveBeenCalled()
      expect(callCount).toBeGreaterThan(0)
    }, 10000)

    it('should not backfill when mode is none (unless forced)', async () => {
      const backfillMock = vi.fn().mockResolvedValue({
        items: [createTestItem()],
        nextPage: 2
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'none',
          pageSize: 10,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state (simulating items already loaded)
      vm.items = []
      await vm.initialize([createTestItem()], 1, 2)
      await wait(50)

      // Reset mock call count after init
      backfillMock.mockClear()

      // Try to backfill without force
      await vm.maybeBackfillToTarget(1, false)
      await wait(100)

      // Should not have called getPage
      expect(backfillMock).not.toHaveBeenCalled()
    })

    it('should backfill when forced even if mode is none', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [createTestItem({ id: callCount, page })],
          nextPage: callCount < 3 ? page + 1 : null
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'none',
          pageSize: 10,
          backfillDelayMs: 10,
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(100)

      // Force backfill
      await vm.maybeBackfillToTarget(1, true)
      await wait(500)

      // Should have called getPage even though disabled
      expect(backfillMock).toHaveBeenCalled()
    }, 10000)

    it('should not backfill when already at target count', async () => {
      const backfillMock = vi.fn().mockResolvedValue({
        items: [createTestItem()],
        nextPage: 2
      })

      const items = Array.from({ length: 15 }, (_, i) => createTestItem({ id: i + 1 }))

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Set items via props and initialize pagination state
      await wrapper.setProps({ items })
      vm.currentPage = 1
      vm.paginationHistory = [1, 2]
      vm.isInitialized = true
      await wrapper.vm.$nextTick()
      await wait(100)

      // We have 15 items, target is 1 + 10 = 11, so we're already above target
      expect(vm.totalItems).toBe(15)

      // Reset mock call count after init
      backfillMock.mockClear()

      // Try to backfill
      await vm.maybeBackfillToTarget(1, true)
      await wait(100)

      // Should not have called getPage
      expect(backfillMock).not.toHaveBeenCalled()
    })

    it('should not backfill when already active', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation(async (page) => {
        callCount++
        await wait(50) // Simulate slow request
        return {
          items: [createTestItem({ id: callCount, page })],
          nextPage: callCount < 5 ? page + 1 : null
        }
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          backfillDelayMs: 10,
          backfillMaxCalls: 5,
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(100)

      // Start backfill
      const backfillPromise = vm.maybeBackfillToTarget(1, true)

      // Immediately try to start another backfill
      await vm.maybeBackfillToTarget(1, true)
      await wait(50)

      // Wait for first backfill to complete
      await backfillPromise
      await wait(200)

      // Should only have called getPage from the first backfill
      // The second call should have been ignored
      expect(callCount).toBeGreaterThan(0)
      expect(callCount).toBeLessThanOrEqual(5) // Should respect max calls
    }, 10000)
  })

  describe('Backfill Events', () => {
    it('should emit backfill:start event when backfill begins', async () => {
      const backfillMock = vi.fn().mockResolvedValue({
        items: [createTestItem()],
        nextPage: 2
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          backfillDelayMs: 10,
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(100)

      await vm.maybeBackfillToTarget(1, true)
      await wait(500)

      // Check that backfill:start was emitted
      const emitted = wrapper.emitted('backfill:start')
      expect(emitted).toBeDefined()
      expect(emitted.length).toBeGreaterThan(0)
      expect(emitted[0][0]).toMatchObject({
        target: expect.any(Number),
        fetched: expect.any(Number),
        calls: 0
      })
    }, 10000)

    it('should emit backfill:tick events during backfill delay', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [createTestItem({ id: callCount, page })],
          nextPage: callCount < 3 ? page + 1 : null
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          backfillDelayMs: 100,
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      await vm.maybeBackfillToTarget(1, true)
      await wait(400) // Wait for backfill with delays

      // Check that backfill:tick events were emitted
      const emitted = wrapper.emitted('backfill:tick')
      expect(emitted).toBeDefined()
      expect(emitted.length).toBeGreaterThan(0)
      emitted.forEach(event => {
        expect(event[0]).toMatchObject({
          fetched: expect.any(Number),
          target: expect.any(Number),
          calls: expect.any(Number),
          remainingMs: expect.any(Number),
          totalMs: expect.any(Number)
        })
      })
    })

    it('should emit backfill:stop event when backfill completes', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [createTestItem({ id: callCount, page })],
          nextPage: callCount < 2 ? page + 1 : null
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          backfillDelayMs: 10,
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      await vm.maybeBackfillToTarget(1, true)
      await wait(200)

      // Check that backfill:stop was emitted
      const emitted = wrapper.emitted('backfill:stop')
      expect(emitted).toBeDefined()
      expect(emitted.length).toBeGreaterThan(0)
      expect(emitted[0][0]).toMatchObject({
        fetched: expect.any(Number),
        calls: expect.any(Number)
      })
      expect(emitted[0][0].cancelled).toBeUndefined() // Not cancelled
    })
  })

  describe('Backfill Max Calls', () => {
    it('should respect backfillMaxCalls limit', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [createTestItem({ id: callCount, page })],
          nextPage: page + 1 // Always has next page
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 100, // Large page size so we need many calls
          backfillMaxCalls: 3,
          backfillDelayMs: 10,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state
      vm.items = []
      vm.initialize([createTestItem()], 1, 2)
      await wait(50)
      
      // Reset call count after setup
      callCount = 0
      backfillMock.mockClear()

      await vm.maybeBackfillToTarget(1, true)
      await wait(300)

      // Should have called getPage at most 3 times
      expect(callCount).toBeLessThanOrEqual(3)
    })

    it('should stop backfilling when max calls reached even if target not met', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [createTestItem({ id: callCount, page })], // Only 1 item per call
          nextPage: page + 1
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 20, // Need 20 items, but max calls is 2
          backfillMaxCalls: 2,
          backfillDelayMs: 10,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state
      vm.items = []
      vm.initialize([createTestItem()], 1, 2)
      await wait(50)
      
      // Reset call count after setup
      callCount = 0
      backfillMock.mockClear()

      await vm.maybeBackfillToTarget(1, true)
      await wait(200)

      // Should have called exactly 2 times (max calls)
      expect(callCount).toBe(2)
      // Should have less than target (1 + 2 = 3 items, target is 11)
      expect(vm.totalItems).toBeLessThan(11)
    })
  })

  describe('Backfill Cancellation', () => {
    it('should cancel backfill when cancelLoad is called', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation(async (page) => {
        callCount++
        await wait(50) // Simulate slow request
        return {
          items: [createTestItem({ id: callCount, page })],
          nextPage: page + 1
        }
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 100,
          backfillMaxCalls: 10,
          backfillDelayMs: 50,
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Start backfill
      const backfillPromise = vm.maybeBackfillToTarget(1, true)

      // Wait a bit then cancel
      await wait(100)
      vm.cancelLoad()
      await wait(100)

      await backfillPromise
      await wait(100)

      // Check that backfill:stop was emitted with cancelled flag
      const emitted = wrapper.emitted('backfill:stop')
      expect(emitted).toBeDefined()
      const cancelledEvent = emitted.find(e => e[0].cancelled === true)
      expect(cancelledEvent).toBeDefined()
      expect(cancelledEvent[0].cancelled).toBe(true)

      // Should have called getPage fewer times than max
      expect(callCount).toBeLessThan(10)
    })

    it('should not start new backfill when cancelRequested is true', async () => {
      const backfillMock = vi.fn().mockResolvedValue({
        items: [createTestItem()],
        nextPage: 2
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state
      vm.items = []
      vm.initialize([createTestItem()], 1, 2)
      await wait(50)
      
      // Clear mock after setup
      backfillMock.mockClear()

      // Cancel first
      vm.cancelLoad()
      await wait(50)

      // Try to backfill
      await vm.maybeBackfillToTarget(1, true)
      await wait(100)

      // Should not have called getPage
      expect(backfillMock).not.toHaveBeenCalled()
    })
  })

  describe('Backfill with End of List', () => {
    it('should stop backfilling when reaching end during backfill', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation((page) => {
        callCount++
        return Promise.resolve({
          items: [createTestItem({ id: callCount, page })],
          nextPage: callCount < 2 ? page + 1 : null // End after 2 calls
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 100, // Large target
          backfillMaxCalls: 10,
          backfillDelayMs: 10,
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      await vm.maybeBackfillToTarget(1, true)
      await wait(300)

      // Should have stopped when reaching end (after 2 calls)
      expect(callCount).toBe(2)
      expect(vm.hasReachedEnd).toBe(true)
    })

    it('should not backfill when hasReachedEnd is already true', async () => {
      const backfillMock = vi.fn().mockResolvedValue({
        items: [createTestItem()],
        nextPage: null
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state with hasReachedEnd = true
      vm.items = []
      vm.initialize([createTestItem()], 1, null)
      await wait(50)
      
      expect(vm.hasReachedEnd).toBe(true)
      
      // Clear mock after setup
      backfillMock.mockClear()

      // Try to backfill
      await vm.maybeBackfillToTarget(1, true)
      await wait(100)

      // Should not have called getPage
      expect(backfillMock).not.toHaveBeenCalled()
    })
  })

  describe('Backfill with Errors', () => {
    it('should continue backfilling after an error', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation((page) => {
        callCount++
        if (callCount === 2) {
          return Promise.reject(new Error('Temporary error'))
        }
        return Promise.resolve({
          items: [createTestItem({ id: callCount, page })],
          nextPage: callCount < 4 ? page + 1 : null
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 20,
          backfillMaxCalls: 5,
          backfillDelayMs: 10,
          retryMaxAttempts: 0, // Disable retries for faster test
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      await vm.maybeBackfillToTarget(1, true)
      await wait(500)

      // Should have continued after error (called more than 2 times)
      expect(callCount).toBeGreaterThan(2)
      // Error might be cleared if subsequent calls succeed, but backfill should continue
      // The important thing is that backfill continued despite the error
    })

    it('should stop backfilling if cancelled after error', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation(async (page) => {
        callCount++
        if (callCount === 2) {
          await wait(50)
          return Promise.reject(new Error('Error'))
        }
        await wait(50)
        return Promise.resolve({
          items: [createTestItem({ id: callCount, page })],
          nextPage: page + 1
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 100,
          backfillMaxCalls: 10,
          backfillDelayMs: 10,
          retryMaxAttempts: 0,
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Start backfill
      const backfillPromise = vm.maybeBackfillToTarget(1, true)

      // Wait for error to occur then cancel
      await wait(200)
      vm.cancelLoad()
      await wait(100)

      await backfillPromise
      await wait(100)

      // Should have stopped after cancellation
      expect(callCount).toBeLessThan(10)
    })
  })

  describe('Backfill Delay', () => {
    it('should respect backfillDelayMs between calls', async () => {
      let callCount = 0
      const callTimes = []
      const backfillMock = vi.fn().mockImplementation((page) => {
        callTimes.push(Date.now())
        callCount++
        return Promise.resolve({
          items: [createTestItem({ id: callCount, page })],
          nextPage: callCount < 3 ? page + 1 : null
        })
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          backfillMaxCalls: 3,
          backfillDelayMs: 100,
          items: [createTestItem()],
          init: 'auto'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      await vm.maybeBackfillToTarget(1, true)
      await wait(500)

      // Should have made multiple calls
      expect(callCount).toBeGreaterThan(1)

      // Check that there was delay between calls (allowing some tolerance)
      if (callTimes.length > 1) {
        const delays = []
        for (let i = 1; i < callTimes.length; i++) {
          delays.push(callTimes[i] - callTimes[i - 1])
        }
        // Each delay should be at least close to backfillDelayMs (allowing for execution time)
        delays.forEach(delay => {
          expect(delay).toBeGreaterThan(50) // At least 50ms (allowing for timing variance)
        })
      }
    })
  })

  describe('Backfill State Management', () => {
    it('should set isLoading to true during backfill', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation(async (page) => {
        callCount++
        await wait(50)
        return {
          items: [createTestItem({ id: callCount, page })],
          nextPage: callCount < 2 ? page + 1 : null
        }
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          backfillDelayMs: 50,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state
      vm.items = []
      vm.initialize([createTestItem()], 1, 2)
      await wait(50)
      
      expect(vm.isLoading).toBe(false)

      // Start backfill
      const backfillPromise = vm.maybeBackfillToTarget(1, true)

      // Check loading state during backfill
      await wait(10)
      expect(vm.isLoading).toBe(true)

      await backfillPromise
      await wait(100)

      // Should be false after completion
      expect(vm.isLoading).toBe(false)
    })

    it('should set isLoading to false when backfill is cancelled', async () => {
      let callCount = 0
      const backfillMock = vi.fn().mockImplementation(async (page) => {
        callCount++
        await wait(100)
        return {
          items: [createTestItem({ id: callCount, page })],
          nextPage: page + 1
        }
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 100,
          backfillDelayMs: 50,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state
      vm.items = []
      vm.initialize([createTestItem()], 1, 2)
      await wait(50)

      // Start backfill
      const backfillPromise = vm.maybeBackfillToTarget(1, true)

      await wait(50)
      expect(vm.isLoading).toBe(true)

      // Cancel
      vm.cancelLoad()
      await wait(50)

      // Should be false after cancellation
      expect(vm.isLoading).toBe(false)

      await backfillPromise
      await wait(100)
    })
  })

  describe('Backfill Edge Cases', () => {
    it('should handle backfill when paginationHistory is empty', async () => {
      const backfillMock = vi.fn().mockResolvedValue({
        items: [createTestItem()],
        nextPage: 2
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 10,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state
      vm.items = []
      await vm.initialize([createTestItem()], 1, null)
      await wait(50)
      
      // Manually clear pagination history
      vm.paginationHistory = []
      
      // Clear mock after setup
      backfillMock.mockClear()

      await vm.maybeBackfillToTarget(1, true)
      await wait(100)

      // Should not have called getPage (no next page available)
      expect(backfillMock).not.toHaveBeenCalled()
      expect(vm.hasReachedEnd).toBe(true)
    })

    it('should handle backfill with zero pageSize', async () => {
      const backfillMock = vi.fn().mockResolvedValue({
        items: [createTestItem()],
        nextPage: 2
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: 0,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state
      vm.items = []
      vm.initialize([createTestItem()], 1, 2)
      await wait(50)
      
      // Clear mock after setup
      backfillMock.mockClear()

      await vm.maybeBackfillToTarget(1, true)
      await wait(100)

      // Should not have called getPage (invalid pageSize)
      expect(backfillMock).not.toHaveBeenCalled()
    })

    it('should handle backfill with negative pageSize', async () => {
      const backfillMock = vi.fn().mockResolvedValue({
        items: [createTestItem()],
        nextPage: 2
      })

      const wrapper = mount(Masonry, {
        props: getDefaultProps({
          getPage: backfillMock,
          mode: 'backfill',
          pageSize: -10,
          items: [],
          init: 'manual'
        }),
        global: { stubs: defaultStubs }
      })

      const vm = wrapper.vm
      await wait(50)

      // Manually set up state
      vm.items = []
      vm.initialize([createTestItem()], 1, 2)
      await wait(50)
      
      // Clear mock after setup
      backfillMock.mockClear()

      await vm.maybeBackfillToTarget(1, true)
      await wait(100)

      // Should not have called getPage (invalid pageSize)
      expect(backfillMock).not.toHaveBeenCalled()
    })
  })
})

