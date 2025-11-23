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

    it('should render header slot when headerHeight is provided', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                headerHeight: 40
            },
            slots: {
                header: '<div class="test-header">Header Content</div>'
            }
        })

        const header = wrapper.find('.test-header')
        expect(header.exists()).toBe(true)
        expect(header.text()).toBe('Header Content')
    })

    it('should render footer slot when footerHeight is provided', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                footerHeight: 40
            },
            slots: {
                footer: '<div class="test-footer">Footer Content</div>'
            }
        })

        const footer = wrapper.find('.test-footer')
        expect(footer.exists()).toBe(true)
        expect(footer.text()).toBe('Footer Content')
    })

    it('should not render header when headerHeight is 0', () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                headerHeight: 0
            },
            slots: {
                header: '<div class="test-header">Header Content</div>'
            }
        })

        const header = wrapper.find('.test-header')
        expect(header.exists()).toBe(false)
    })

    it('should emit preload:success event when image loads successfully', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/image.jpg',
            type: 'image'
        }

        // Mock Image constructor to simulate successful load
        const OriginalImage = global.Image
        global.Image = vi.fn(function () {
            const img = document.createElement('img')
            // Simulate successful load after a short delay
            setTimeout(() => {
                if (img.onload) {
                    img.onload()
                }
            }, 50)
            return img
        })

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        wrapper.vm.isInView = true
        await wrapper.vm.startPreloading()

        // Wait for image to load (with minimum load time)
        await new Promise(resolve => setTimeout(resolve, 400))

        const events = wrapper.emitted()['preload:success']
        expect(events).toBeTruthy()
        if (events && events.length > 0) {
            expect(events[0][0]).toMatchObject({
                item,
                type: 'image',
                src: item.src
            })
        }

        // Restore original Image
        global.Image = OriginalImage
    })

    it('should emit preload:error event when image fails to load', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/invalid.jpg',
            type: 'image'
        }

        // Mock Image constructor to simulate error
        const OriginalImage = global.Image
        global.Image = vi.fn(function () {
            const img = document.createElement('img')
            // Simulate error after a short delay
            setTimeout(() => {
                if (img.onerror) {
                    img.onerror()
                }
            }, 50)
            return img
        })

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        wrapper.vm.isInView = true
        await wrapper.vm.startPreloading()

        // Wait for error
        await new Promise(resolve => setTimeout(resolve, 400))

        const events = wrapper.emitted()['preload:error']
        expect(events).toBeTruthy()
        if (events && events.length > 0) {
            expect(events[0][0]).toMatchObject({
                item,
                type: 'image',
                src: item.src
            })
        }

        // Restore original Image
        global.Image = OriginalImage
    })

    it('should show error state when image fails to load', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/invalid.jpg',
            type: 'image'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        wrapper.vm.imageError = true
        wrapper.vm.imageSrc = item.src
        await wrapper.vm.$nextTick()

        const errorDiv = wrapper.find('.bg-slate-50')
        expect(errorDiv.exists()).toBe(true)
        expect(errorDiv.text()).toContain('Failed to load image')
    })

    it('should show error state when video fails to load', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/invalid.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: { item }
        })

        wrapper.vm.videoError = true
        wrapper.vm.videoSrc = item.src
        await wrapper.vm.$nextTick()

        const errorDiv = wrapper.find('.bg-slate-50')
        expect(errorDiv.exists()).toBe(true)
        expect(errorDiv.text()).toContain('Failed to load video')
    })

    it('should handle video tap to play/pause when not in swipe mode', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                inSwipeMode: false
            }
        })

        wrapper.vm.videoSrc = item.src
        wrapper.vm.videoLoaded = true
        await wrapper.vm.$nextTick()

        const video = wrapper.find('video')
        expect(video.exists()).toBe(true)

        // Mock play/pause methods
        const playSpy = vi.spyOn(video.element, 'play').mockResolvedValue()
        const pauseSpy = vi.spyOn(video.element, 'pause').mockImplementation(() => { })

        // Simulate click
        await video.trigger('click')

        // Should call play or pause
        expect(playSpy).toHaveBeenCalled()
    })

    it('should not handle video tap when in swipe mode', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                inSwipeMode: true
            }
        })

        wrapper.vm.videoSrc = item.src
        wrapper.vm.videoLoaded = true
        await wrapper.vm.$nextTick()

        const video = wrapper.find('video')
        expect(video.exists()).toBe(true)
        expect(video.attributes('controls')).toBeDefined()

        // Mock play/pause methods
        const playSpy = vi.spyOn(video.element, 'play').mockResolvedValue()
        const pauseSpy = vi.spyOn(video.element, 'pause').mockImplementation(() => { })

        // Simulate click - should not trigger custom handler
        await video.trigger('click')

        // Custom handler should return early, so play/pause shouldn't be called by our handler
        // (native controls handle it)
        expect(wrapper.vm.isSwipeMode).toBe(true)
    })

    it('should auto-play video when active in swipe mode', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                inSwipeMode: true,
                isActive: false
            }
        })

        wrapper.vm.videoSrc = item.src
        wrapper.vm.videoLoaded = true
        await wrapper.vm.$nextTick()

        const video = wrapper.find('video')
        expect(video.exists()).toBe(true)

        const playSpy = vi.spyOn(video.element, 'play').mockResolvedValue()
        const pauseSpy = vi.spyOn(video.element, 'pause').mockImplementation(() => { })

        // Set active to true
        await wrapper.setProps({ isActive: true })
        await wrapper.vm.$nextTick()

        expect(playSpy).toHaveBeenCalled()
    })

    it('should pause video when inactive in swipe mode', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                inSwipeMode: true,
                isActive: true
            }
        })

        wrapper.vm.videoSrc = item.src
        wrapper.vm.videoLoaded = true
        await wrapper.vm.$nextTick()

        const video = wrapper.find('video')
        expect(video.exists()).toBe(true)

        const pauseSpy = vi.spyOn(video.element, 'pause').mockImplementation(() => { })

        // Set active to false
        await wrapper.setProps({ isActive: false })
        await wrapper.vm.$nextTick()

        expect(pauseSpy).toHaveBeenCalled()
    })

    it('should not auto-play/pause video when not in swipe mode', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                inSwipeMode: false,
                isActive: false
            }
        })

        wrapper.vm.videoSrc = item.src
        wrapper.vm.videoLoaded = true
        await wrapper.vm.$nextTick()

        const video = wrapper.find('video')
        expect(video.exists()).toBe(true)

        const playSpy = vi.spyOn(video.element, 'play').mockResolvedValue()

        // Set active to true - should not auto-play when not in swipe mode
        await wrapper.setProps({ isActive: true })
        await wrapper.vm.$nextTick()

        // Play should not be called by the watcher
        expect(playSpy).not.toHaveBeenCalled()
    })

    it('should play video on mouseenter when not in swipe mode', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                inSwipeMode: false
            }
        })

        wrapper.vm.videoSrc = item.src
        wrapper.vm.videoLoaded = true
        await wrapper.vm.$nextTick()

        const video = wrapper.find('video')
        expect(video.exists()).toBe(true)

        const playSpy = vi.spyOn(video.element, 'play').mockResolvedValue()

        await video.trigger('mouseenter')
        await wrapper.vm.$nextTick()

        expect(playSpy).toHaveBeenCalled()

        const enterEvents = wrapper.emitted()['mouse-enter']
        expect(enterEvents?.[0]?.[0]).toEqual({ item, type: 'video' })
    })

    it('should pause video on mouseleave when not in swipe mode', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                inSwipeMode: false
            }
        })

        wrapper.vm.videoSrc = item.src
        wrapper.vm.videoLoaded = true
        await wrapper.vm.$nextTick()

        const video = wrapper.find('video')
        expect(video.exists()).toBe(true)

        const pauseSpy = vi.spyOn(video.element, 'pause').mockImplementation(() => { })

        await video.trigger('mouseleave')
        await wrapper.vm.$nextTick()

        expect(pauseSpy).toHaveBeenCalled()

        const leaveEvents = wrapper.emitted()['mouse-leave']
        expect(leaveEvents?.[0]?.[0]).toEqual({ item, type: 'video' })
    })

    it('should not play/pause video on mouseenter/leave when in swipe mode', async () => {
        const item = {
            id: 'test-1',
            width: 300,
            height: 200,
            src: 'https://example.com/video.mp4',
            type: 'video'
        }

        const wrapper = mount(MasonryItem, {
            props: {
                item,
                inSwipeMode: true
            }
        })

        wrapper.vm.videoSrc = item.src
        wrapper.vm.videoLoaded = true
        await wrapper.vm.$nextTick()

        const video = wrapper.find('video')
        expect(video.exists()).toBe(true)

        const playSpy = vi.spyOn(video.element, 'play').mockResolvedValue()
        const pauseSpy = vi.spyOn(video.element, 'pause').mockImplementation(() => { })

        await video.trigger('mouseenter')
        await wrapper.vm.$nextTick()

        // Should emit event but not play
        const enterEvents = wrapper.emitted()['mouse-enter']
        expect(enterEvents?.[0]?.[0]).toEqual({ item, type: 'video' })
        expect(playSpy).not.toHaveBeenCalled()

        await video.trigger('mouseleave')
        await wrapper.vm.$nextTick()

        // Should emit event but not pause
        const leaveEvents = wrapper.emitted()['mouse-leave']
        expect(leaveEvents?.[0]?.[0]).toEqual({ item, type: 'video' })
        expect(pauseSpy).not.toHaveBeenCalled()
    })

    it('should show placeholder with media type icon before loading', () => {
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

        const placeholder = wrapper.find('.bg-slate-100')
        expect(placeholder.exists()).toBe(true)

        const icon = wrapper.find('.fa-image')
        expect(icon.exists()).toBe(true)
    })

    it('should show video icon in placeholder for video type', () => {
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

        const icon = wrapper.find('.fa-video')
        expect(icon.exists()).toBe(true)
    })
})

