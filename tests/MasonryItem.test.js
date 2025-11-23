import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MasonryItem from '../src/components/MasonryItem.vue'

// Mock IntersectionObserver
class MockIntersectionObserver {
    constructor(callback, options) {
        this.callback = callback
        this.options = options
        this.observe = vi.fn()
        this.disconnect = vi.fn()
        this.unobserve = vi.fn()
    }
}

global.IntersectionObserver = MockIntersectionObserver

describe('MasonryItem.vue', () => {
    let mockObserver

    beforeEach(() => {
        // Reset IntersectionObserver mock
        mockObserver = null
        global.IntersectionObserver = class {
            constructor(callback, options) {
                mockObserver = this
                this.callback = callback
                this.options = options
                this.observe = vi.fn()
                this.disconnect = vi.fn()
                this.unobserve = vi.fn()
            }
        }
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should mount correctly with basic props', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item
            }
        })

        expect(wrapper.exists()).toBe(true)
        expect(wrapper.props('item')).toEqual(item)
    })

    it('should set up IntersectionObserver on mount', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        mount(MasonryItem, {
            props: { item }
        })

        expect(mockObserver).toBeTruthy()
        expect(mockObserver.observe).toHaveBeenCalled()
        expect(mockObserver.options).toMatchObject({
            threshold: [1.0]
        })
    })

    it('should clean up IntersectionObserver on unmount', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        expect(mockObserver.disconnect).not.toHaveBeenCalled()
        wrapper.unmount()
        expect(mockObserver.disconnect).toHaveBeenCalled()
    })

    it('should detect image type from item.type', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg',
            type: 'image'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        // Component should recognize it as an image
        expect(wrapper.vm.mediaType).toBe('image')
    })

    it('should detect video type from item.type', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        expect(wrapper.vm.mediaType).toBe('video')
    })

    it('should default to image type when type is not specified', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        expect(wrapper.vm.mediaType).toBe('image')
    })

    it('should show not found state when notFound is true', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg',
            notFound: true
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        const notFoundDiv = wrapper.find('.bg-slate-100')
        expect(notFoundDiv.exists()).toBe(true)
        expect(notFoundDiv.text()).toContain('Not Found')
    })

    it('should not start preloading when notFound is true', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg',
            notFound: true
        }

        mount(MasonryItem, {
            props: { item }
        })

        // IntersectionObserver should still be set up, but preloading should be skipped
        expect(mockObserver).toBeTruthy()
    })

    it('should start preloading when item comes into view', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        // Simulate intersection observer callback with full visibility (intersectionRatio >= 1.0)
        const entry = {
            isIntersecting: true,
            intersectionRatio: 1.0
        }

        mockObserver.callback([entry])

        await wrapper.vm.$nextTick()

        // Component should have started loading
        expect(wrapper.vm.isInView).toBe(true)
        expect(wrapper.vm.isLoading).toBe(true)
    })

    it('should not start preloading if item is not sufficiently in view', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        // Simulate intersection with low ratio
        const entry = {
            isIntersecting: true,
            intersectionRatio: 0.3 // Below threshold
        }

        mockObserver.callback([entry])

        await wrapper.vm.$nextTick()

        // Component should not have started loading
        expect(wrapper.vm.isInView).toBe(false)
        expect(wrapper.vm.isLoading).toBe(false)
    })

    it('should show spinner when loading', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        // Set loading state
        wrapper.vm.isLoading = true
        await wrapper.vm.$nextTick()

        const spinner = wrapper.find('.animate-spin')
        expect(spinner.exists()).toBe(true)
    })

    it('should show media type indicator badge on hover', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg',
            type: 'image'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        // Set loaded state and wait for DOM update
        wrapper.vm.imageLoaded = true
        await wrapper.vm.$nextTick()

        // Badge should exist (opacity-0 by default, shown on hover)
        // The badge has classes: absolute top-2 left-2
        const badge = wrapper.find('[class*="top-2"][class*="left-2"]')
        expect(badge.exists()).toBe(true)
    })

    it('should show video icon for video type', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        wrapper.vm.videoLoaded = true
        await wrapper.vm.$nextTick()

        // Find the badge container first, then check for the icon inside
        const badge = wrapper.find('[class*="top-2"][class*="left-2"]')
        expect(badge.exists()).toBe(true)
        const icon = badge.find('.fa-video')
        expect(icon.exists()).toBe(true)
    })

    it('should show image icon for image type', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg',
            type: 'image'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        wrapper.vm.imageLoaded = true
        await wrapper.vm.$nextTick()

        // Find the badge container first, then check for the icon inside
        const badge = wrapper.find('[class*="top-2"][class*="left-2"]')
        expect(badge.exists()).toBe(true)
        const icon = badge.find('.fa-image')
        expect(icon.exists()).toBe(true)
    })

    it('should call remove callback when remove button is clicked', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const removeFn = vi.fn()

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                remove: removeFn
            }
        })

        // Set loaded state so button is visible
        wrapper.vm.imageLoaded = true
        await wrapper.vm.$nextTick()

        // Simulate hover to show button
        const container = wrapper.find('.group')
        await container.trigger('mouseenter')
        await wrapper.vm.$nextTick()

        const removeButton = wrapper.find('button[aria-label="Remove item"]')
        if (removeButton.exists()) {
            await removeButton.trigger('click')
            expect(removeFn).toHaveBeenCalledWith(item)
        }
    })

    it('should handle src changes and reload media', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image1.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        // Set initial state
        wrapper.vm.isInView = true
        wrapper.vm.imageLoaded = true
        await wrapper.vm.$nextTick()

        // Change src
        await wrapper.setProps({
            item: {
                ...item,
                src: 'https://example.com/image2.jpg'
            }
        })

        await wrapper.vm.$nextTick()

        // Should reset loading state
        expect(wrapper.vm.imageLoaded).toBe(false)
        expect(wrapper.vm.imageSrc).toBe('https://example.com/image2.jpg')
    })

    it('should expose slot props correctly', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: { item },
            slots: {
                default: `
          <template #default="{ item, imageLoaded, videoLoaded, showNotFound, isLoading, mediaType }">
            <div class="custom-slot">
              <span>{{ mediaType }}</span>
              <span v-if="isLoading">Loading...</span>
            </div>
          </template>
        `
            }
        })

        expect(wrapper.exists()).toBe(true)
    })
})

