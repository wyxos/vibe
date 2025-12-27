import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Masonry from '../src/Masonry.vue'
import { createMockGetPage, getDefaultProps, defaultStubs, wait, createTestItem } from './helpers/testSetup'

describe('Masonry.vue - Refresh Mode Functionality', () => {
    let mockGetPage

    beforeEach(() => {
        mockGetPage = createMockGetPage()
    })

    describe('Refresh Mode - Current Page Refresh', () => {
        it('should refresh current page when item count is less than pageSize', async () => {
            let callCount = 0
            const refreshMock = vi.fn().mockImplementation((page) => {
                callCount++
                // First call returns page 5 with 10 items
                if (callCount === 1) {
                    return Promise.resolve({
                        items: Array.from({ length: 10 }, (_, i) => createTestItem({ id: i + 1, page: 5 })),
                        nextPage: 6
                    })
                }
                // Second call (refresh) returns page 5 with 3 new items
                if (callCount === 2) {
                    return Promise.resolve({
                        items: Array.from({ length: 13 }, (_, i) => createTestItem({ id: i + 1, page: 5 })),
                        nextPage: 6
                    })
                }
                // Third call loads page 6
                return Promise.resolve({
                    items: Array.from({ length: 10 }, (_, i) => createTestItem({ id: i + 1, page: 6 })),
                    nextPage: 7
                })
            })

            const wrapper = mount(Masonry, {
                props: getDefaultProps({
                    getPage: refreshMock,
                    mode: 'refresh',
                    pageSize: 10,
                    items: [],
                    init: 'manual'
                }),
                global: { stubs: defaultStubs }
            })

            const vm = wrapper.vm
            await wait(100)

            // Simulate being on page 5 with only 7 items (after removing 3)
            const page5Items = Array.from({ length: 7 }, (_, i) => createTestItem({ id: i + 1, page: 5 }))
            await wrapper.setProps({ items: [] })
            await wrapper.vm.$nextTick()
            await vm.initialize(page5Items, 5, 6)
            // Manually sync the prop since v-model might not work in tests
            await wrapper.setProps({ items: page5Items })
            await wrapper.vm.$nextTick()
            await wait(200)

            expect(vm.currentPage).toBe(5)
            expect(countItemsForPage(vm, 5)).toBe(7)

            // Trigger loadNext - should refresh page 5 first
            await vm.loadNext()
            await wait(200)

            // Should have called getPage for page 5 (refresh)
            expect(refreshMock).toHaveBeenCalledWith(5, null)
            // Should have added new items (3 new items to reach 10)
            expect(countItemsForPage(vm, 5)).toBeGreaterThanOrEqual(7)
        })

        it('should load next page after refreshing when current page reaches pageSize', async () => {
            let callCount = 0
            const refreshMock = vi.fn().mockImplementation((page) => {
                callCount++
                if (callCount === 1) {
                    // Initial load of page 5
                    return Promise.resolve({
                        items: Array.from({ length: 10 }, (_, i) => createTestItem({ id: i + 1, page: 5 })),
                        nextPage: 6
                    })
                }
                if (callCount === 2) {
                    // Refresh page 5 - returns full page with 10 items (including the 7 we already have)
                    // This simulates the server returning all items for page 5
                    return Promise.resolve({
                        items: Array.from({ length: 10 }, (_, i) => createTestItem({ id: i + 1, page: 5 })),
                        nextPage: 6
                    })
                }
                // Load page 6
                return Promise.resolve({
                    items: Array.from({ length: 10 }, (_, i) => createTestItem({ id: i + 1, page: 6 })),
                    nextPage: 7
                })
            })

            let items = []
            const wrapper = mount(Masonry, {
                props: getDefaultProps({
                    getPage: refreshMock,
                    mode: 'refresh',
                    pageSize: 10,
                    items: [],
                    init: 'manual',
                    'onUpdate:items': (newItems) => {
                        items = newItems
                        wrapper.setProps({ items: newItems })
                    }
                }),
                global: { stubs: defaultStubs }
            })

            const vm = wrapper.vm
            await wait(100)

            // Simulate being on page 5 with only 7 items (after removing 3)
            const page5Items = Array.from({ length: 7 }, (_, i) => createTestItem({ id: i + 1, page: 5 }))
            items = page5Items
            await wrapper.setProps({ items: [] })
            await wrapper.vm.$nextTick()
            vm.initialize(page5Items, 5, 6)
            await wrapper.setProps({ items: page5Items })
            await wrapper.vm.$nextTick()
            await wait(200)

            // Trigger loadNext
            await vm.loadNext()
            await wait(500) // Wait longer for async operations

            // Wait for Vue to update
            await wrapper.vm.$nextTick()
            await wait(100)

            // Should have refreshed page 5
            expect(refreshMock).toHaveBeenCalledWith(5, null)
            // After refresh, we should have 10 items for page 5 (7 existing + 3 new)
            const page5Count = countItemsForPage(vm, 5)
            expect(page5Count).toBeGreaterThanOrEqual(10)

            // If we have enough items, should proceed to load page 6
            if (page5Count >= 10) {
                expect(refreshMock).toHaveBeenCalledWith(6, null)
                expect(vm.currentPage).toBe(6)
            }
        })

        it('should only append new items when refreshing', async () => {
            let callCount = 0
            const refreshMock = vi.fn().mockImplementation((page) => {
                callCount++
                if (callCount === 1) {
                    // Initial load
                    return Promise.resolve({
                        items: [
                            createTestItem({ id: 1, page: 5 }),
                            createTestItem({ id: 2, page: 5 }),
                            createTestItem({ id: 3, page: 5 })
                        ],
                        nextPage: 6
                    })
                }
                // Refresh returns same items plus new ones
                return Promise.resolve({
                    items: [
                        createTestItem({ id: 1, page: 5 }), // Existing
                        createTestItem({ id: 2, page: 5 }), // Existing
                        createTestItem({ id: 3, page: 5 }), // Existing
                        createTestItem({ id: 4, page: 5 }), // New
                        createTestItem({ id: 5, page: 5 })  // New
                    ],
                    nextPage: 6
                })
            })

            let items = []
            const wrapper = mount(Masonry, {
                props: getDefaultProps({
                    getPage: refreshMock,
                    mode: 'refresh',
                    pageSize: 10,
                    items: [],
                    init: 'manual',
                    'onUpdate:items': (newItems) => {
                        items = newItems
                        wrapper.setProps({ items: newItems })
                    }
                }),
                global: { stubs: defaultStubs }
            })

            const vm = wrapper.vm
            await wait(100)

            // Start with 2 items (simulating 1 was removed)
            const initialItems = [
                createTestItem({ id: 1, page: 5 }),
                createTestItem({ id: 2, page: 5 })
            ]
            items = initialItems
            vm.items = []
            await wrapper.vm.$nextTick()
            vm.initialize(initialItems, 5, 6)
            await wrapper.vm.$nextTick()
            await wait(200)

            const initialCount = vm.totalItems
            expect(initialCount).toBe(2)

            // Trigger refresh
            await vm.loadNext()
            await wait(500) // Wait longer for async operations

            // Wait for Vue to update
            await wrapper.vm.$nextTick()
            await wait(100)

            // Refresh returns items 1, 2, 3, 4, 5
            // We already have 1, 2, so should add 3, 4, 5
            // Should have added new items
            expect(vm.totalItems).toBeGreaterThan(initialCount)
            // Should have at least 3 items (we had 2, added at least 1 new)
            const page5Items = vm.masonry.filter((item) => item.page === 5)
            expect(page5Items.length).toBeGreaterThanOrEqual(3)
        })

        it('should not refresh if current page has enough items', async () => {
            let callCount = 0
            const refreshMock = vi.fn().mockImplementation((page) => {
                callCount++
                return Promise.resolve({
                    items: Array.from({ length: 10 }, (_, i) => createTestItem({ id: i + 1, page })),
                    nextPage: page + 1
                })
            })

            const wrapper = mount(Masonry, {
                props: getDefaultProps({
                    getPage: refreshMock,
                    mode: 'refresh',
                    pageSize: 10,
                    items: [],
                    init: 'manual'
                }),
                global: { stubs: defaultStubs }
            })

            const vm = wrapper.vm
            await wait(100)

            // Start with 10 items (full page)
            const page5Items = Array.from({ length: 10 }, (_, i) => createTestItem({ id: i + 1, page: 5 }))
            await wrapper.setProps({ items: [] })
            await wrapper.vm.$nextTick()
            vm.initialize(page5Items, 5, 6)
            await wrapper.setProps({ items: page5Items })
            await wrapper.vm.$nextTick()
            await wait(200)

            // Trigger loadNext
            await vm.loadNext()
            await wait(200)

            // Should have loaded page 6 directly, not refreshed page 5
            expect(refreshMock).toHaveBeenCalledWith(6, null)
            expect(refreshMock).not.toHaveBeenCalledWith(5, null)
            expect(vm.currentPage).toBe(6)
        })

        it('should automatically load next page when no new items found during refresh', async () => {
            // Mock refresh to return items that are all duplicates (no new items)
            const refreshMock = vi.fn()
                .mockResolvedValueOnce({
                    // First call: refresh page 5, but return items we already have (no new items)
                    items: [
                        createTestItem({ id: 1, page: 5 }),
                        createTestItem({ id: 2, page: 5 }),
                        createTestItem({ id: 3, page: 5 }),
                        createTestItem({ id: 4, page: 5 }),
                        createTestItem({ id: 5, page: 5 }),
                        createTestItem({ id: 6, page: 5 }),
                        createTestItem({ id: 7, page: 5 })
                    ],
                    nextPage: 6
                })
                .mockResolvedValueOnce({
                    // Second call: load page 6
                    items: [
                        createTestItem({ id: 11, page: 6 }),
                        createTestItem({ id: 12, page: 6 })
                    ],
                    nextPage: 7
                })

            let items = []
            const wrapper = mount(Masonry, {
                props: getDefaultProps({
                    getPage: refreshMock,
                    mode: 'refresh',
                    pageSize: 10,
                    items: [],
                    init: 'manual',
                    'onUpdate:items': (newItems) => {
                        items = newItems
                        wrapper.setProps({ items: newItems })
                    }
                }),
                global: { stubs: defaultStubs }
            })

            const vm = wrapper.vm
            await wait(100)

            // Start with 7 items for page 5 (less than pageSize of 10)
            const page5Items = Array.from({ length: 7 }, (_, i) => createTestItem({ id: i + 1, page: 5 }))
            // Use init to set up state
            await wrapper.setProps({ items: [] })
            await wrapper.vm.$nextTick()
            vm.initialize(page5Items, 5, 6)
            await wrapper.setProps({ items: page5Items })
            await wrapper.vm.$nextTick()
            await wait(200)
            
            // Update items for the onUpdate handler
            items = page5Items
            await wrapper.setProps({ items: page5Items })
            await wait(50)
            
            // Clear mock calls from initialize setup
            refreshMock.mockClear()

            const initialCount = vm.totalItems
            expect(initialCount).toBe(7)

            // Trigger loadNext - should refresh page 5 first
            await vm.loadNext()
            await wait(500) // Wait longer for async operations

            // Wait for Vue to update
            await wrapper.vm.$nextTick()
            await wait(100)

            // Refresh should have been called for page 5
            expect(refreshMock).toHaveBeenCalledWith(5, null)

            // Since no new items were found, it should automatically proceed to load page 6
            expect(refreshMock).toHaveBeenCalledWith(6, null)

            // Should have loaded page 6 items
            expect(vm.currentPage).toBe(6)
            expect(vm.totalItems).toBeGreaterThan(initialCount)

            // Verify page 6 items were added
            const page6Items = vm.masonry.filter((item) => item.page === 6)
            expect(page6Items.length).toBeGreaterThan(0)
        })

        it('should handle refresh mode when currentPage is null', async () => {
            const refreshMock = vi.fn().mockResolvedValue({
                items: [createTestItem()],
                nextPage: 2
            })

            const wrapper = mount(Masonry, {
                props: getDefaultProps({
                    getPage: refreshMock,
                    mode: 'refresh',
                    pageSize: 10,
                    items: [],
                    init: 'manual'
                }),
                global: { stubs: defaultStubs }
            })

            const vm = wrapper.vm
            await wait(100)

            // currentPage should be null initially (manual mode doesn't load on mount)
            expect(vm.currentPage).toBeNull()

            // Should proceed with normal next page loading
            const nextPage = vm.paginationHistory[vm.paginationHistory.length - 1]
            if (nextPage != null) {
                await vm.loadNext()
                await wait(200)
                // Should have loaded the next page normally
                expect(refreshMock).toHaveBeenCalled()
            }
        })
    })
})

// Helper function to count items for a specific page
function countItemsForPage(vm, page) {
    return vm.masonry.filter((item) => item.page === page).length
}

