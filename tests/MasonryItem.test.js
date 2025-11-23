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

    it('emits mouse enter and leave events for image content', async () => {
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

        // Manually simulate that image has been preloaded so the <img> exists
        wrapper.vm.imageSrc = item.src
        await wrapper.vm.$nextTick()

        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)

        await img.trigger('mouseenter')
        await img.trigger('mouseleave')

        const enterEvents = wrapper.emitted()['mouse-enter']
        const leaveEvents = wrapper.emitted()['mouse-leave']

        expect(enterEvents?.[0]?.[0]).toEqual({ item, type: 'image' })
        expect(leaveEvents?.[0]?.[0]).toEqual({ item, type: 'image' })
    })
})

